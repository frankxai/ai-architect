#!/usr/bin/env node
import { createHash, timingSafeEqual } from "node:crypto"
import { posix } from "node:path"

/**
 * Reference MCP Server demonstrating PAT-01 and PAT-05:
 * - Tier 0 read tool wraps untrusted data in <untrusted-content> and strips closing tags
 * - Tier 1 draft tool enforces path containment under docs/architecture and idempotencyKey
 * - Tier 2 release-gate write tool requires a distinct approverId and SHA-256 approvalToken
 */
export function wrapUntrusted(source, rawText) {
  const sanitized = String(rawText).replace(/<\/?untrusted-content[^>]*>/gi, "[stripped-boundary-tag]")
  return `<untrusted-content source="${source}">\n${sanitized}\n</untrusted-content>`
}

export function computeApprovalToken(secret, toolName, canonicalPayload, approverId) {
  return createHash("sha256")
    .update(`${secret}:${toolName}:${approverId}:${canonicalPayload}`, "utf8")
    .digest("hex")
}

export function createReferenceMcpServer({ approvalSecret = "mcp-reference-approval-secret-0123456789" } = {}) {
  const idempotencyLedger = new Map()

  function assertSafeRelativePath(candidatePath) {
    if (typeof candidatePath !== "string" || !candidatePath.trim()) {
      throw Object.assign(new Error("Path is required"), { code: "E_PATH_CONTAINMENT" })
    }
    const normalized = posix.normalize(candidatePath.trim().replace(/\\/g, "/"))
    if (normalized.startsWith("/") || normalized.startsWith("../") || normalized === ".." || !normalized.startsWith("docs/architecture/")) {
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
          serverInfo: { name: "agentic-architecture-reference-mcp", version: "1.0.0" },
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
            { name: "architecture_lookup", description: "Tier 0 read-only pattern lookup with untrusted-content wrapping" },
            { name: "stage_adr_draft", description: "Tier 1 idempotent draft staging confined to docs/architecture/" },
            { name: "approve_release_gate", description: "Tier 2 two-phase confirm-gated release approval" },
          ],
        },
      }
    }

    if (req.method === "tools/call") {
      const { name, arguments: args = {} } = req.params ?? {}
      try {
        if (name === "architecture_lookup") {
          if (!args.tenantId) throw Object.assign(new Error("tenantId is required"), { code: "E_TENANT_REQUIRED" })
          const wrapped = wrapUntrusted(`pattern:${args.patternId ?? "PAT-01"}`, args.note ?? "Scoped Capability Proxy")
          return { jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: wrapped }], isError: false } }
        }

        if (name === "stage_adr_draft") {
          if (!args.idempotencyKey) throw Object.assign(new Error("idempotencyKey is required"), { code: "E_IDEMPOTENCY_REQUIRED" })
          const safePath = assertSafeRelativePath(args.targetPath)
          if (idempotencyLedger.has(args.idempotencyKey)) {
            return { jsonrpc: "2.0", id: req.id, result: { outcome: "duplicate_replay", path: safePath, isError: false } }
          }
          idempotencyLedger.set(args.idempotencyKey, safePath)
          return { jsonrpc: "2.0", id: req.id, result: { outcome: "staged", path: safePath, isError: false } }
        }

        if (name === "approve_release_gate") {
          const { proposerId, approverId, releaseId, approvalToken } = args
          if (!proposerId || !approverId || !releaseId) {
            throw Object.assign(new Error("proposerId, approverId, and releaseId are required"), { code: "E_INVALID_ARGS" })
          }
          if (proposerId === approverId) {
            throw Object.assign(new Error("Proposer cannot approve its own Tier-2 action"), { code: "E_SELF_APPROVAL_FORBIDDEN" })
          }
          const canonical = JSON.stringify({ proposerId, releaseId })
          if (!approvalToken) {
            return {
              jsonrpc: "2.0",
              id: req.id,
              result: { outcome: "pending_approval", code: "E_APPROVAL_REQUIRED", payloadSha256: createHash("sha256").update(canonical).digest("hex"), isError: false },
            }
          }
          const expected = computeApprovalToken(approvalSecret, "approve_release_gate", canonical, approverId)
          const a = Buffer.from(String(approvalToken), "utf8")
          const b = Buffer.from(expected, "utf8")
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            throw Object.assign(new Error("Invalid approvalToken signature"), { code: "E_APPROVAL_SIGNATURE" })
          }
          return { jsonrpc: "2.0", id: req.id, result: { outcome: "approved", releaseId, approverId, isError: false } }
        }

        return { jsonrpc: "2.0", id: req.id, result: { isError: true, code: "E_UNKNOWN_TOOL", message: `Unknown tool: ${name}` } }
      } catch (err) {
        return { jsonrpc: "2.0", id: req.id, result: { isError: true, code: err.code ?? "E_TOOL_ERROR", message: err.message } }
      }
    }

    return { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: "Method not found" } }
  }

  return { handleRequest }
}
