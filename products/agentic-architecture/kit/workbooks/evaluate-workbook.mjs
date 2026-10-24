#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

export function evaluateWorkbook(workbookPath = join(here, "threat-and-cost-workbook.json")) {
  const data = JSON.parse(readFileSync(workbookPath, "utf8"))
  if (data.schema !== "agentic-architecture-threat-and-cost-workbook/v1") {
    throw new Error("Invalid workbook schema")
  }
  if (!Array.isArray(data.threats) || data.threats.length !== 10) {
    throw new Error(`Expected 10 threats (T-01..T-10), found ${data.threats?.length ?? 0}`)
  }

  for (const t of data.threats) {
    if (!t.id || !t.control_id || !t.test_ref) {
      throw new Error(`Threat ${t.id} missing required control or test_ref`)
    }
    if (t.residual_severity >= t.inherent_severity || t.residual_severity > 2) {
      throw new Error(`Threat ${t.id} residual severity (${t.residual_severity}) is not adequately mitigated`)
    }
  }

  const models = data.workloads.map((w) => {
    const attemptTokenCost =
      (w.input_tokens_per_attempt / 1_000_000) * w.input_price_per_million_usd +
      (w.output_tokens_per_attempt / 1_000_000) * w.output_price_per_million_usd +
      w.tool_cost_per_attempt_usd
    const meanComputeCostPerAccepted = attemptTokenCost * w.mean_attempts_per_accepted_run
    const p95ComputeCostPerAccepted = attemptTokenCost * w.p95_attempts_per_accepted_run
    const humanCostPerAccepted = (w.human_review_minutes_per_accepted_run / 60) * w.human_hourly_rate_usd
    const totalMeanCostPerAccepted = Number((meanComputeCostPerAccepted + humanCostPerAccepted).toFixed(4))
    const totalP95CostPerAccepted = Number((p95ComputeCostPerAccepted + humanCostPerAccepted).toFixed(4))
    const monthlyMeanTotalUsd = Number((totalMeanCostPerAccepted * w.monthly_accepted_runs).toFixed(2))
    const monthlyP95TotalUsd = Number((totalP95CostPerAccepted * w.monthly_accepted_runs).toFixed(2))
    const softStopUsd = Number((w.max_run_budget_usd * 0.7).toFixed(2))
    const hardStopUsd = Number((w.max_run_budget_usd * 0.8).toFixed(2))

    if (p95ComputeCostPerAccepted > hardStopUsd) {
      throw new Error(`Workload ${w.id} p95 compute cost (${p95ComputeCostPerAccepted}) exceeds 80% hardStopUsd (${hardStopUsd})`)
    }

    return {
      id: w.id,
      meanComputeUsd: Number(meanComputeCostPerAccepted.toFixed(4)),
      p95ComputeUsd: Number(p95ComputeCostPerAccepted.toFixed(4)),
      totalMeanCostPerAcceptedUsd: totalMeanCostPerAccepted,
      monthlyMeanTotalUsd,
      monthlyP95TotalUsd,
      softStopUsd,
      hardStopUsd,
    }
  })

  return {
    ok: true,
    threatsVerified: data.threats.length,
    maxResidualSeverity: Math.max(...data.threats.map((t) => t.residual_severity)),
    workloads: models,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(evaluateWorkbook(), null, 2))
}
