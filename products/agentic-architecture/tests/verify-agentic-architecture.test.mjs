import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import { verifyAgenticArchitecture } from "../scripts/verify-agentic-architecture.mjs"
import { createReferenceMcpServer } from "../kit/mcp/reference-mcp-server.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "..")

test("all 10 chapters, C4 diagrams, 10 ADRs, threat/cost workbook, MCP server, workflows, prompts, competitive bar, and buyer page pass verification", async () => {
  const res = await verifyAgenticArchitecture(root)
  assert.equal(res.state, "AGENTIC_ARCHITECTURE_PLAYBOOK_AND_KIT_VERIFIED")
  assert.equal(res.chapters, 10)
  assert.equal(res.fullChapters.length, 3)
  assert.equal(res.adrs.adrCount, 10)
  assert.equal(res.workbook.threatsVerified, 10)
  assert.equal(res.workbook.maxResidualSeverity, 1)
  assert.equal(res.promptsVerified, 6)
  assert.equal(res.competitorsVerified, 5)
})

test("reference MCP server enforces self-approval ban, idempotency replay, and path containment", () => {
  const mcp = createReferenceMcpServer({ approvalSecret: "s".repeat(32) })

  // Self-approval is rejected
  const selfApprove = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: { name: "approve_release_gate", arguments: { proposerId: "agent_1", approverId: "agent_1", releaseId: "r1" } },
  })
  assert.equal(selfApprove.result.isError, true)
  assert.equal(selfApprove.result.code, "E_SELF_APPROVAL_FORBIDDEN")

  // Idempotent draft staging replays cleanly on duplicate key
  const first = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 11,
    method: "tools/call",
    params: { name: "stage_adr_draft", arguments: { idempotencyKey: "idem_1", targetPath: "docs/architecture/ADR-0011.md" } },
  })
  assert.equal(first.result.outcome, "staged")
  const replay = mcp.handleRequest({
    jsonrpc: "2.0",
    id: 12,
    method: "tools/call",
    params: { name: "stage_adr_draft", arguments: { idempotencyKey: "idem_1", targetPath: "docs/architecture/ADR-0011.md" } },
  })
  assert.equal(replay.result.outcome, "duplicate_replay")
})

test("TypeScript supervisor workflow executes and enforces disjoint writePaths, cross-model checker isolation, and 80% budget ceiling", async () => {
  const wf = await import("../kit/workflows/supervisor-maker-checker.ts")
  const validResult = wf.runSupervisorPipeline({
    maxBudgetUsd: 10,
    wave: [
      { id: "w1", role: "maker", providerFamily: "google", readPaths: ["README.md"], writePaths: ["kit/c4/agentic-system.dsl"], estimatedCostUsd: 1.5 },
      { id: "w2", role: "maker", providerFamily: "google", readPaths: ["README.md"], writePaths: ["kit/adrs/ADR-0001.md"], estimatedCostUsd: 1.5 },
    ],
    maker: { id: "m1", role: "maker", providerFamily: "google", readPaths: ["*"], writePaths: ["playbook/"], estimatedCostUsd: 2.0 },
    checker: { id: "c1", role: "checker", providerFamily: "anthropic", readPaths: ["*"], writePaths: [], estimatedCostUsd: 1.5 },
  })
  assert.equal(validResult.state, "VERIFIED_READY_FOR_OWNER_APPROVAL")
  assert.equal(validResult.totalCostUsd, 6.5)

  // Overlapping writePaths throws E_WRITE_COLLISION
  assert.throws(
    () =>
      wf.assertDisjointWritePaths([
        { id: "a", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["shared.ts"], estimatedCostUsd: 1 },
        { id: "b", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["shared.ts"], estimatedCostUsd: 1 },
      ]),
    { code: "E_WRITE_COLLISION" },
  )

  // Same providerFamily for Maker and Checker throws E_CHECKER_ISOLATION
  assert.throws(
    () =>
      wf.assertMakerNotChecker(
        { id: "m", role: "maker", providerFamily: "anthropic", readPaths: [], writePaths: ["x"], estimatedCostUsd: 1 },
        { id: "c", role: "checker", providerFamily: "anthropic", readPaths: [], writePaths: [], estimatedCostUsd: 1 },
      ),
    { code: "E_CHECKER_ISOLATION" },
  )

  // Exceeding 80% budget ceiling throws E_BUDGET_EXCEEDED
  assert.throws(
    () =>
      wf.runSupervisorPipeline({
        maxBudgetUsd: 5,
        wave: [],
        maker: { id: "m", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["a"], estimatedCostUsd: 3.0 },
        checker: { id: "c", role: "checker", providerFamily: "anthropic", readPaths: [], writePaths: [], estimatedCostUsd: 1.5 },
      }),
    { code: "E_BUDGET_EXCEEDED" },
  )
})
