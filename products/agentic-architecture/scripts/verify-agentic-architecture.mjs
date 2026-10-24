import { generateKeyPairSync } from "node:crypto"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { validateC4Workspace } from "../kit/c4/validate-c4.mjs"
import { validateAdrDirectory } from "../kit/adrs/validate-adrs.mjs"
import { evaluateWorkbook } from "../kit/workbooks/evaluate-workbook.mjs"
import {
  createReferenceMcpServer,
  issueOAuth2AccessToken,
  startStreamableHttpMcpServer,
} from "../kit/mcp/reference-mcp-server.mjs"
import {
  assertDisjointWritePaths,
  assertNoNestedSubagentSpawn,
  dispatchSupervisorPipeline,
} from "../kit/workflows/supervisor-maker-checker.ts"

const here = dirname(fileURLToPath(import.meta.url))
const defaultRoot = resolve(here, "..")

function countNonCodeWords(markdown) {
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, " ")
  const withoutInlineCode = withoutCodeBlocks.replace(/`[^`]+`/g, " ")
  const tokens = withoutInlineCode.match(/[\p{L}\p{N}_'-]+/gu)
  return tokens ? tokens.length : 0
}

export async function verifyAgenticArchitecture(baseDir = defaultRoot) {
  // 1. Verify all 10 Playbook chapters & visual placeholders
  const chaptersDir = join(baseDir, "playbook/chapters")
  const chapterFiles = readdirSync(chaptersDir).filter((f) => f.endsWith(".md")).sort()
  if (chapterFiles.length !== 10) {
    throw new Error(`Expected 10 chapters, found ${chapterFiles.length}`)
  }

  const placeholdersDoc = readFileSync(join(baseDir, "playbook/VISUAL-PLACEHOLDERS.md"), "utf8")
  const chapterWordCounts = []

  for (let i = 0; i < chapterFiles.length; i++) {
    const num = String(i + 1).padStart(2, "0")
    const text = readFileSync(join(chaptersDir, chapterFiles[i]), "utf8")
    if (!text.includes(`PAT-${num}`)) throw new Error(`${chapterFiles[i]} missing PAT-${num}`)
    if (!text.includes(`ADR-00${num}`)) throw new Error(`${chapterFiles[i]} missing ADR-00${num}`)
    if (!text.includes(`FM-${num}`)) throw new Error(`${chapterFiles[i]} missing FM-${num}`)
    if (/[\t\f]/.test(text)) {
      throw new Error(`${chapterFiles[i]} contains unescaped tab or form-feed control characters (broken LaTeX escape)`)
    }
    if (/gpt-6|claude-fable|gemini-4-argon|grok-4\.7|claude-haiku-5-5|claude-sonnet-5-5|claude-opus-5-5/i.test(text)) {
      throw new Error(`${chapterFiles[i]} contains unsourced specific model IDs; use model-agnostic capability tiers with a note to check current vendor pricing`)
    }
    if (text.includes("GHSA-5324")) {
      throw new Error(`${chapterFiles[i]} contains invalid truncated GHSA ID`)
    }
    const tokenMatch = text.match(/\[\[PLAYBOOK_FIG_CH\d{2}_[A-Z0-9_]+\]\]/)
    if (!tokenMatch || !placeholdersDoc.includes(tokenMatch[0])) {
      throw new Error(`${chapterFiles[i]} missing registered CMO visual placeholder token`)
    }
    const wc = countNonCodeWords(text)
    if (wc < 1000) {
      throw new Error(`Chapter ${chapterFiles[i]} has ${wc} prose words; every chapter must be written in full (>= 1000 prose words)`)
    }
    chapterWordCounts.push({ chapter: num, file: chapterFiles[i], proseWords: wc })
  }

  // 2. Verify C4 DSL + 4 Mermaid views
  const c4 = validateC4Workspace(join(baseDir, "kit/c4"))

  // 3. Verify 10 ADRs + ADR-0000 template
  const adrs = validateAdrDirectory(join(baseDir, "kit/adrs"))

  // 4. Verify Threat & Cost Workbook + OTel Span Ingester
  const workbook = evaluateWorkbook(join(baseDir, "kit/workbooks/threat-and-cost-workbook.json"))
  if (!workbook.otelTraceIngestion || workbook.otelTraceIngestion.costPerAcceptedRunUsd !== 0.448) {
    throw new Error("Expected OTel sample costPerAcceptedRunUsd === 0.448")
  }

  // 5. Verify Reference MCP Server (fail-closed startup, RS256 JWKS + HS256 OAuth 2.1, RFC 9728 Streamable HTTP + 401 WWW-Authenticate, STDIO env auth, and stateful proposalId approval)
  let unconfiguredCaught = false
  try {
    createReferenceMcpServer({ approvalSecret: "short", oauthTokenSecret: "short" })
  } catch (err) {
    if (err.code === "E_SERVER_UNCONFIGURED") unconfiguredCaught = true
  }
  if (!unconfiguredCaught) {
    throw new Error("MCP server did not fail closed on missing/short secrets")
  }

  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "kid-2026-10", alg: "RS256", use: "sig" }
  const approvalSecret = "verify-approval-secret-32-bytes-minimum-key!"
  const oauthTokenSecret = "verify-oauth-token-secret-32-bytes-min-key!!"
  const expectedAudience = "https://mcp.example.internal/agentic-architecture"
  const expectedIssuer = "https://auth.example.internal"
  const fixedNow = new Date("2026-10-24T12:00:00Z")
  const nowSec = Math.floor(fixedNow.getTime() / 1000)

  const mcp = createReferenceMcpServer({
    approvalSecret,
    oauthTokenSecret,
    jwks: { keys: [jwk] },
    expectedAudience,
    expectedIssuer,
    nowFn: () => fixedNow,
  })

  // Verify tools/list exports inputSchema on every tool
  const listRes = mcp.handleRequest({ jsonrpc: "2.0", id: 100, method: "tools/list" })
  for (const t of listRes.result.tools) {
    if (!t.inputSchema || t.inputSchema.type !== "object") {
      throw new Error(`Tool ${t.name} missing JSON Schema inputSchema`)
    }
  }

  // Verify STDIO transport uses environment credentials and rejects OAuth bearer headers (MCP 2025-06-18 spec)
  const stdioForbidden = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 101,
      method: "tools/call",
      params: { name: "architecture_lookup", arguments: {}, _meta: { authorization: "Bearer some.jwt.token" } },
    },
    { transport: "stdio", env: { MCP_STDIO_SUB: "agent:local", MCP_STDIO_TENANT_ID: "tenant_acme", MCP_STDIO_SCOPE: "architecture:read" } },
  )
  if (!stdioForbidden.result.isError || stdioForbidden.result.code !== "E_STDIO_BEARER_FORBIDDEN") {
    throw new Error("STDIO transport failed to reject OAuth bearer header per MCP 2025-06-18 spec")
  }

  const stdioOk = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 102,
      method: "tools/call",
      params: { name: "architecture_lookup", arguments: { patternId: "PAT-01" } },
    },
    { transport: "stdio", env: { MCP_STDIO_SUB: "agent:local", MCP_STDIO_TENANT_ID: "tenant_acme", MCP_STDIO_SCOPE: "architecture:read" } },
  )
  if (stdioOk.result.isError) {
    throw new Error("STDIO environment-authenticated lookup failed")
  }

  // Verify RS256 JWKS token and HS256 token
  const makerBearerRs256 =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_acme",
        iss: expectedIssuer,
        aud: expectedAudience,
        scope: "architecture:read architecture:draft",
        exp: nowSec + 600,
      },
      privateKey,
      { alg: "RS256", kid: "kid-2026-10" },
    )

  const approverBearerHs256 =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "human:architect_lead",
        tenantId: "tenant_acme",
        iss: expectedIssuer,
        aud: expectedAudience,
        scope: "architecture:approve",
        exp: nowSec + 600,
      },
      oauthTokenSecret,
      { alg: "HS256" },
    )

  const wrongAudienceBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_acme",
        iss: expectedIssuer,
        aud: "https://other-service.example.internal",
        scope: "architecture:read",
        exp: nowSec + 600,
      },
      privateKey,
      { alg: "RS256", kid: "kid-2026-10" },
    )

  // Verify Streamable HTTP RFC 9728 metadata and 401 WWW-Authenticate
  const httpHandle = await startStreamableHttpMcpServer(mcp)
  try {
    const metaRes = await fetch(`${httpHandle.baseUrl}/.well-known/oauth-protected-resource`)
    if (metaRes.status !== 200) throw new Error("Expected 200 from /.well-known/oauth-protected-resource")
    const metaJson = await metaRes.json()
    if (metaJson.resource !== expectedAudience) throw new Error("RFC 9728 resource mismatch")

    const unauthRes = await fetch(`${httpHandle.baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: wrongAudienceBearer },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "architecture_lookup", arguments: {} } }),
    })
    if (unauthRes.status !== 401 || !unauthRes.headers.get("www-authenticate")?.includes("resource_metadata=")) {
      throw new Error("Expected HTTP 401 with RFC 9728 WWW-Authenticate header on audience mismatch")
    }
  } finally {
    await httpHandle.close()
  }

  // Verify stateful two-step approval (propose_release_gate -> proposalId -> approve_release_gate)
  const unproposedApprove = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "approve_release_gate",
        arguments: { proposalId: "prop_nonexistent_123456", approvalToken: "0".repeat(64) },
      },
    },
    { transport: "http", authorizationHeader: approverBearerHs256 },
  )
  if (!unproposedApprove.result.isError || unproposedApprove.result.code !== "E_PROPOSAL_NOT_FOUND") {
    throw new Error("MCP server failed to block approval of non-existent proposalId")
  }

  const proposed = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "propose_release_gate",
        arguments: { releaseId: "rel_1", summary: "Promote C4 + ADR bundle" },
      },
    },
    { transport: "http", authorizationHeader: makerBearerRs256 },
  )
  if (proposed.result.isError || proposed.result.status !== "pending_approval" || !proposed.result.proposalId) {
    throw new Error("Stateful propose_release_gate failed")
  }

  // Self-approval by proposer must fail even if proposer gets an approve-scoped token
  const makerApproveBearer =
    "Bearer " +
    issueOAuth2AccessToken(
      {
        sub: "agent:maker_01",
        tenantId: "tenant_acme",
        iss: expectedIssuer,
        aud: expectedAudience,
        scope: "architecture:approve",
        exp: nowSec + 600,
      },
      privateKey,
      { alg: "RS256", kid: "kid-2026-10" },
    )
  const selfApprove = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "approve_release_gate",
        arguments: { proposalId: proposed.result.proposalId, approvalToken: proposed.result.approvalToken },
      },
    },
    { transport: "http", authorizationHeader: makerApproveBearer },
  )
  if (!selfApprove.result.isError || selfApprove.result.code !== "E_SELF_APPROVAL_FORBIDDEN") {
    throw new Error("MCP server failed to block authenticated self-approval against stored proposal")
  }

  const validApprove = mcp.handleRequest(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "approve_release_gate",
        arguments: { proposalId: proposed.result.proposalId, approvalToken: proposed.result.approvalToken },
      },
    },
    { transport: "http", authorizationHeader: approverBearerHs256 },
  )
  if (validApprove.result.isError || validApprove.result.outcome !== "approved") {
    throw new Error("MCP server rejected valid stateful two-phase approval")
  }

  // 6. Execute two-provider TypeScript supervisor workflow (dryRun fixture + prefix-aware write collision + subagent spawn ban)
  const pipelineReceipt = await dispatchSupervisorPipeline(
    {
      maxBudgetUsd: 10,
      wave: [
        { id: "w1", role: "maker", providerFamily: "google", readPaths: ["README.md"], writePaths: ["kit/c4/agentic-system.dsl"], allowedTools: ["read_file", "write_file"], depth: 1, estimatedCostUsd: 0.4 },
        { id: "w2", role: "maker", providerFamily: "google", readPaths: ["README.md"], writePaths: ["kit/adrs/ADR-0001.md"], allowedTools: ["read_file", "write_file"], depth: 1, estimatedCostUsd: 0.4 },
      ],
      maker: { id: "m1", role: "maker", providerFamily: "google", readPaths: ["*"], writePaths: ["playbook/"], allowedTools: ["read_file", "write_file"], depth: 1, estimatedCostUsd: 1.2 },
      checker: { id: "c1", role: "checker", providerFamily: "anthropic", readPaths: ["*"], writePaths: [], allowedTools: ["read_file"], depth: 1, estimatedCostUsd: 0.8 },
    },
    { dryRun: true },
  )
  if (pipelineReceipt.state !== "VERIFIED_READY_FOR_OWNER_APPROVAL" || pipelineReceipt.dispatchMode !== "dry_run_fixture") {
    throw new Error("Supervisor pipeline failed dry-run two-provider dispatch")
  }

  let prefixCollisionCaught = false
  try {
    assertDisjointWritePaths([
      { id: "p1", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["playbook/"], estimatedCostUsd: 0.1 },
      { id: "p2", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["playbook/chapters/01.md"], estimatedCostUsd: 0.1 },
    ])
  } catch (err) {
    if (err.code === "E_WRITE_COLLISION") prefixCollisionCaught = true
  }
  if (!prefixCollisionCaught) {
    throw new Error("Supervisor failed to block directory-prefix write collision (playbook/ vs playbook/chapters/01.md)")
  }

  let spawnBanCaught = false
  try {
    assertNoNestedSubagentSpawn([
      { id: "nested", role: "maker", providerFamily: "google", readPaths: [], writePaths: ["a.ts"], allowedTools: ["task"], depth: 1, estimatedCostUsd: 0.2 },
    ])
  } catch (err) {
    if (err.code === "E_SUBAGENT_SPAWN_FORBIDDEN") spawnBanCaught = true
  }
  if (!spawnBanCaught) {
    throw new Error("Supervisor failed to block subagent-spawning tool")
  }

  // 7. Verify n8n workflow JSON + Prompt Set JSON
  const n8n = JSON.parse(readFileSync(join(baseDir, "kit/workflows/n8n-agentic-triage-and-approval.json"), "utf8"))
  if (!Array.isArray(n8n.nodes) || n8n.nodes.length < 5) {
    throw new Error("n8n workflow must contain at least 5 nodes")
  }

  const promptSet = JSON.parse(readFileSync(join(baseDir, "kit/prompts/prompt-set.json"), "utf8"))
  if (!Array.isArray(promptSet.prompts) || promptSet.prompts.length < 6) {
    throw new Error("prompt-set.json must contain at least 6 production prompts")
  }
  for (const p of promptSet.prompts) {
    if (!p.eval_cases?.golden || !p.eval_cases?.refusal || !p.eval_cases?.injection) {
      throw new Error(`Prompt ${p.id} missing golden/refusal/injection evaluation triad`)
    }
  }

  // 8. Verify Competitive Bar + Buyer Page Waitlist-First Contract (EUR, no price shown)
  const compBar = readFileSync(join(baseDir, "docs/COMPETITIVE-BAR.md"), "utf8")
  for (const requiredRef of [
    "AI Engineering",
    "Building effective agents",
    "OWASP Top 10 for Agentic Applications",
    "getclaudekit.com/ai",
    "builtbyzac.com/bundle.html",
    "getautopilotkit.com",
    "agentkitco.com",
    "USD 99",
    "USD 79",
  ]) {
    if (!compBar.includes(requiredRef)) throw new Error(`COMPETITIVE-BAR.md missing reference: ${requiredRef}`)
  }

  const offerFacts = JSON.parse(readFileSync(join(baseDir, "buyer-page/offer.facts.json"), "utf8"))
  if (offerFacts.price?.state !== "decision_required" || offerFacts.price?.amount !== null || offerFacts.price?.currency !== "EUR") {
    throw new Error("offer.facts.json must keep price.state=decision_required, amount=null, currency=EUR")
  }
  const buyerPage = readFileSync(join(baseDir, "buyer-page/BUYER-PAGE-DRAFT.md"), "utf8")
  if (/\$\s?\d|EUR\s?\d/.test(buyerPage)) {
    throw new Error("BUYER-PAGE-DRAFT.md must not display a price")
  }

  return {
    state: "AGENTIC_ARCHITECTURE_PLAYBOOK_AND_KIT_VERIFIED",
    chapters: chapterFiles.length,
    chapterWordCounts,
    c4,
    adrs,
    workbook: {
      threatsBoundToTests: workbook.threatsBoundToTests,
      workloads: workbook.workloads.length,
      otelTraceIngestion: workbook.otelTraceIngestion,
    },
    mcpServerVerified: {
      failClosedStartup: true,
      oauth2AudienceCheck: true,
      rs256JwksVerified: true,
      rfc9728StreamableHttpVerified: true,
      stdioEnvAuthVerified: true,
      statefulProposalApproval: true,
    },
    supervisorVerified: {
      state: pipelineReceipt.state,
      dispatchMode: pipelineReceipt.dispatchMode,
      makerFamily: pipelineReceipt.makerFamily,
      checkerFamily: pipelineReceipt.checkerFamily,
      prefixCollisionCheckVerified: true,
      subagentSpawnBanVerified: true,
    },
    n8nNodesVerified: n8n.nodes.length,
    promptsVerified: promptSet.prompts.length,
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const res = await verifyAgenticArchitecture()
  console.log(JSON.stringify(res, null, 2))
}
