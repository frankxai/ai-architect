#!/usr/bin/env node
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { posix, resolve } from "node:path"
import { createInterface } from "node:readline"
import { pathToFileURL } from "node:url"

/**
 * Reference MCP Server implementing PAT-01 and PAT-05:
 * - Fails closed (E_SERVER_UNCONFIGURED) when approvalSecret, oauthTokenSecret, or expectedAudience is missing
 * - Enforces OAuth 2.1 Bearer tokens with RFC 8707 resource-indicator audience (aud), scope, and exp checks
 * - Extracts tenantId and principal (sub) from the authenticated OAuth token, never trusting caller-supplied IDs
 * - Tier 0 read tool wraps untrusted data in <untrusted-content> and strips forged closing tags
 * - Tier 1 draft tool enforces POSIX path containment under docs/architecture/ and idempotencyKey deduplication
 * - Tier 2 release-gate write tool requires HMAC-SHA256 approvalToken bound to (tenantId, toolName, proposerSub, approverSub, expiresAt, canonicalParams)
 * - Runs in-process or over newline-delimited JSON-RPC 2.0 stdio transport
 */

const b64uEncode = (str) => Buffer.from(str, "utf8").toString("base64url")
const b64uDecode = (b64) => Buffer.from(b64, "base64url").toString("utf8")

function safeEqualHexOrB64(left, right) {
  const a = Buffer.from(String(left), "utf8")
  const b = Buffer.from(String(right), "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}

export function wrapUntrusted(source, rawText) {
  const sanitized = String(rawText).replace(/<\/?untrusted-content[^>]*>/gi, "[stripped-boundary-tag]")
  return `<untrusted-content source="${source}">\n${sanitized}\n</untrusted-content>`
}

export function issueOAuth2AccessToken(claims, oauthTokenSecret) {
  if (typeof oauthTokenSecret !== "string" || oauthTokenSecret.trim().length < 32) {
    throw Object.assign(new Error("oauthTokenSecret must be at least 32 characters"), { code: "E_SERVER_UNCONFIGURED" })
  }
  const header = b64uEncode(JSON.stringify({ alg: "HS256", typ: "at+jwt" }))
  const payload = b64uEncode(JSON.stringify(claims))
  const sig = createHmac("sha256", oauthTokenSecret).update(`${header}.${payload}`, "utf8").digest("base64url")
  return `${header}.${payload}.${sig}`
}

export function verifyOAuth2BearerToken(authHeader, { oauthTokenSecret, expectedAudience, requiredScope, now = new Date() }) {
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing Authorization: Bearer token"), { code: "E_OAUTH_MISSING" })
  }
  const token = authHeader.slice("Bearer ".length).trim()
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw Object.assign(new Error("Malformed OAuth 2.1 access token"), { code: "E_OAUTH_TOKEN" })
  }
  const [headerB64, payloadB64, sigB64] = parts
  const expectedSig = createHmac("sha256", oauthTokenSecret).update(`${headerB64}.${payloadB64}`, "utf8").digest("base64url")
  if (!safeEqualHexOrB64(sigB64, expectedSig)) {
    throw Object.assign(new Error("OAuth 2.1 token signature mismatch"), { code: "E_OAUTH_SIGNATURE" })
  }
  let claims
  try {
    claims = JSON.parse(b64uDecode(payloadB64))
  } catch {
    throw Object.assign(new Error("Malformed OAuth 2.1 token payload"), { code: "E_OAUTH_TOKEN" })
  }
  const nowSec = Math.floor(now.getTime() / 1000)
  if (!Number.isInteger(claims.exp) || claims.exp <= nowSec) {
    throw Object.assign(new Error("OAuth 2.1 access token has expired"), { code: "E_OAUTH_EXPIRED" })
  }
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audiences.includes(expectedAudience)) {
    throw Object.assign(
      new Error(`OAuth 2.1 resource-indicator audience mismatch: expected ${expectedAudience}`),
      { code: "E_OAUTH_AUDIENCE_MISMATCH" },
    )
  }
  if (typeof claims.sub !== "string" || !claims.sub.trim() || typeof claims.tenantId !== "string" || !claims.tenantId.trim()) {
    throw Object.assign(new Error("OAuth 2.1 token missing sub or tenantId claim"), { code: "E_OAUTH_CLAIMS" })
  }
  const scopes = typeof claims.scope === "string" ? claims.scope.split(/\s+/).filter(Boolean) : []
  if (requiredScope && !scopes.includes(requiredScope)) {
    throw Object.assign(new Error(`OAuth 2.1 token missing required scope: ${requiredScope}`), {
      code: "E_OAUTH_INSUFFICIENT_SCOPE",
    })
  }
  return {
    sub: claims.sub.trim(),
    tenantId: claims.tenantId.trim(),
    aud: claims.aud,
    scopes,
    exp: claims.exp,
  }
}

