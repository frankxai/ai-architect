import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

// Illustrative capability-tier reference rates (USD per 1M tokens) for deterministic offline fixture evaluation.
// Model names and vendor list prices change frequently; pass your organization's live vendor pricing table
// (checked against official vendor pricing docs) into ingestOtelTraceSpans(spans, customPricingTable).
export const ILLUSTRATIVE_TIER_PRICING_USD_PER_M = {
  "tier-a-fast-classifier": { input: 0.25, output: 1.25, note: "example only — check current pricing" },
  "tier-b-balanced-builder": { input: 3.00, output: 15.00, note: "example only — check current pricing" },
  "tier-c-frontier-reasoner": { input: 5.00, output: 25.00, note: "example only — check current pricing" },
}

export function ingestOtelTraceSpans(spans, pricingTable = ILLUSTRATIVE_TIER_PRICING_USD_PER_M) {
  if (!Array.isArray(spans) || spans.length === 0) {
    throw new Error("ingestOtelTraceSpans requires a non-empty array of OpenTelemetry GenAI spans")
  }
  const runs = new Map()
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalComputeCostUsd = 0

  for (const span of spans) {
    const runId = span.runId || span.traceId
    if (!runId) throw new Error("Each OTel span must include runId or traceId")
    const attrs = span.attributes || {}
    const model = attrs["gen_ai.request.model"]
    const rates = pricingTable[model]
    if (!rates) {
      throw new Error(`Unknown model or capability tier "${model}" in OTel span ${span.spanId || runId}; supply current vendor rates in pricingTable`)
    }
    const inTokens = Number(attrs["gen_ai.usage.input_tokens"] ?? 0)
    const outTokens = Number(attrs["gen_ai.usage.output_tokens"] ?? 0)
    const toolCost = Number(attrs["tool.cost_usd"] ?? 0)
    const spanCost = (inTokens / 1_000_000) * rates.input + (outTokens / 1_000_000) * rates.output + toolCost

    totalInputTokens += inTokens
    totalOutputTokens += outTokens
    totalComputeCostUsd += spanCost

    const prev = runs.get(runId) ?? { attempts: 0, accepted: false, costUsd: 0 }
    prev.attempts += 1
    if (span.accepted === true || attrs["run.accepted"] === true) prev.accepted = true
    prev.costUsd += spanCost
    runs.set(runId, prev)
  }

  const acceptedRuns = [...runs.values()].filter((r) => r.accepted).length
  if (acceptedRuns === 0) {
    throw new Error("Zero accepted runs in OTel trace batch; cannot compute finite cost per accepted outcome")
  }
  const totalAttempts = [...runs.values()].reduce((acc, r) => acc + r.attempts, 0)

  return {
    totalSpans: spans.length,
    distinctRuns: runs.size,
    acceptedRuns,
    meanAttemptsPerRun: Number((totalAttempts / runs.size).toFixed(2)),
    totalInputTokens,
    totalOutputTokens,
    totalComputeCostUsd: Number(totalComputeCostUsd.toFixed(4)),
    costPerAcceptedRunUsd: Number((totalComputeCostUsd / acceptedRuns).toFixed(4)),
  }
}

export function evaluateWorkbook(workbookPath) {
  const raw = JSON.parse(readFileSync(workbookPath, "utf8"))
  if (!Array.isArray(raw.threats) || raw.threats.length < 10) {
    throw new Error(`Expected >= 10 threats, found ${raw.threats?.length ?? 0}`)
  }

  for (const t of raw.threats) {
    if ("residual_severity" in t) {
      throw new Error(`Threat ${t.id} contains self-scored residual_severity; bind to control_module + verification_error_code instead`)
    }
    if (!t.control_module || !t.verification_error_code) {
      throw new Error(`Threat ${t.id} missing control_module, verification_error_code, or adr`)
    }
  }

  if (!Array.isArray(raw.workloads) || raw.workloads.length < 3) {
    throw new Error(`Expected >= 3 workloads, found ${raw.workloads?.length ?? 0}`)
  }

  const workloadSummaries = raw.workloads.map((w) => {
    const attemptTokenCost =
      (w.input_tokens_per_attempt / 1_000_000) * w.illustrative_input_price_per_million_usd +
      (w.output_tokens_per_attempt / 1_000_000) * w.illustrative_output_price_per_million_usd +
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
      name: w.name,
      capabilityTier: w.capability_tier,
      meanComputeUsd: Number(meanComputeCostPerAccepted.toFixed(4)),
      p95ComputeUsd: Number(p95ComputeCostPerAccepted.toFixed(4)),
      totalMeanCostPerAcceptedUsd: totalMeanCostPerAccepted,
      monthlyMeanTotalUsd,
      monthlyP95TotalUsd,
      softStopUsd,
      hardStopUsd,
    }
  })

  const spansPath = join(dirname(workbookPath), "sample-otel-spans.json")
  const otelTraceIngestion = ingestOtelTraceSpans(JSON.parse(readFileSync(spansPath, "utf8")))
  return {
    threatsBoundToTests: raw.threats.length,
    workloads: workloadSummaries,
    otelTraceIngestion,
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const wbTarget = resolve(process.argv[2] || "products/agentic-architecture/kit/workbooks/threat-and-cost-workbook.json")
  const spansTarget = resolve(process.argv[3] || "products/agentic-architecture/kit/workbooks/sample-otel-spans.json")
  const wbSummary = evaluateWorkbook(wbTarget)
  const sampleSpans = JSON.parse(readFileSync(spansTarget, "utf8"))
  const otelSummary = ingestOtelTraceSpans(sampleSpans)
  console.log(JSON.stringify({ ...wbSummary, otelTraceIngestion: otelSummary }, null, 2))
}
