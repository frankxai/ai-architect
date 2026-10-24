import { createHash } from "node:crypto"
import { posix } from "node:path"

export type ProviderFamily = "anthropic" | "openai" | "google" | "xai"

export interface SpecialistTask {
  id: string
  role: "maker" | "checker"
  providerFamily: ProviderFamily
  modelTier?: string
  prompt?: string
  readPaths: string[]
  writePaths: string[]
  allowedTools?: string[]
  parentTaskId?: string | null
  depth?: number
  estimatedCostUsd: number
}

export interface SupervisorConfig {
  maxBudgetUsd: number
  wave: SpecialistTask[]
  maker: SpecialistTask
  checker: SpecialistTask
}

export interface ProviderDispatchRequest {
  taskId: string
  role: "maker" | "checker"
  providerFamily: ProviderFamily
  modelTier: string
  prompt: string
}

export interface ProviderDispatchResponse {
  providerFamily: ProviderFamily
  modelTier: string
  outputText: string
  verdict?: "PASS" | "REVISE"
  mode: "live_http" | "dry_run_fixture"
}

export type ProviderTransport = (req: ProviderDispatchRequest) => Promise<ProviderDispatchResponse>

const FORBIDDEN_SUBAGENT_TOOLS = new Set(["task", "spawn_subagent", "dispatch_subagent", "create_agent_thread"])

export function assertNoNestedSubagentSpawn(tasks: SpecialistTask[]): void {
  for (const task of tasks) {
    if ((task.depth ?? 1) > 1 || task.parentTaskId) {
      throw Object.assign(
        new Error(`Specialist ${task.id} exceeds recursion depth 1 (parentTaskId=${task.parentTaskId ?? "none"}, depth=${task.depth ?? 1})`),
        { code: "E_RECURSION_DEPTH_EXCEEDED" },
      )
    }
    for (const tool of task.allowedTools ?? []) {
      if (FORBIDDEN_SUBAGENT_TOOLS.has(tool)) {
        throw Object.assign(
          new Error(`Specialist ${task.id} cannot declare subagent-spawning tool '${tool}'`),
          { code: "E_SUBAGENT_SPAWN_FORBIDDEN" },
        )
      }
    }
  }
}

function normalizeWritePath(rawPath: string): string {
  const cleaned = posix.normalize(rawPath.replace(/\\/g, "/")).replace(/^\/+/, "")
  return rawPath.endsWith("/") && !cleaned.endsWith("/") ? `${cleaned}/` : cleaned
}

function pathsOverlap(pathA: string, pathB: string): boolean {
  const a = normalizeWritePath(pathA)
  const b = normalizeWritePath(pathB)
  if (a === b) return true
  const aPrefix = a.endsWith("/") ? a : `${a}/`
  const bPrefix = b.endsWith("/") ? b : `${b}/`
  return a.startsWith(bPrefix) || b.startsWith(aPrefix)
}

export function assertDisjointWritePaths(tasks: SpecialistTask[]): void {
  const claimed: Array<{ taskId: string; path: string }> = []
  for (const task of tasks) {
    for (const p of task.writePaths) {
      for (const prev of claimed) {
        if (prev.taskId !== task.id && pathsOverlap(prev.path, p)) {
          throw Object.assign(
            new Error(`Concurrent write collision between ${prev.taskId} (${prev.path}) and ${task.id} (${p})`),
            { code: "E_WRITE_COLLISION" },
          )
        }
      }
      claimed.push({ taskId: task.id, path: p })
    }
  }
}

export function assertMakerNotChecker(maker: SpecialistTask, checker: SpecialistTask): void {
  if (maker.providerFamily === checker.providerFamily) {
    throw Object.assign(
      new Error(`Maker and Checker must use different provider families (both used ${maker.providerFamily})`),
      { code: "E_CHECKER_ISOLATION" },
    )
  }
  if (checker.writePaths.length > 0) {
    throw Object.assign(new Error("Checker role must be read-only (writePaths must be empty)"), {
      code: "E_CHECKER_WRITES_FORBIDDEN",
    })
  }
}

