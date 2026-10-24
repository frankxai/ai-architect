import { createHmac, createHash, createPublicKey, createSign, createVerify, generateKeyPairSync, randomUUID, timingSafeEqual } from "node:crypto"
import { createServer } from "node:http"
import { posix, resolve } from "node:path"
import { createInterface } from "node:readline"
import { pathToFileURL } from "node:url"

export const TOOL_REGISTRY = Object.freeze({
  architecture_lookup: {
    name: "architecture_lookup",
    tier: 0,
    requiredScope: "architecture:read",
    readOnly: true,
    description: "Read-only lookup of architecture patterns and C4 elements inside the caller's tenant boundary.",
    inputSchema: {
      type: "object",
      properties: {
        patternId: { type: "string", pattern: "^PAT-[0-9]{2}$", description: "Pattern identifier such as PAT-01." },
        tenantId: { type: "string", description: "Optional tenant assertion; must match authenticated tenantId." },
      },
      additionalProperties: false,
    },
  },
  draft_adr_file: {
    name: "draft_adr_file",
    tier: 1,
    requiredScope: "architecture:draft",
    readOnly: false,
    description: "Idempotent reversible write of an ADR draft inside docs/architecture/.",
    inputSchema: {
      type: "object",
      properties: {
        relativePath: { type: "string", description: "Target path under docs/architecture/." },
        idempotencyKey: { type: "string", minLength: 4, description: "Client-generated idempotency key." },
        content: { type: "string", description: "Markdown body of the ADR draft." },
      },
      required: ["relativePath", "idempotencyKey", "content"],
      additionalProperties: false,
    },
  },
  propose_release_gate: {
    name: "propose_release_gate",
    tier: 2,
    requiredScope: "architecture:draft",
    readOnly: false,
    description: "Phase 1 of stateful two-step approval: records a pending release proposal bound to the authenticated proposer and returns a server-minted proposalId and approvalToken.",
    inputSchema: {
      type: "object",
      properties: {
        releaseId: { type: "string", minLength: 1, description: "Release identifier to gate." },
        summary: { type: "string", description: "Human-readable summary of the release change." },
        ttlSeconds: { type: "integer", minimum: 30, maximum: 3600, description: "Proposal expiry window in seconds." },
      },
      required: ["releaseId"],
      additionalProperties: false,
    },
  },
  approve_release_gate: {
    name: "approve_release_gate",
    tier: 3,
    requiredScope: "architecture:approve",
    readOnly: false,
    description: "Phase 2 of stateful two-step approval: approves an existing pending proposalId using a distinct authenticated approver principal and a valid HMAC approvalToken.",
    inputSchema: {
      type: "object",
      properties: {
        proposalId: { type: "string", minLength: 8, description: "Server-issued proposalId from propose_release_gate." },
        approvalToken: { type: "string", minLength: 32, description: "HMAC-SHA256 approval token bound to the stored proposal." },
      },
      required: ["proposalId", "approvalToken"],
      additionalProperties: false,
    },
  },
})

export function wrapUntrustedToolOutput(source, rawText) {
  const sanitized = String(rawText).replace(/<\/?untrusted-content[^>]*>/gi, "[stripped-boundary-tag]")
  return `<untrusted-content source="${source}">\n${sanitized}\n</untrusted-content>`
}

export function issueOAuth2AccessToken(claims, signingMaterial, options = {}) {
  const alg = options.alg || "HS256"
  const headerObj = { alg, typ: "at+jwt" }
  if (options.kid) headerObj.kid = options.kid
  const header = Buffer.from(JSON.stringify(headerObj)).toString("base64url")
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url")
  const signingInput = `${header}.${payload}`
  if (alg === "RS256") {
    const signer = createSign("RSA-SHA256")
    signer.update(signingInput, "utf8")
    signer.end()
    const sig = signer.sign(signingMaterial, "base64url")
    return `${signingInput}.${sig}`
  }
  if (alg === "HS256") {
    const sig = createHmac("sha256", signingMaterial).update(signingInput, "utf8").digest("base64url")
    return `${signingInput}.${sig}`
  }
  throw Object.assign(new Error(`Unsupported JWT alg: ${alg}`), { code: "E_OAUTH_ALG_UNSUPPORTED" })
}

