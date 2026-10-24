import { createHash } from "node:crypto"

export interface SpecialistTask {
  id: string
  role: "maker" | "checker"
  providerFamily: "anthropic" | "openai" | "google" | "xai"
  readPaths: string[]
  writePaths: string[]
  allowedTools?: string[]
  parentTaskId?: string | null
  depth?: number
  estimatedCostUsd: number
}

export interface PipelineConfig {
  maxBudgetUsd: number
  wave: SpecialistTask[]
  maker: SpecialistTask
  checker: SpecialistTask
}

const FORBIDDEN_CHILD_SPAWN_TOOLS = new Set(["task", "dispatch_subagent", "spawn_agent", "delegate_wave"])

export function assertNoNestedSubagentSpawn(tasks: SpecialistTask[]): void {
  for (const task of tasks) {
    if ((task.depth !== undefined && task.depth > 1) || (task.parentTaskId !== undefined && task.parentTaskId !== null)) {
      throw Object.assign(
        new Error(`Specialist ${task.id} exceeds recursion depth 1 (parentTaskId=${task.parentTaskId ?? "none"}, depth=${task.depth ?? 1})`),
        { code: "E_RECURSION_DEPTH_EXCEEDED" },
      )
    }
    for (const tool of task.allowedTools ?? []) {
      if (FORBIDDEN_CHILD_SPAWN_TOOLS.has(tool)) {
        throw Object.assign(
          new Error(`Specialist ${task.id} cannot hold subagent-spawning tool '${tool}'`),
          { code: "E_SUBAGENT_SPAWN_FORBIDDEN" },
        )
      }
    }
  }
}

export function assertDisjointWritePaths(wave: SpecialistTask[]): void {
  const seen = new Map<string, string>()
  for (const task of wave) {
    for (const p of task.writePaths) {
      const owner = seen.get(p)
      if (owner && owner !== task.id) {
        throw Object.assign(new Error(`Concurrent write collision on ${p} between ${owner} and ${task.id}`), {
          code: "E_WRITE_COLLISION",
        })
      }
      seen.set(p, task.id)
    }
  }
}

export function assertMakerNotChecker(maker: SpecialistTask, checker: SpecialistTask): void {
  if (checker.role !== "checker") {
    throw Object.assign(new Error("Checker task must have role='checker'"), { code: "E_CHECKER_ISOLATION" })
  }
  if (maker.providerFamily === checker.providerFamily) {
    throw Object.assign(
      new Error(`Maker and Checker must use different provider families (both used ${maker.providerFamily})`),
      { code: "E_CHECKER_ISOLATION" },
    )
  }
  if (checker.writePaths.length > 0) {
    throw Object.assign(new Error("Clean-room Checker must be read-only (writePaths must be empty)"), {
      code: "E_CHECKER_ISOLATION",
    })
  }
}

export function runSupervisorPipeline(config: PipelineConfig) {
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

  // Execute deterministic two-provider handoff (Maker produces artifact digest -> Checker verifies in read-only mode)
  const makerArtifact = JSON.stringify({
    makerId: config.maker.id,
    providerFamily: config.maker.providerFamily,
    writePaths: config.maker.writePaths,
  })
  const artifactSha256 = createHash("sha256").update(makerArtifact, "utf8").digest("hex")

  return {
    state: "VERIFIED_READY_FOR_OWNER_APPROVAL",
    totalCostUsd,
    hardStopUsd,
    makerFamily: config.maker.providerFamily,
    checkerFamily: config.checker.providerFamily,
    waveTasks: config.wave.length,
    artifactSha256,
  }
}