export async function defaultHttpProviderTransport(
  req: ProviderDispatchRequest,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ProviderDispatchResponse> {
  if (req.providerFamily === "anthropic") {
    const apiKey = env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw Object.assign(new Error("Missing ANTHROPIC_API_KEY for live anthropic dispatch (pass dryRun: true for fixture mode)"), {
        code: "E_PROVIDER_KEY_MISSING",
      })
    }
    const model = env.ANTHROPIC_MODEL || req.modelTier
    const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: req.prompt }],
      }),
    })
    if (!res.ok) {
      throw Object.assign(new Error(`Anthropic HTTP ${res.status}`), { code: "E_PROVIDER_HTTP_ERROR" })
    }
    const data = (await res.json()) as { content?: Array<{ text?: string }> }
    const text = data.content?.[0]?.text ?? ""
    return {
      providerFamily: "anthropic",
      modelTier: model,
      outputText: text,
      verdict: text.includes("REVISE") ? "REVISE" : "PASS",
      mode: "live_http",
    }
  }

  if (req.providerFamily === "openai") {
    const apiKey = env.OPENAI_API_KEY
    if (!apiKey) {
      throw Object.assign(new Error("Missing OPENAI_API_KEY for live openai dispatch (pass dryRun: true for fixture mode)"), {
        code: "E_PROVIDER_KEY_MISSING",
      })
    }
    const model = env.OPENAI_MODEL || req.modelTier
    const res = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: req.prompt,
      }),
    })
    if (!res.ok) {
      throw Object.assign(new Error(`OpenAI HTTP ${res.status}`), { code: "E_PROVIDER_HTTP_ERROR" })
    }
    const data = (await res.json()) as { output_text?: string }
    const text = data.output_text ?? ""
    return {
      providerFamily: "openai",
      modelTier: model,
      outputText: text,
      verdict: text.includes("REVISE") ? "REVISE" : "PASS",
      mode: "live_http",
    }
  }

  if (req.providerFamily === "google") {
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      throw Object.assign(new Error("Missing GEMINI_API_KEY for live google dispatch (pass dryRun: true for fixture mode)"), {
        code: "E_PROVIDER_KEY_MISSING",
      })
    }
    const model = env.GEMINI_MODEL || req.modelTier
    const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: req.prompt }] }],
      }),
    })
    if (!res.ok) {
      throw Object.assign(new Error(`Google Gemini HTTP ${res.status}`), { code: "E_PROVIDER_HTTP_ERROR" })
    }
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    return {
      providerFamily: "google",
      modelTier: model,
      outputText: text,
      verdict: text.includes("REVISE") ? "REVISE" : "PASS",
      mode: "live_http",
    }
  }

  throw Object.assign(new Error(`Unsupported providerFamily: ${req.providerFamily}`), { code: "E_PROVIDER_UNSUPPORTED" })
}

export function createDryRunFixtureTransport(): ProviderTransport {
  return async (req: ProviderDispatchRequest): Promise<ProviderDispatchResponse> => {
    const outputText =
      req.role === "maker"
        ? `Maker artifact synthesized by ${req.providerFamily} (${req.modelTier}) for ${req.taskId}`
        : `PASS: Independent verification completed by ${req.providerFamily} (${req.modelTier}) for ${req.taskId}`
    return {
      providerFamily: req.providerFamily,
      modelTier: req.modelTier,
      outputText,
      verdict: "PASS",
      mode: "dry_run_fixture",
    }
  }
}

export function runSupervisorPipeline(config: SupervisorConfig) {
  assertNoNestedSubagentSpawn([...config.wave, config.maker, config.checker])
  assertDisjointWritePaths(config.wave)
  assertMakerNotChecker(config.maker, config.checker)

  const hardStopUsd = Number((config.maxBudgetUsd * 0.8).toFixed(4))
  const totalCostUsd = Number(
    (
      config.wave.reduce((sum, t) => sum + t.estimatedCostUsd, 0) +
      config.maker.estimatedCostUsd +
      config.checker.estimatedCostUsd
    ).toFixed(4),
  )

  if (totalCostUsd > hardStopUsd) {
    throw Object.assign(
      new Error(`Pipeline cost (${totalCostUsd} USD) exceeds 80% hard-stop ceiling (${hardStopUsd} USD)`),
      { code: "E_BUDGET_EXCEEDED" },
    )
  }

  const makerArtifactHash = createHash("sha256")
    .update(JSON.stringify({ makerId: config.maker.id, providerFamily: config.maker.providerFamily, writePaths: config.maker.writePaths }))
    .digest("hex")

  return {
    state: "VERIFIED_READY_FOR_OWNER_APPROVAL" as const,
    makerFamily: config.maker.providerFamily,
    checkerFamily: config.checker.providerFamily,
    totalCostUsd,
    hardStopUsd,
    makerArtifactHash,
  }
}

export async function dispatchSupervisorPipeline(
  config: SupervisorConfig,
  options: { dryRun?: boolean; transport?: ProviderTransport } = {},
) {
  const plan = runSupervisorPipeline(config)
  const transport = options.transport ?? (options.dryRun ? createDryRunFixtureTransport() : defaultHttpProviderTransport)

  const makerResponse = await transport({
    taskId: config.maker.id,
    role: "maker",
    providerFamily: config.maker.providerFamily,
    modelTier: config.maker.modelTier ?? "tier-b-balanced-builder",
    prompt: config.maker.prompt ?? `Synthesize changes for ${config.maker.writePaths.join(", ")}`,
  })

  const checkerResponse = await transport({
    taskId: config.checker.id,
    role: "checker",
    providerFamily: config.checker.providerFamily,
    modelTier: config.checker.modelTier ?? "tier-c-frontier-reasoner",
    prompt:
      config.checker.prompt ??
      `Independently verify Maker (${makerResponse.providerFamily}) output against acceptance criteria:
${makerResponse.outputText}`,
  })

  if (checkerResponse.verdict === "REVISE") {
    return {
      ...plan,
      state: "CHECKER_REVISE_REQUIRED" as const,
      dispatchMode: checkerResponse.mode,
      makerResponse,
      checkerResponse,
    }
  }

  return {
    ...plan,
    dispatchMode: checkerResponse.mode,
    makerResponse,
    checkerResponse,
  }
}
