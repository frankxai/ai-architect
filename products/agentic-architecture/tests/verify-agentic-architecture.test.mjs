import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import { verifyAgenticArchitecture } from "../scripts/verify-agentic-architecture.mjs"
import {
  computeApprovalToken,
  createReferenceMcpServer,
  issueOAuth2AccessToken,
} from "../kit/mcp/reference-mcp-server.mjs"
import { ingestOtelTraceSpans } from "../kit/workbooks/evaluate-workbook.mjs"
import {
  assertDisjointWritePaths,
  assertMakerNotChecker,
  assertNoNestedSubagentSpawn,
  runSupervisorPipeline,
} from "../kit/workflows/supervisor-maker-checker.ts"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")

test("all 10 chapters (>= 1000 prose words each, zero boilerplate duplication), C4 diagrams, 10 ADRs (>= 3 rejected options), workbook, MCP server, workflows, prompts, competitive bar, and buyer page pass verification", async () => {
  const res = await verifyAgenticArchitecture(root)
  assert.equal(res.state, "AGENTIC_ARCHITECTURE_PLAYBOOK_AND_KIT_VERIFIED")
  assert.equal(res.chapters, 10)
  assert.equal(res.chapterWordCounts.length, 10)
  for (const ch of res.chapterWordCounts) {
    assert.ok(ch.proseWords >= 1000, `Chapter ${ch.file} has ${ch.proseWords} prose words, expected >= 1000`)
  }
  assert.equal(res.adrs.adrCount, 10)
  assert.equal(res.adrs.minRejectedAlternativesPerAdr, 3)
  assert.equal(res.workbook.threatsBoundToTests, 10)
  assert.equal(res.workbook.otelTraceIngestion.costPerAcceptedRunUsd, 0.448)
  assert.equal(res.mcpServerVerified.oauth2AudienceCheck, true)
  assert.equal(res.supervisorVerified.subagentSpawnBanVerified, true)

  // Verify zero shared long prose paragraphs across the 10 chapters
  const chapterDir = join(root, "playbook/chapters")
  const seenParagraphs = new Map()
  for (const file of readdirSync(chapterDir).filter((f) => f.endsWith(".md")).sort()) {
    const text = readFileSync(join(chapterDir, file), "utf8").replace(/```[\s\S]*?```/g, "")
    for (const line of text.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.length < 90 || trimmed.startsWith("#") || trimmed.startsWith("|")) continue
      const prevFile = seenParagraphs.get(trimmed)
      assert.equal(prevFile, undefined, `Duplicate boilerplate line found in ${file} and ${prevFile}: ${trimmed}`)
      seenParagraphs.set(trimmed, file)
    }
  }
})

