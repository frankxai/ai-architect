# 11. Economics: price verified work

AI cost is a systems property.

A token invoice measures model use. It misses retrieval, vector or search services, tool APIs, workflow infrastructure, evaluator calls, retries, human review, correction, incidents, and idle capacity. It also ignores whether the task produced a useful end state.

The primary unit is cost per verified successful task.

## Build the unit model

Use:

`unit cost = (model + context + tools + orchestration + evaluation + infrastructure + human work + failure recovery) / verified outcomes`

Break the numerator into prices and quantities. Record the source and date for every external price. Model at least low, expected, and high cases for:

- input and output tokens;
- turns or model calls;
- tool calls;
- retry rate;
- successful outcome rate;
- human review minutes;
- correction minutes;
- concurrency and wait time.

The tail matters. Ten cheap runs and one unbounded loop can make the average look acceptable until volume grows. Track p50, p95, and maximum cost by task class.

## Put value beside cost

A system earns the right to run when verified task value exceeds total task cost by the required margin.

Value may come from time saved, error reduction, faster revenue, better conversion, risk avoided, or work that could not be done before. Name the owner of the value claim. State whether the number is observed, estimated, or assumed.

Do not hide human work. If an agent saves eight minutes of drafting and adds twelve minutes of review, it shifted work and made it more expensive. If the review also catches errors that used to reach customers, the risk reduction may still make the system valuable. Put both effects in the model.

## Autonomy has a coordination tax

Multi-agent systems can add breadth and parallel capacity, but they spend more tokens and create coordination work. Anthropic reports roughly four times chat token use for agents and fifteen times for its multi-agent research system in its own workload. It argues that the task value must justify the added cost. [S21](../research/sources.yaml)

Use that figure as a warning, not a universal multiplier. Measure your system. Compare the chosen loop to the next simpler loop on verified outcomes, latency, total cost, and human correction.

A new agent should have a budget and a reason:

- independent work that can run in parallel;
- a focused context that improves a measured outcome;
- a distinct trust or ownership boundary;
- a separate verifier role that prevents self-review.

If the only reason is “specialization,” try a function, prompt section, or code stage first.

## Control spend in the runtime

Set budgets by task class:

| Budget | Runtime action at limit |
|---|---|
| token | summarize, switch route, or stop |
| tool calls | stop and expose unresolved work |
| wall time | checkpoint and continue asynchronously or stop |
| retry | reconcile, escalate, or fail |
| concurrency | queue or reject lower-value work |
| money | require policy step-up or human approval |

The model may choose how to spend inside the envelope. A budget increase belongs to policy.

## Include capacity and queueing

A model can meet its median latency and still fail the service at peak load. Model arrival rate, concurrency limits, provider quotas, tool bottlenecks, approval wait time, and durable-worker capacity.

Separate active compute from paused work. A run waiting two days for approval should not hold a web request or a scarce worker. Store state, release compute, and resume on an event.

Plan provider failure. Decide which task classes can use a fallback model, which must wait, and which should stop because the fallback lacks a required capability or data agreement.

## Make quality and cost one decision

A cheap route that misses the quality floor is waste. A costly route that adds no verified value is also waste. Use a frontier table by task class: pass rate, serious-failure rate, p95 latency, cost per success, and correction minutes.

Do not collapse that table into one weighted score for high-impact work. A safety failure can block a route even when every other number improves.

## Release evidence

The economics owner should provide sourced prices, quantities from traces, sensitivity bands, value assumptions, cost per verified outcome, failure cost, correction time, peak-capacity assumptions, budget rules, and the chosen route's margin over the next simpler design.

The model bill is easy to count. The architecture earns authority by counting the work that the bill leaves out.