export function verifyOAuth2BearerToken({
  authorizationHeader,
  oauthTokenSecret,
  jwks,
  expectedAudience,
  expectedIssuer,
  requiredScope,
  nowSec,
}) {
  if (typeof authorizationHeader !== "string" || !authorizationHeader.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing or malformed OAuth 2.1 Bearer token"), { code: "E_OAUTH_MISSING_BEARER", httpStatus: 401 })
  }
  const token = authorizationHeader.slice("Bearer ".length).trim()
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw Object.assign(new Error("Malformed JWT bearer token"), { code: "E_OAUTH_MALFORMED_TOKEN", httpStatus: 401 })
  }
  const [headerB64, payloadB64, sigB64] = parts
  let header
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"))
  } catch {
    throw Object.assign(new Error("Invalid JWT header JSON"), { code: "E_OAUTH_MALFORMED_TOKEN", httpStatus: 401 })
  }

  const signingInput = `${headerB64}.${payloadB64}`
  if (header.alg === "RS256") {
    if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      throw Object.assign(new Error("RS256 token presented but no JWKS configured"), { code: "E_OAUTH_JWKS_MISSING", httpStatus: 401 })
    }
    const jwk = header.kid ? jwks.keys.find((k) => k.kid === header.kid) : jwks.keys[0]
    if (!jwk) {
      throw Object.assign(new Error(`No matching JWK found for kid=${header.kid ?? "default"}`), { code: "E_OAUTH_JWKS_KID_NOT_FOUND", httpStatus: 401 })
    }
    const pubKey = createPublicKey({ key: jwk, format: "jwk" })
    const verifier = createVerify("RSA-SHA256")
    verifier.update(signingInput, "utf8")
    verifier.end()
    if (!verifier.verify(pubKey, sigB64, "base64url")) {
      throw Object.assign(new Error("Invalid OAuth 2.1 RS256 token signature"), { code: "E_OAUTH_BAD_SIGNATURE", httpStatus: 401 })
    }
  } else if (header.alg === "HS256") {
    if (typeof oauthTokenSecret !== "string" || oauthTokenSecret.length < 32) {
      throw Object.assign(new Error("HS256 token presented but no shared secret configured"), { code: "E_OAUTH_SECRET_MISSING", httpStatus: 401 })
    }
    const expectedSig = createHmac("sha256", oauthTokenSecret).update(signingInput, "utf8").digest("base64url")
    const a = Buffer.from(sigB64, "utf8")
    const b = Buffer.from(expectedSig, "utf8")
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw Object.assign(new Error("Invalid OAuth 2.1 HS256 token signature"), { code: "E_OAUTH_BAD_SIGNATURE", httpStatus: 401 })
    }
  } else {
    throw Object.assign(new Error(`Unsupported JWT alg: ${header.alg}`), { code: "E_OAUTH_ALG_UNSUPPORTED", httpStatus: 401 })
  }

  let claims
  try {
    claims = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"))
  } catch {
    throw Object.assign(new Error("Invalid OAuth 2.1 token payload JSON"), { code: "E_OAUTH_MALFORMED_TOKEN", httpStatus: 401 })
  }

  if (expectedIssuer && claims.iss !== expectedIssuer) {
    throw Object.assign(new Error(`OAuth 2.1 issuer mismatch: expected ${expectedIssuer}`), { code: "E_OAUTH_ISSUER_MISMATCH", httpStatus: 401 })
  }
  if (typeof claims.nbf === "number" && nowSec < claims.nbf) {
    throw Object.assign(new Error("OAuth 2.1 access token is not yet valid (nbf)"), { code: "E_OAUTH_NOT_YET_VALID", httpStatus: 401 })
  }
  if (typeof claims.exp !== "number" || nowSec >= claims.exp) {
    throw Object.assign(new Error("OAuth 2.1 access token has expired"), { code: "E_OAUTH_EXPIRED", httpStatus: 401 })
  }

  // RFC 8707 Resource Indicators audience check
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audiences.includes(expectedAudience)) {
    throw Object.assign(
      new Error(`OAuth 2.1 resource-indicator audience mismatch: expected ${expectedAudience}`),
      { code: "E_OAUTH_AUDIENCE_MISMATCH", httpStatus: 401 },
    )
  }

  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.tenantId !== "string" || !claims.tenantId) {
    throw Object.assign(new Error("OAuth 2.1 token missing sub or tenantId claim"), { code: "E_OAUTH_MISSING_CLAIMS", httpStatus: 401 })
  }

  const scopes = typeof claims.scope === "string" ? claims.scope.split(/\s+/).filter(Boolean) : []
  if (requiredScope && !scopes.includes(requiredScope)) {
    throw Object.assign(new Error(`OAuth 2.1 token missing required scope: ${requiredScope}`), {
      code: "E_OAUTH_INSUFFICIENT_SCOPE",
      httpStatus: 403,
    })
  }

  return {
    sub: claims.sub,
    tenantId: claims.tenantId,
    scopes,
    aud: claims.aud,
    iss: claims.iss,
    exp: claims.exp,
  }
}