test("reference MCP server enforces fail-closed secrets, OAuth 2.1 RFC 8707 audience/scope/expiry, authenticated self-approval ban, and HMAC tenant/expiry approval tokens", () => {
  assert.throws(() => createReferenceMcpServer({}), { code: "E_SERVER_UNCONFIGURED" })

  const approvalSecret = "a".repeat(36)
  const oauthTokenSecret = "o".repeat(36)
  const expectedAudience = "https://mcp.example.internal/agentic-architecture"
  const now = new Date("2026-10-24T12:00:00Z")
  const nowSec = Math.floor(now.getTime() / 1000)
  const mcp = createReferenceMcpServer({
    approvalSecret,
    oauthTokenSecret,
    expectedAudience,
    nowFn: () => now,
  })

  const makerBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_1",
        aud: expectedAudience,
        scope: "architecture:read architecture:draft",
        exp: nowSec + 600,
      },
      oauthTokenSecret,
    )
  const makerApproveScopeBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_1",
        aud: expectedAudience,
        scope: "architecture:approve",
        exp: nowSec + 600,
      },
      oauthTokenSecret,
    )
  const humanApproverBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "human:frank",
        tenantId: "tenant_1",
        aud: expectedAudience,
        scope: "architecture:approve",
        exp: nowSec + 600,
      },
      oauthTokenSecret,
    )
  const expiredBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "human:frank",
        tenantId: "tenant_1",
        aud: expectedAudience,
        scope: "architecture:read",
        exp: nowSec - 10,
      },
      oauthTokenSecret,
    )

  // Expired OAuth 2.1 token is rejected
  const expRes = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "architecture_lookup", arguments: {}, _meta: { authorization: expiredBearer } },
  })
  assert.equal(expRes.result.isError, true)
  assert.equal(expRes.result.code, "E_OAUTH_EXPIRED")

  // Cross-tenant read is rejected
  const tenantMismatch = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "architecture_lookup", arguments: { tenantId: "tenant_2" }, _meta: { authorization: makerBearer } },
  })
  assert.equal(tenantMismatch.result.isError, true)
  assert.equal(tenantMismatch.result.code, "E_TENANT_MISMATCH")

  // Authenticated self-approval is rejected even if the proposer holds architecture:approve scope
  const selfApprove = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "approve_release_gate",
      arguments: { releaseId: "r1", proposerSub: "agent:maker_01", expiresAt: nowSec + 300, approvalToken: "any" },
      _meta: { authorization: makerApproveScopeBearer },
    },
  })
  assert.equal(selfApprove.result.isError, true)
  assert.equal(selfApprove.result.code, "E_SELF_APPROVAL_FORBIDDEN")

  // Expired approvalToken is rejected
  const expiredApproval = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "approve_release_gate",
      arguments: { releaseId: "r1", proposerSub: "agent:maker_01", expiresAt: nowSec - 1, approvalToken: "any" },
      _meta: { authorization: humanApproverBearer },
    },
  })
  assert.equal(expiredApproval.result.isError, true)
  assert.equal(expiredApproval.result.code, "E_APPROVAL_EXPIRED")

  // Valid HMAC token bound to tenant_1, proposerSub, approverSub, and expiresAt succeeds
  const expiresAt = nowSec + 300
  const canonicalParams = JSON.stringify({ releaseId: "r1", tenantId: "tenant_1" })
  const token = computeApprovalToken({
    approvalSecret,
    tenantId: "tenant_1",
    toolName: "approve_release_gate",
    proposerSub: "agent:maker_01",
    approverSub: "human:frank",
    expiresAt,
    canonicalParams,
  })
  const approved = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "approve_release_gate",
      arguments: { releaseId: "r1", proposerSub: "agent:maker_01", expiresAt, approvalToken: token },
      _meta: { authorization: humanApproverBearer },
    },
  })
  assert.equal(approved.result.isError, false)
  assert.equal(approved.result.outcome, "approved")
  assert.equal(approved.result.approverSub, "human:frank")
})

test("TypeScript supervisor workflow enforces disjoint writePaths, cross-model checker isolation, recursion depth <= 1, and 80% budget ceiling, and OTel span ingester computes cost per accepted run", () => {
  assert.throws(
    () =>
      assertNoNestedSubagentSpawn([
        { id: "child", role: "maker", providerFamily: "google", readPaths: [], writePaths: [], parentTaskId: "parent_1", depth: 2, estimatedCostUsd: 0.5 },
      ]),
    { code: "E_RECURSION_DEPTH_EXCEEDED" },
  )
  assert.throws(
    () =>
      assertNoNestedSubagentSpawn([
        { id: "spawner", role: "maker", providerFamily: "google", readPaths: [], writePaths: [], allowedTools: ["dispatch_subagent"], estimatedCostUsd: 0.5 },
      ]),
    { code: "E_SUBAGENT_SPAWN_FORBIDDEN" },
  )
  assert.throws(
    () =>
      assertDisjointWritePaths([
        { id: "a", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["shared.ts"], estimatedCostUsd: 1 },
        { id: "b", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["shared.ts"], estimatedCostUsd: 1 },
      ]),
    { code: "E_WRITE_COLLISION" },
  )
  assert.throws(
    () =>
      assertMakerNotChecker(
        { id: "m", role: "maker", providerFamily: "anthropic", readPaths: [], writePaths: ["x"], estimatedCostUsd: 1 },
        { id: "c", role: "checker", providerFamily: "anthropic", readPaths: [], writePaths: [], estimatedCostUsd: 1 },
      ),
    { code: "E_CHECKER_ISOLATION" },
  )
  assert.throws(
    () =>
      runSupervisorPipeline({
        maxBudgetUsd: 5,
        wave: [],
        maker: { id: "m", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["a"], estimatedCostUsd: 3.0 },
        checker: { id: "c", role: "checker", providerFamily: "anthropic", readPaths: [], writePaths: [], estimatedCostUsd: 1.5 },
      }),
    { code: "E_BUDGET_EXCEEDED" },
  )

  assert.throws(
    () =>
      ingestOtelTraceSpans([
        { traceId: "t1", runId: "r1", attempt: 1, accepted: false, attributes: { "gen_ai.request.model": "tier-b-balanced-builder", "gen_ai.usage.input_tokens": 1000, "gen_ai.usage.output_tokens": 500 } },
      ]),
    /Zero accepted runs/,
  )
})