export function computeApprovalToken({
  approvalSecret,
  tenantId,
  toolName,
  proposerSub,
  approverSub,
  expiresAt,
  canonicalParams,
}) {
  if (typeof approvalSecret !== "string" || approvalSecret.trim().length < 32) {
    throw Object.assign(new Error("approvalSecret must be at least 32 characters"), { code: "E_SERVER_UNCONFIGURED" })
  }
  const message = `${tenantId}:${toolName}:${proposerSub}:${approverSub}:${expiresAt}:${canonicalParams}`
  return createHmac("sha256", approvalSecret).update(message, "utf8").digest("hex")
}

export function createReferenceMcpServer(config = {}) {
  const { approvalSecret, oauthTokenSecret, expectedAudience, nowFn = () => new Date() } = config
  if (
    typeof approvalSecret !== "string" ||
    approvalSecret.trim().length < 32 ||
    typeof oauthTokenSecret !== "string" ||
    oauthTokenSecret.trim().length < 32 ||
    typeof expectedAudience !== "string" ||
    !expectedAudience.startsWith("https://")
  ) {
    throw Object.assign(
      new Error("MCP server requires approvalSecret (>=32 chars), oauthTokenSecret (>=32 chars), and https:// expectedAudience"),
      { code: "E_SERVER_UNCONFIGURED" },
    )
  }

  const idempotencyLedger = new Map()

  function assertSafeRelativePath(candidatePath) {
    if (typeof candidatePath !== "string" || !candidatePath.trim()) {
      throw Object.assign(new Error("Path is required"), { code: "E_PATH_CONTAINMENT" })
    }
    const normalized = posix.normalize(candidatePath.trim().replace(/\\/g, "/"))
    if (
      normalized.startsWith("/") ||
      normalized.startsWith("../") ||
      normalized === ".." ||
      !normalized.startsWith("docs/architecture/")
    ) {
      throw Object.assign(new Error(`Path escapes docs/architecture/: ${candidatePath}`), { code: "E_PATH_CONTAINMENT" })
    }
    return normalized
  }

  function handleRequest(req) {
    if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
      return { jsonrpc: "2.0", id: req?.id ?? null, error: { code: -32600, message: "Invalid JSON-RPC request" } }
    }
    if (req.id === undefined) return null

    if (req.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          protocolVersion: "2025-06-18",
          serverInfo: {
            name: "agentic-architecture-reference-mcp",
            version: "1.1.0",
            protectedResource: expectedAudience,
          },
          capabilities: { tools: {} },
        },
      }
    }

    if (req.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          tools: [
            { name: "architecture_lookup", description: "Tier 0 read-only pattern lookup with OAuth 2.1 audience check and untrusted-content wrapping" },
            { name: "stage_adr_draft", description: "Tier 1 idempotent draft staging confined to docs/architecture/" },
            { name: "approve_release_gate", description: "Tier 2 two-phase confirm-gated release approval bound to tenantId and expiresAt" },
          ],
        },
      }
    }

    if (req.method === "tools/call") {
      const { name, arguments: args = {}, _meta = {} } = req.params ?? {}
      const authHeader = _meta.authorization ?? req.headers?.authorization ?? null
      const now = nowFn()

      try {
        if (name === "architecture_lookup") {
          const auth = verifyOAuth2BearerToken(authHeader, {
            oauthTokenSecret,
            expectedAudience,
            requiredScope: "architecture:read",
            now,
          })
          if (args.tenantId && args.tenantId !== auth.tenantId) {
            throw Object.assign(new Error("Cross-tenant read denied"), { code: "E_TENANT_MISMATCH" })
          }
          const wrapped = wrapUntrusted(
            `tenant:${auth.tenantId}:pattern:${args.patternId ?? "PAT-01"}`,
            args.note ?? "Scoped Capability Proxy",
          )
          return {
            jsonrpc: "2.0",
            id: req.id,
            result: { content: [{ type: "text", text: wrapped }], tenantId: auth.tenantId, isError: false },
          }
        }

        if (name === "stage_adr_draft") {
          const auth = verifyOAuth2BearerToken(authHeader, {
            oauthTokenSecret,
            expectedAudience,
            requiredScope: "architecture:draft",
            now,
          })
          if (!args.idempotencyKey) {
            throw Object.assign(new Error("idempotencyKey is required"), { code: "E_IDEMPOTENCY_REQUIRED" })
          }
          const safePath = assertSafeRelativePath(args.targetPath)
          const scopedKey = `${auth.tenantId}:${args.idempotencyKey}`
          if (idempotencyLedger.has(scopedKey)) {
            return {
              jsonrpc: "2.0",
              id: req.id,
              result: { outcome: "duplicate_replay", tenantId: auth.tenantId, path: safePath, isError: false },
            }
          }
          idempotencyLedger.set(scopedKey, safePath)
          return {
            jsonrpc: "2.0",
            id: req.id,
            result: { outcome: "staged", tenantId: auth.tenantId, path: safePath, isError: false },
          }
        }

        if (name === "approve_release_gate") {
          const { releaseId, proposerSub: suppliedProposerSub, approvalToken, expiresAt } = args
          if (!releaseId || typeof releaseId !== "string") {
            throw Object.assign(new Error("releaseId is required"), { code: "E_INVALID_ARGS" })
          }

          // Phase 1: Proposer creates a pending_approval record (requires architecture:draft or architecture:approve)
          if (!approvalToken) {
            const auth = verifyOAuth2BearerToken(authHeader, {
              oauthTokenSecret,
              expectedAudience,
              requiredScope: "architecture:draft",
              now,
            })
            const canonicalParams = JSON.stringify({ releaseId, tenantId: auth.tenantId })
            return {
              jsonrpc: "2.0",
              id: req.id,
              result: {
                outcome: "pending_approval",
                code: "E_APPROVAL_REQUIRED",
                tenantId: auth.tenantId,
                proposerSub: auth.sub,
                payloadSha256: createHash("sha256").update(canonicalParams, "utf8").digest("hex"),
                isError: false,
              },
            }
          }

          // Phase 2: Distinct authenticated approver commits the Tier-2 action (requires architecture:approve)
          const approverAuth = verifyOAuth2BearerToken(authHeader, {
            oauthTokenSecret,
            expectedAudience,
            requiredScope: "architecture:approve",
            now,
          })
          if (!suppliedProposerSub || typeof suppliedProposerSub !== "string") {
            throw Object.assign(new Error("proposerSub is required to verify approval token"), { code: "E_INVALID_ARGS" })
          }
          if (approverAuth.sub === suppliedProposerSub) {
            throw Object.assign(
              new Error("Authenticated principal cannot approve its own Tier-2 proposal"),
              { code: "E_SELF_APPROVAL_FORBIDDEN" },
            )
          }
          if (args.tenantId && args.tenantId !== approverAuth.tenantId) {
            throw Object.assign(new Error("Cross-tenant approval denied"), { code: "E_TENANT_MISMATCH" })
          }
          const nowSec = Math.floor(now.getTime() / 1000)
          if (!Number.isInteger(expiresAt) || expiresAt <= nowSec) {
            throw Object.assign(new Error("Approval token has expired or is missing integer expiresAt"), {
              code: "E_APPROVAL_EXPIRED",
            })
          }
          const canonicalParams = JSON.stringify({ releaseId, tenantId: approverAuth.tenantId })
          const expectedToken = computeApprovalToken({
            approvalSecret,
            tenantId: approverAuth.tenantId,
            toolName: "approve_release_gate",
            proposerSub: suppliedProposerSub,
            approverSub: approverAuth.sub,
            expiresAt,
            canonicalParams,
          })
          if (!safeEqualHexOrB64(approvalToken, expectedToken)) {
            throw Object.assign(new Error("Invalid HMAC approvalToken signature"), { code: "E_APPROVAL_SIGNATURE" })
          }
          return {
            jsonrpc: "2.0",
            id: req.id,
            result: {
              outcome: "approved",
              tenantId: approverAuth.tenantId,
              releaseId,
              proposerSub: suppliedProposerSub,
              approverSub: approverAuth.sub,
              expiresAt,
              isError: false,
            },
          }
        }

        return {
          jsonrpc: "2.0",
          id: req.id,
          result: { isError: true, code: "E_UNKNOWN_TOOL", message: `Unknown tool: ${name}` },
        }
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id: req.id,
          result: { isError: true, code: err.code ?? "E_TOOL_ERROR", message: err.message },
        }
      }
    }

    return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found" } }
  }

  return { handleRequest }
}

