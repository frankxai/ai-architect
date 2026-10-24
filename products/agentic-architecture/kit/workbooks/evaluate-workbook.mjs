#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

export const DEFAULT_MODEL_PRICING_USD_PER_M = {
  "claude-haiku-5-5": { input: 0.10, output: 0.50 },
  "claude-sonnet-5-5": { input: 2.00, output: 10.00 },
  "claude-opus-5-5": { input: 4.00, output: 20.00 },
  "claude-fable-5-1": { input: 10.00, output: 50.00 },
  "gpt-6-luna": { input: 0.10, output: 0.50 },
  "gpt-6.1-sol": { input: 2.00, output: 10.00 },
  "gpt-6-astra": { input: 10.00, output: 50.00 },
  "grok-4.7": { input: 2.00, output: 6.00 },
}

/**
 * Ingest an array of OpenTelemetry GenAI span objects (from Langfuse, Arize, or OTel collector JSON)
 * and compute measured all-attempts cost per accepted run.
 */
export function ingestOtelTraceSpans(spans, pricingTable = DEFAULT_MODEL_PRICING_USD_PER_M) {
  if (!Array.isArray(spans) || spans.length === 0) {
    throw new Error("spans must be a non-empty array of OpenTelemetry GenAI span records")
  }
  let totalComputeCostUsd = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const runs = new Map()

  for (const span of spans) {
    const attrs = span.attributes ?? {}
    const model = attrs["gen_ai.request.model"]
    const rates = pricingTable[model]
    if (!rates) {
      throw new Error(`Unknown model in OTel span: ${model}`)
    }
    const inTok = Number(attrs["gen_ai.usage.input_tokens"] ?? 0)
    const outTok = Number(attrs["gen_ai.usage.output_tokens"] ?? 0)
    const toolCost = Number(attrs["tool.cost_usd"] ?? 0)
    const spanCost = (inTok / 1_000_000) * rates.input + (outTok / 1_000_000) * rates.output + toolCost

    totalComputeCostUsd += spanCost
    totalInputTokens += inTok
    totalOutputTokens += outTok

    const runId = span.runId ?? span.traceId
    const prev = runs.get(runId) ?? { attempts: 0, accepted: false, costUsd: 0 }
    prev.attempts += 1
    if (span.accepted === true) prev.accepted = true
    prev.costUsd += spanCost
    runs.set(runId, prev)
  }

  const acceptedRuns = [...runs.values()].filter((r) => r.accepted).length
  if (acceptedRuns === 0) {
    throw new Error("Zero accepted runs in OTel span batch; cost per accepted outcome is infinite")
  }

  return {
    totalSpans: spans.length,
    distinctRuns: runs.size,
    acceptedRuns,
    meanAttemptsPerRun: Number((spans.length / runs.size).toFixed(2)),
    totalInputTokens,
    totalOutputTokens,
    totalComputeCostUsd: Number(totalComputeCostUsd.toFixed(4)),
    costPerAcceptedRunUsd: Number((totalComputeCostUsd / acceptedRuns).toFixed(4)),
  }
}

export function evaluateWorkbook(workbookPath = join(here, "threat-and-cost-workbook.json")) {
  const data = JSON.parse(readFileSync(workbookPath, "utf8"))
  if (data.schema !== "agentic-architecture-threat-and-cost-workbook/v2") {
    throw new Error("Invalid workbook schema; expected v2")
  }
  if (!Array.isArray(data.threats) || data.threats.length !== 10) {
    throw new Error(`Expected 10 threats (T-01..T-10), found ${data.threats?.length ?? 0}`)
  }

  for (const t of data.threats) {
    if (!t.id || !t.control_id || !t.control_module || !t.verification_error_code) {
      throw new Error(`Threat ${t.id} missing required control_module or verification_error_code`)
    }
    if ("residual_severity" in t) {
      throw new Error(`Threat ${t.id} contains self-scored residual_severity; bind to verification_error_code instead`)
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
      modelId: w.model_id,
      meanComputeUsd: Number(meanComputeCostPerAccepted.toFixed(4)),
      p95ComputeUsd: Number(p95ComputeCostPerAccepted.toFixed(4)),
      totalMeanCostPerAcceptedUsd: totalMeanCostPerAccepted,
      monthlyMeanTotalUsd,
      monthlyP95TotalUsd,
      softStopUsd,
      hardStopUsd,
    }
  })

  const sampleSpans = JSON.parse(readFileSync(join(dirname(workbookPath), "sample-otel-spans.json"), "utf8"))
  const otelSummary = ingestOtelTraceSpans(sampleSpans)

  return {
    ok: true,
    threatsBoundToTests: data.threats.length,
    workloads: models,
    otelTraceIngestion: otelSummary,
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(evaluateWorkbook(), null, 2))
}
