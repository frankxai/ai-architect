import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import { verifyAgenticArchitecture } from "../scripts/verify-agentic-architecture.mjs"
import {
  createReferenceMcpServer,
  issueOAuth2AccessToken,
  startStreamableHttpMcpServer,
} from "../kit/mcp/reference-mcp-server.mjs"
import { ingestOtelTraceSpans } from "../kit/workbooks/evaluate-workbook.mjs"
import {
  assertDisjointWritePaths,
  assertMakerNotChecker,
  assertNoNestedSubagentSpawn,
  dispatchSupervisorPipeline,
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
  assert.equal(res.mcpServerVerified.rs256JwksVerified, true)
  assert.equal(res.mcpServerVerified.rfc9728StreamableHttpVerified, true)
  assert.equal(res.mcpServerVerified.stdioEnvAuthVerified, true)
  assert.equal(res.mcpServerVerified.statefulProposalApproval, true)
  assert.equal(res.supervisorVerified.subagentSpawnBanVerified, true)
  assert.equal(res.supervisorVerified.prefixCollisionCheckVerified, true)

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

test("reference MCP server enforces MCP 2025-06-18 Streamable HTTP (RFC 9728 + 401 WWW-Authenticate + RS256 JWKS), STDIO env auth, tool inputSchemas, and stateful two-step proposalId approval", async () => {
  assert.throws(() => createReferenceMcpServer({}), { code: "E_SERVER_UNCONFIGURED" })

  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" }
  const approvalSecret = "a".repeat(36)
  const expectedAudience = "https://mcp.example.internal/agentic-architecture"
  const expectedIssuer = "https://auth.example.internal"
  const now = new Date("2026-10-24T12:00:00Z")
  const nowSec = Math.floor(now.getTime() / 1000)

  const mcp = createReferenceMcpServer({
    approvalSecret,
    jwks: { keys: [jwk] },
    expectedAudience,
    expectedIssuer,
    nowFn: () => now,
  })

  const makerBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_1",
        iss: expectedIssuer,
        aud: expectedAudience,
        scope: "architecture:read architecture:draft",
        exp: nowSec + 600,
      },
      privateKey,
      { alg: "RS256", kid: "k1" },
    )
  const humanApproverBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "human:frank",
        tenantId: "tenant_1",
        iss: expectedIssuer,
        aud: expectedAudience,
        scope: "architecture:approve",
        exp: nowSec + 600,
      },
      privateKey,
      { alg: "RS256", kid: "k1" },
    )

  // STDIO rejects OAuth bearer headers and uses env variables
  const stdioBearerRejected = mcp.handleRequest(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "architecture_lookup", arguments: {}, _meta: { authorization: makerBearer } } },
    { transport: "stdio", env: { MCP_STDIO_SUB: "agent:maker_01", MCP_STDIO_TENANT_ID: "tenant_1", MCP_STDIO_SCOPE: "architecture:read" } },
  )
  assert.equal(stdioBearerRejected.result.isError, true)
  assert.equal(stdioBearerRejected.result.code, "E_STDIO_BEARER_FORBIDDEN")

  // Stateful Phase 1: propose_release_gate creates proposalId bound to authenticated proposer
  const propRes = mcp.handleRequest(
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "propose_release_gate", arguments: { releaseId: "r1", summary: "ship v1" } } },
    { transport: "http", authorizationHeader: makerBearer },
  )
  assert.equal(propRes.result.isError, false)
  assert.equal(propRes.result.status, "pending_approval")
  assert.equal(propRes.result.proposerSub, "agent:maker_01")

  // Phase 2: distinct approver approves the stored proposalId
  const approveRes = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "approve_release_gate", arguments: { proposalId: propRes.result.proposalId, approvalToken: propRes.result.approvalToken } },
    },
    { transport: "http", authorizationHeader: humanApproverBearer },
  )
  assert.equal(approveRes.result.isError, false)
  assert.equal(approveRes.result.outcome, "approved")
  assert.equal(approveRes.result.proposerSub, "agent:maker_01")
  assert.equal(approveRes.result.approverSub, "human:frank")

  // Re-approving an already decided proposalId fails closed
  const replayApprove = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "approve_release_gate", arguments: { proposalId: propRes.result.proposalId, approvalToken: propRes.result.approvalToken } },
    },
    { transport: "http", authorizationHeader: humanApproverBearer },
  )
  assert.equal(replayApprove.result.isError, true)
  assert.equal(replayApprove.result.code, "E_PROPOSAL_ALREADY_DECIDED")

  // Streamable HTTP server serves RFC 9728 metadata and 401 WWW-Authenticate
  const httpSrv = await startStreamableHttpMcpServer(mcp)
  try {
    const meta = await fetch(`${httpSrv.baseUrl}/.well-known/oauth-protected-resource`)
    assert.equal(meta.status, 200)
    const unauth = await fetch(`${httpSrv.baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "architecture_lookup", arguments: {} } }),
    })
    assert.equal(unauth.status, 401)
    assert.ok(unauth.headers.get("www-authenticate")?.includes("Bearer resource_metadata="))
  } finally {
    await httpSrv.close()
  }
})

test("TypeScript supervisor workflow dispatches across two provider families, enforces prefix-aware disjoint writePaths, cross-model checker isolation, recursion depth <= 1, and 80% budget ceiling", async () => {
  assert.throws(
    () =>
      assertDisjointWritePaths([
        { id: "a", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["playbook/"], estimatedCostUsd: 1 },
        { id: "b", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["playbook/ch01.md"], estimatedCostUsd: 1 },
      ]),
    { code: "E_WRITE_COLLISION" },
  )

  const dispatched = await dispatchSupervisorPipeline(
    {
      maxBudgetUsd: 5,
      wave: [],
      maker: { id: "m", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["a.ts"], estimatedCostUsd: 1.0 },
      checker: { id: "c", role: "checker", providerFamily: "anthropic", readPaths: [], writePaths: [], estimatedCostUsd: 1.0 },
    },
    { dryRun: true },
  )
  assert.equal(dispatched.state, "VERIFIED_READY_FOR_OWNER_APPROVAL")
  assert.equal(dispatched.makerResponse.providerFamily, "google")
  assert.equal(dispatched.checkerResponse.providerFamily, "anthropic")

  assert.throws(
    () =>
      assertNoNestedSubagentSpawn([
        { id: "child", role: "maker", providerFamily: "google", readPaths: [], writePaths: [], parentTaskId: "parent_1", depth: 2, estimatedCostUsd: 0.5 },
      ]),
    { code: "E_RECURSION_DEPTH_EXCEEDED" },
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
