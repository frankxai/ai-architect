# Agency and ownership review

Use this lab alongside the [architecture decision record](architecture-decision-record.md) and [evaluation scorecard](eval-scorecard.md). Allow 60 to 90 minutes for a first review; a real restore test can require a separate session. This is a planning estimate, not a measured completion time.

## Outcome

Produce one decision record that explains who gains useful control, what they own, and how they recover when the AI system fails or becomes unsuitable. Choose one bounded workflow, not an entire business.

Prerequisites: a workflow description, its intended user, an accountable owner, and an inventory of data and tools. Use synthetic data unless you have explicit permission and appropriate controls for real data. No purchases, account creation, public messages, or customer actions are required.

## 1. Define useful freedom

- User and task:
- Current manual baseline:
- Useful outcome, including how the user checks it:
- User choice that must remain possible:
- Non-goal:
- Maximum operating cost and review effort:
- Stop condition:

Avoid objectives such as "be more productive." Prefer "prepare a draft quote from approved facts, with every price checked before a person sends it."

## 2. Connect the four decisions

| Decision | Question to answer | Test to specify |
|---|---|---|
| Provider seam | What breaks if the model changes? | Run the same synthetic cases through a replacement or stub |
| Loop shape | Which actions are suggestions and which execute? | Prove a rejected suggestion causes no external action |
| Trust boundary | Whose authority, data, and accounts are involved? | Attempt an out-of-scope instruction and inspect the result |
| Long-run home | Who owns state and recovers interrupted work? | Resume or cancel after a simulated interruption |

## 3. Complete the ownership inventory

For data, code, prompts, domain, customer relationships, and operating accounts, record:

- owner and administrator;
- license or contractual restriction, with unknowns explicitly marked;
- export format and location;
- restore or migration procedure;
- deletion and retention responsibility;
- support owner and access-revocation path.

Do not equate downloadable files with unrestricted rights. Record missing information as a blocker where it affects the proposed use.

## 4. Test all seven values

For agency, ownership, integrity, creativity, excellence, community, and evolution, write one constraint, one observed result, and one tradeoff. Use the [values table](../strategy/agency-and-ownership.md#values-as-requirements) as the rubric. Mark unrun tests as unrun; a planned test is not evidence.

## 5. Inspect operator load

- Human review minutes per accepted outcome:
- Rework minutes and interruption count:
- Who covers absence or a failed run:
- Maximum weekly commitment chosen by the operator:
- Work that should remain manual:
- What must stop if the commitment is exceeded:

Review effort includes checking failures, not only approving successful drafts. Keep personal wellbeing notes outside shared business evidence. A tool that saves generation time but increases total rework has not yet proved a benefit.

## 6. Run the proof

Record input, expected result, actual result, timestamp, system version, and reviewer for each case:

1. Normal input with a checkable outcome.
2. Missing or contradictory source information.
3. An instruction asking the system to exceed its authority.
4. User cancellation before an external action.
5. An export and restore, or a documented blocked attempt.
6. Failure or interruption followed by recovery.

Use the [worked example](agency-and-ownership-example.md) to understand the format. It is synthetic and contains no successful-run evidence.

## Acceptance and handoff

Before execution, set acceptance thresholds for each case. At minimum: zero unauthorized external actions, zero unsupported facts presented as approved, successful cancellation, and a readable export without the model service. Add risk-specific criteria rather than treating six cases as exhaustive coverage. For cost and time, compare the same inputs and include failures and human checking; report raw observations when the sample is too small to support a general claim.

The record is complete when all fields have an answer or a named blocker, each value has a tradeoff, and each test has a disposition. The workflow is ready for a pilot only when its risk-specific acceptance tests pass, an independent reviewer examines the evidence, and the accountable owner authorizes the scope. Documentation completeness alone never authorizes deployment.

Submit the record, test evidence, outstanding risks, and next reversible action. Keep the result private if permissions or rights are unresolved.

## Independent review brief

Give a different-provider reviewer the workflow record, this lab, and the raw evidence in a fresh context. Ask: Can an intended reader perform the next action without private estate knowledge? Which ownership statement is unsupported? Which failure could pass these tests? Does the result include total operator effort? Require a verdict of pass, revise, or fail, with file references and explicit missing evidence. Record provider, date, reviewed commit, findings, and dispositions. AI critique supplements rather than replaces required human security, rights, and author review.