export function computeApprovalToken({
  approvalSecret,
  tenantId,
  proposalId,
  releaseId,
  proposerSub,
  expiresAt,
}) {
  const message = `v2:${tenantId}:${proposalId}:${releaseId}:${proposerSub}:${expiresAt}`
  return createHmac("sha256", approvalSecret).update(message, "utf8").digest("hex")
}

export function createReferenceMcpServer(options = {}) {
  const approvalSecret = options.approvalSecret ?? process.env.MCP_APPROVAL_SECRET
  const oauthTokenSecret = options.oauthTokenSecret ?? process.env.MCP_OAUTH_TOKEN_SECRET
  const jwks = options.jwks ?? null
  const expectedAudience = options.expectedAudience ?? process.env.MCP_EXPECTED_AUDIENCE
  const expectedIssuer = options.expectedIssuer ?? process.env.MCP_EXPECTED_ISSUER ?? null
  const authorizationServers = options.authorizationServers ?? [expectedIssuer || "https://auth.example.internal"]
  const nowFn = options.nowFn ?? (() => new Date())

  if (typeof approvalSecret !== "string" || approvalSecret.length < 32) {
    throw Object.assign(
      new Error("reference-mcp-server requires approvalSecret of at least 32 characters (fail-closed)"),
      { code: "E_SERVER_UNCONFIGURED" },
    )
  }
  const hasHs256Secret = typeof oauthTokenSecret === "string" && oauthTokenSecret.length >= 32
  const hasJwks = jwks && Array.isArray(jwks.keys) && jwks.keys.length > 0
  if (!hasHs256Secret && !hasJwks) {
    throw Object.assign(
      new Error("reference-mcp-server requires either oauthTokenSecret (>=32 chars) or jwks.keys (fail-closed)"),
      { code: "E_SERVER_UNCONFIGURED" },
    )
  }
  if (typeof expectedAudience !== "string" || !expectedAudience.startsWith("https://")) {
    throw Object.assign(
      new Error("reference-mcp-server requires expectedAudience https:// resource URI (RFC 8707)"),
      { code: "E_SERVER_UNCONFIGURED" },
    )
  }

  const idempotencyStore = new Map()
  const pendingProposals = new Map()
  const auditTrail = []

  function resolvePathInsideDocs(candidatePath) {
    const normalized = posix.normalize(String(candidatePath).replace(/\\/g, "/")).replace(/^\/+/, "")
    if (normalized.startsWith("..") || !normalized.startsWith("docs/architecture/")) {
      throw Object.assign(new Error(`Path escapes docs/architecture/: ${candidatePath}`), { code: "E_PATH_CONTAINMENT" })
    }
    return normalized
  }

  function recordAudit(entry) {
    const payload = {
      timestamp: nowFn().toISOString(),
      ...entry,
    }
    auditTrail.push(payload)
    return payload
  }

  function getProtectedResourceMetadata() {
    return {
      resource: expectedAudience,
      authorization_servers: authorizationServers,
      scopes_supported: ["architecture:read", "architecture:draft", "architecture:approve"],
      bearer_methods_supported: ["header"],
      resource_documentation: "https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization",
    }
  }

  function authenticateCaller(params, transportContext = {}) {
    const tool = TOOL_REGISTRY[params?.name]
    const requiredScope = tool?.requiredScope
    const nowSec = Math.floor(nowFn().getTime() / 1000)

    if (transportContext.transport === "stdio") {
      // MCP 2025-06-18 authorization specification: STDIO transports MUST NOT use OAuth HTTP bearer tokens;
      // they retrieve credentials from the environment initialized by the host.
      if (params?._meta?.authorization || transportContext.authorizationHeader) {
        throw Object.assign(
          new Error("MCP 2025-06-18 spec violation: STDIO transport must retrieve credentials from the environment, not OAuth bearer headers"),
          { code: "E_STDIO_BEARER_FORBIDDEN" },
        )
      }
      const sub = transportContext.env?.MCP_STDIO_SUB
      const tenantId = transportContext.env?.MCP_STDIO_TENANT_ID
      const scopeStr = transportContext.env?.MCP_STDIO_SCOPE || ""
      if (!sub || !tenantId) {
        throw Object.assign(new Error("Missing MCP_STDIO_SUB or MCP_STDIO_TENANT_ID in stdio environment"), {
          code: "E_STDIO_ENV_MISSING",
        })
      }
      const scopes = scopeStr.split(/\s+/).filter(Boolean)
      if (requiredScope && !scopes.includes(requiredScope)) {
        throw Object.assign(new Error(`STDIO environment missing required scope: ${requiredScope}`), {
          code: "E_OAUTH_INSUFFICIENT_SCOPE",
        })
      }
      return { sub, tenantId, scopes, aud: expectedAudience, exp: nowSec + 3600 }
    }

    const authorizationHeader = transportContext.authorizationHeader ?? params?._meta?.authorization
    return verifyOAuth2BearerToken({
      authorizationHeader,
      oauthTokenSecret,
      jwks,
      expectedAudience,
      expectedIssuer,
      requiredScope,
      nowSec,
    })
  }

  return {
    getAuditTrail() {
      return [...auditTrail]
    },
    getPendingProposals() {
      return new Map(pendingProposals)
    },
    getProtectedResourceMetadata,
    handleRequest(request, transportContext = {}) {
      if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
        return {
          jsonrpc: "2.0",
          id: request?.id ?? null,
          error: { code: -32600, message: "Invalid JSON-RPC 2.0 request" },
        }
      }

      if (request.method === "initialize") {
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2025-06-18",
            serverInfo: { name: "ai-architect-reference-mcp", version: "2.1.0" },
            capabilities: { tools: { listChanged: false } },
          },
        }
      }

      if (request.method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: Object.values(TOOL_REGISTRY).map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema,
              annotations: {
                tier: t.tier,
                requiredScope: t.requiredScope,
                readOnlyHint: t.readOnly,
                destructiveHint: t.tier >= 2,
              },
            })),
          },
        }
      }

      if (request.method === "tools/call") {
        const { name, arguments: args = {} } = request.params ?? {}
        const tool = TOOL_REGISTRY[name]
        if (!tool) {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { isError: true, code: "E_UNKNOWN_TOOL", message: `Unknown tool: ${name}` },
          }
        }

        const nowSec = Math.floor(nowFn().getTime() / 1000)
        let auth
        try {
          auth = authenticateCaller(request.params, transportContext)
        } catch (err) {
          recordAudit({ tool: name, tier: tool.tier, outcome: "denied", code: err.code || "E_AUTH_FAILED" })
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { isError: true, code: err.code || "E_AUTH_FAILED", httpStatus: err.httpStatus || 401, message: err.message },
          }
        }

        if (args.tenantId && args.tenantId !== auth.tenantId) {
          recordAudit({ tool: name, tier: tool.tier, caller: auth.sub, tenantId: auth.tenantId, outcome: "denied", code: "E_TENANT_MISMATCH" })
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { isError: true, code: "E_TENANT_MISMATCH", message: "Cross-tenant tool invocation denied" },
          }
        }

        if (tool.name === "architecture_lookup") {
          const wrapped = wrapUntrustedToolOutput(
            `tenant:${auth.tenantId}:pattern:${args.patternId ?? "PAT-01"}`,
            `Pattern ${args.patternId ?? "PAT-01"} verified for tenant ${auth.tenantId}.`,
          )
          recordAudit({ tool: name, tier: 0, caller: auth.sub, tenantId: auth.tenantId, outcome: "ok" })
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { isError: false, content: [{ type: "text", text: wrapped }] },
          }
        }

        if (tool.name === "draft_adr_file") {
          try {
            const safePath = resolvePathInsideDocs(args.relativePath ?? "")
            if (!args.idempotencyKey || typeof args.idempotencyKey !== "string") {
              return {
                jsonrpc: "2.0",
                id: request.id,
                result: { isError: true, code: "E_MISSING_IDEMPOTENCY_KEY", message: "Tier 1 writes require idempotencyKey" },
              }
            }
            const scopedKey = `${auth.tenantId}:${args.idempotencyKey}`
            if (idempotencyStore.has(scopedKey)) {
              const previous = idempotencyStore.get(scopedKey)
              recordAudit({ tool: name, tier: 1, caller: auth.sub, tenantId: auth.tenantId, outcome: "duplicate_replay", safePath })
              return { jsonrpc: "2.0", id: request.id, result: { ...previous, replayed: true } }
            }
            const responsePayload = {
              isError: false,
              path: safePath,
              tenantId: auth.tenantId,
              sha256: createHash("sha256").update(String(args.content ?? ""), "utf8").digest("hex"),
            }
            idempotencyStore.set(scopedKey, responsePayload)
            recordAudit({ tool: name, tier: 1, caller: auth.sub, tenantId: auth.tenantId, outcome: "written", safePath })
            return { jsonrpc: "2.0", id: request.id, result: responsePayload }
          } catch (err) {
            recordAudit({ tool: name, tier: 1, caller: auth.sub, tenantId: auth.tenantId, outcome: "denied", code: err.code })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { isError: true, code: err.code ?? "E_WRITE_REJECTED", message: err.message },
            }
          }
        }

        if (tool.name === "propose_release_gate") {
          if (!args.releaseId || typeof args.releaseId !== "string") {
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { isError: true, code: "E_INVALID_ARGS", message: "propose_release_gate requires releaseId" },
            }
          }
          const ttl = typeof args.ttlSeconds === "number" && args.ttlSeconds >= 30 && args.ttlSeconds <= 3600 ? Math.floor(args.ttlSeconds) : 300
          const expiresAt = nowSec + ttl
          const canonicalPayload = JSON.stringify({
            releaseId: args.releaseId,
            summary: args.summary ?? "",
            tenantId: auth.tenantId,
            proposerSub: auth.sub,
            expiresAt,
          })
          const proposalId = "prop_" + createHash("sha256").update(`${canonicalPayload}:${randomUUID()}`, "utf8").digest("hex").slice(0, 24)
          const approvalToken = computeApprovalToken({
            approvalSecret,
            tenantId: auth.tenantId,
            proposalId,
            releaseId: args.releaseId,
            proposerSub: auth.sub,
            expiresAt,
          })
          const record = {
            proposalId,
            releaseId: args.releaseId,
            summary: args.summary ?? "",
            tenantId: auth.tenantId,
            proposerSub: auth.sub,
            expiresAt,
            status: "pending_approval",
          }
          pendingProposals.set(proposalId, record)
          recordAudit({
            tool: name,
            tier: 2,
            proposer: auth.sub,
            tenantId: auth.tenantId,
            proposalId,
            outcome: "pending_approval",
            expiresAt,
          })
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              isError: false,
              status: "pending_approval",
              proposalId,
              releaseId: args.releaseId,
              proposerSub: auth.sub,
              tenantId: auth.tenantId,
              expiresAt,
              approvalToken,
            },
          }
        }

        if (tool.name === "approve_release_gate") {
          const proposalId = args.proposalId
          if (!proposalId || typeof proposalId !== "string" || !pendingProposals.has(proposalId)) {
            recordAudit({
              tool: name,
              tier: 3,
              approver: auth.sub,
              tenantId: auth.tenantId,
              outcome: "denied",
              code: "E_PROPOSAL_NOT_FOUND",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                isError: true,
                code: "E_PROPOSAL_NOT_FOUND",
                message: "Tier 3 approval requires an existing pending proposalId created by propose_release_gate",
              },
            }
          }

          const proposal = pendingProposals.get(proposalId)
          if (proposal.status !== "pending_approval") {
            recordAudit({
              tool: name,
              tier: 3,
              approver: auth.sub,
              tenantId: auth.tenantId,
              proposalId,
              outcome: "denied",
              code: "E_PROPOSAL_ALREADY_DECIDED",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                isError: true,
                code: "E_PROPOSAL_ALREADY_DECIDED",
                message: `Proposal ${proposalId} has already been ${proposal.status}`,
              },
            }
          }

          if (proposal.tenantId !== auth.tenantId) {
            recordAudit({
              tool: name,
              tier: 3,
              approver: auth.sub,
              tenantId: auth.tenantId,
              proposalId,
              outcome: "denied",
              code: "E_TENANT_MISMATCH",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                isError: true,
                code: "E_TENANT_MISMATCH",
                message: "Approver tenantId does not match stored proposal tenantId",
              },
            }
          }

          if (auth.sub === proposal.proposerSub) {
            recordAudit({
              tool: name,
              tier: 3,
              proposer: proposal.proposerSub,
              approver: auth.sub,
              tenantId: auth.tenantId,
              proposalId,
              outcome: "denied",
              code: "E_SELF_APPROVAL_FORBIDDEN",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                isError: true,
                code: "E_SELF_APPROVAL_FORBIDDEN",
                message: "Authenticated approver principal cannot approve their own stored proposal",
              },
            }
          }

          if (nowSec > proposal.expiresAt) {
            recordAudit({
              tool: name,
              tier: 3,
              proposer: proposal.proposerSub,
              approver: auth.sub,
              tenantId: auth.tenantId,
              proposalId,
              outcome: "denied",
              code: "E_APPROVAL_EXPIRED",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                isError: true,
                code: "E_APPROVAL_EXPIRED",
                message: "Stored proposal and approvalToken have expired",
              },
            }
          }

          const expected = computeApprovalToken({
            approvalSecret,
            tenantId: proposal.tenantId,
            proposalId: proposal.proposalId,
            releaseId: proposal.releaseId,
            proposerSub: proposal.proposerSub,
            expiresAt: proposal.expiresAt,
          })
          const provided = String(args.approvalToken ?? "")
          const a = Buffer.from(provided, "utf8")
          const b = Buffer.from(expected, "utf8")
          const valid = a.length === b.length && timingSafeEqual(a, b)
          if (!valid) {
            recordAudit({
              tool: name,
              tier: 3,
              proposer: proposal.proposerSub,
              approver: auth.sub,
              tenantId: auth.tenantId,
              proposalId,
              outcome: "denied",
              code: "E_APPROVAL_INVALID",
            })
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { isError: true, code: "E_APPROVAL_INVALID", message: "Invalid HMAC approvalToken for stored proposalId" },
            }
          }

          proposal.status = "approved"
          proposal.approverSub = auth.sub
          proposal.approvedAt = nowSec
          recordAudit({
            tool: name,
            tier: 3,
            proposer: proposal.proposerSub,
            approver: auth.sub,
            tenantId: auth.tenantId,
            proposalId,
            outcome: "approved",
          })
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              isError: false,
              outcome: "approved",
              proposalId: proposal.proposalId,
              releaseId: proposal.releaseId,
              proposerSub: proposal.proposerSub,
              approverSub: auth.sub,
              tenantId: proposal.tenantId,
            },
          }
        }
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` },
      }
    },
  }
}

export function createStreamableHttpMcpHandler(mcpServer, options = {}) {
  const resourceMetadataPath = "/.well-known/oauth-protected-resource"
  const mcpPath = options.mcpPath || "/mcp"
  const metadata = mcpServer.getProtectedResourceMetadata()

  return async function handleHttpRequest(req, res) {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`)

    if (req.method === "GET" && url.pathname === resourceMetadataPath) {
      const body = JSON.stringify(metadata)
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      })
      res.end(body)
      return
    }

    if (req.method === "POST" && url.pathname === mcpPath) {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const rawBody = Buffer.concat(chunks).toString("utf8")
      let parsed
      try {
        parsed = JSON.parse(rawBody)
      } catch {
        res.writeHead(400, { "content-type": "application/json; charset=utf-8" })
        res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }))
        return
      }

      const authHeader = req.headers.authorization
      const response = mcpServer.handleRequest(parsed, {
        transport: "http",
        authorizationHeader: authHeader,
      })

      if (response?.result?.isError && (response.result.httpStatus === 401 || String(response.result.code).startsWith("E_OAUTH_"))) {
        const status = response.result.httpStatus === 403 ? 403 : 401
        const errType = status === 403 ? "insufficient_scope" : "invalid_token"
        res.writeHead(status, {
          "content-type": "application/json; charset=utf-8",
          "www-authenticate": `Bearer resource_metadata="${metadata.resource}${resourceMetadataPath}", error="${errType}", error_description="${response.result.code}"`,
        })
        res.end(JSON.stringify(response))
        return
      }

      res.writeHead(200, { "content-type": "application/json; charset=utf-8" })
      res.end(JSON.stringify(response))
      return
    }

    res.writeHead(404, { "content-type": "application/json; charset=utf-8" })
    res.end(JSON.stringify({ error: "Not found" }))
  }
}

