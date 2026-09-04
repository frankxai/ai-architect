# 08. Evaluation plane: prove the outcome and the path

An agent can produce a polished answer, call the wrong tool, mutate the wrong record, and still look successful in a transcript.

The evaluation plane closes that gap. It defines a task, runs one or more trials in a controlled environment, records the path, checks the end state, and decides whether a change may ship.

## Start with the end state

Write the required state before writing the prompt. For a refund task, success might mean:

- the correct customer and invoice were selected;
- policy version 18 allowed the amount;
- one refund record exists for EUR 42;
- the customer received a confirmation;
- no secret or internal policy text entered the response.

The agent's final sentence is evidence of what it said. The database, external API, file tree, or user-visible artifact is evidence of what happened. Anthropic distinguishes a transcript from an outcome for this reason. [S15](../research/sources.yaml)

## Grade four dimensions

A release bank should grade outcome, path, safety, and economics.

### Outcome

Did the intended business and user state exist at the end? Prefer deterministic assertions when the state can be queried. Use a model rubric for open writing quality only after a human has calibrated the rubric on real examples.

### Path

Did the run use allowed sources, models, tools, routes, scopes, and approvals? Trace grading can expose a wrong tool choice or misplaced handoff even when the final answer is acceptable. OpenAI recommends traces during behavioral debugging, then datasets and repeated eval runs when a team needs comparison over time. [S14](../research/sources.yaml)

### Safety

Did forbidden states remain absent? Include injection, exfiltration, privilege escalation, cross-tenant access, dangerous code, duplicate side effects, stale policy, denied action, and refusal cases. A safety gate is binary when the consequence demands it.

### Economics

Did the run finish inside its time, token, tool, retry, review, and correction budget? Record cost per verified success, not cost per model call.

## Use mixed graders

Agent behavior has both crisp and subjective parts. Anthropic groups graders into code-based checks, model-based rubrics, and human judgment. Code checks are fast and repeatable; model rubrics handle open outputs but need human calibration; humans catch subtle task and source failures. [S15](../research/sources.yaml)

A sensible order is:

1. deterministic end-state checks;
2. schema, static, and policy checks;
3. trace assertions for tools, routes, and budgets;
4. a calibrated rubric for qualities that code cannot judge;
5. human review for high-impact cases and grader drift.

Do not ask a model grader to judge facts it cannot see. Supply the source, expected state, rubric, and permitted variation. Record the grader model and version because the grader can drift too.

## Run trials, not anecdotes

Model output varies. Repeat each stochastic case enough times to reveal a distribution. Track pass rate, not one pass. A high-impact binary gate may require every trial to pass. A capability measure may accept a lower initial rate while the team improves it.

Separate two banks:

- **capability cases** are hard cases that reveal the current frontier;
- **regression cases** protect behavior the system already claims to handle.

Anthropic recommends that capability cases begin hard enough to create room for progress, while regression cases stay near a full pass rate. Cases can graduate from one bank to the other. [S15](../research/sources.yaml)

## Shape the bank like production

OpenAI recommends task-specific evals, production-shaped data, early logging, automated scoring where possible, and continued human calibration. [S13](../research/sources.yaml)

Sample by risk and frequency. Common tasks protect the core service. Rare costly failures deserve their own cases. Include languages, tenant types, data sizes, tool failures, policy versions, and human interruption patterns found in real traffic.

Mine incidents and corrections. Every material production failure should become a frozen case after secrets are removed. The case needs the triggering input, starting state, expected state, forbidden state, source fixtures, and the first release that fixed it.

## Avoid eval theater

Weak programs share recognizable habits:

- the bank contains clean examples written by the prompt author;
- every case is run once;
- a model grades its own output without a reference state;
- the score blends safety failure with writing quality;
- no one measures human correction;
- the dataset never changes after launch;
- teams compare models while changing prompts, tools, and data at the same time.

Change one controlled surface or record the experiment as a system comparison. Freeze the task bank and environment for the decision.

## Release verdict

A release verdict includes model and adapter versions, prompt and policy versions, tool contracts, dataset commit, grader versions, trial count, pass thresholds, observed distribution, cost, known gaps, and approver.

The lab scorecard turns those fields into a reusable artifact. A green release means the system passed named cases under named conditions. It never means the agent is generally safe or intelligent.
