export interface SpecialistTask {
  id: string
  role: "maker" | "checker"
  providerFamily: "anthropic" | "openai" | "google" | "xai"
  readPaths: string[]
  writePaths: string[]
  estimatedCostUsd: number
}

export interface PipelineConfig {
  maxBudgetUsd: number
  wave: SpecialistTask[]
  maker: SpecialistTask
  checker: SpecialistTask
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

  return {
    state: "VERIFIED_READY_FOR_OWNER_APPROVAL",
    totalCostUsd,
    hardStopUsd,
    makerFamily: config.maker.providerFamily,
    checkerFamily: config.checker.providerFamily,
    waveTasks: config.wave.length,
  }
}