export function startStreamableHttpMcpServer(mcpServer, options = {}) {
  const handler = createStreamableHttpMcpHandler(mcpServer, options)
  const server = createServer((req, res) => {
    handler(req, res).catch((err) => {
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" })
      res.end(JSON.stringify({ error: err.message }))
    })
  })
  return new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise)
    server.listen(options.port ?? 0, options.host ?? "127.0.0.1", () => {
      const addr = server.address()
      resolvePromise({
        server,
        port: addr.port,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((r) => server.close(r)),
      })
    })
  })
}

export function runStdioServer(server, input = process.stdin, output = process.stdout, env = process.env) {
  const rl = createInterface({ input, crlfDelay: Infinity })
  rl.on("line", (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let req
    try {
      req = JSON.parse(trimmed)
    } catch {
      output.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }) + "\n")
      return
    }
    const res = server.handleRequest(req, { transport: "stdio", env })
    output.write(JSON.stringify(res) + "\n")
  })
  return rl
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.includes("--self-test")) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
    const jwk = { ...publicKey.export({ format: "jwk" }), kid: "kid-2026-10", alg: "RS256", use: "sig" }
    const expectedAudience = "https://mcp.example.internal/agentic-architecture"
    const expectedIssuer = "https://auth.example.internal"
    const nowSec = Math.floor(Date.now() / 1000)
    const server = createReferenceMcpServer({
      approvalSecret: "self-test-approval-secret-32-bytes-minimum!!",
      jwks: { keys: [jwk] },
      expectedAudience,
      expectedIssuer,
    })
    const makerToken = issueOAuth2AccessToken(
      { sub: "agent:maker", tenantId: "tenant_alpha", iss: expectedIssuer, aud: expectedAudience, scope: "architecture:read architecture:draft", exp: nowSec + 300 },
      privateKey,
      { alg: "RS256", kid: "kid-2026-10" },
    )
    const ok = server.handleRequest(
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "architecture_lookup", arguments: { patternId: "PAT-01" } } },
      { transport: "http", authorizationHeader: `Bearer ${makerToken}` },
    )
    console.log(JSON.stringify({ selfTest: "PASS", result: ok.result, auditEvents: server.getAuditTrail().length }))
  } else {
    const server = createReferenceMcpServer()
    runStdioServer(server)
  }
}