export function runStdioServer(config) {
  const server = createReferenceMcpServer(config)
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
  rl.on("line", (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      const req = JSON.parse(trimmed)
      const res = server.handleRequest(req)
      if (res) process.stdout.write(JSON.stringify(res) + "\n")
    } catch {
      process.stdout.write(
        JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n",
      )
    }
  })
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.includes("--self-test")) {
    const approvalSecret = "self-test-approval-secret-0123456789abcdef"
    const oauthTokenSecret = "self-test-oauth2-secret-0123456789abcdef"
    const expectedAudience = "https://mcp.example.internal/agentic-architecture"
    const now = new Date("2026-10-24T12:00:00Z")
    const exp = Math.floor(now.getTime() / 1000) + 600
    const server = createReferenceMcpServer({
      approvalSecret,
      oauthTokenSecret,
      expectedAudience,
      nowFn: () => now,
    })
    const makerBearer = "Bearer " + issueOAuth2AccessToken(
      { sub: "agent:maker", tenantId: "tenant_alpha", aud: expectedAudience, scope: "architecture:read architecture:draft", exp },
      oauthTokenSecret,
    )
    const init = server.handleRequest({ jsonrpc: "2.0", id: 1, method: "initialize" })
    const readRes = server.handleRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "architecture_lookup", arguments: { patternId: "PAT-01" }, _meta: { authorization: makerBearer } },
    })
    console.log(JSON.stringify({ ok: true, serverInfo: init.result.serverInfo, tenantId: readRes.result.tenantId }, null, 2))
  } else {
    runStdioServer({
      approvalSecret: process.env.MCP_APPROVAL_SECRET,
      oauthTokenSecret: process.env.MCP_OAUTH_TOKEN_SECRET,
      expectedAudience: process.env.MCP_EXPECTED_AUDIENCE,
    })
  }
}
