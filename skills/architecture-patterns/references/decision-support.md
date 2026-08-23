# Decision support

## Problem it fits

A human is about to make a decision — approve, deny, price, staff, prioritize
— and needs a recommendation plus the rationale behind it, while keeping the
authority to accept or override it. The system's job is to assemble the
evidence, produce a recommendation, and explain it well enough that the human
can actually scrutinize it rather than rubber-stamp it. The failure that
defines this shape is not a wrong recommendation from a bad model — it is a
recommendation presented as more certain than the evidence supports, or a
rationale generated to justify a score rather than to explain it, so the
human's oversight becomes theater.

This shape is not retrieval-grounded-answering: the output carries an
explicit recommendation, not just a cited answer. It is not
process-monitoring: it responds to a request for a decision, it does not
watch a stream. The authority boundary is the shape's defining feature — the
moment that boundary quietly moves (the system's recommendation gets applied
without a human looking at it), the system has become something else and
needs a new frame.

## The seven planes for this shape

| plane | owns | boundary for this shape |
|---|---|---|
| `experience` | streaming partial work; letting a human interrupt or approve | the rationale and its uncertainty are the deliverable, not a footnote — the override control must be as visible and as easy to use as the recommendation itself |
| `observability` | every model call, tool call and token as one traceable run | every recommendation is one traceable run of evidence gathered, score computed, and explanation generated — the trace someone reads when an override needs explaining, and the place drift in the underlying policy first becomes visible if anyone is watching for it |
| `evaluation` | deciding a change helped, before users do | graded against a human baseline decision-maker and tracked by override rate over time, not by a single case's correctness alone; a rising override rate is a signal the scoring policy itself may need recalibration |
| `orchestration` | the shape: workflow, one loop, or many | usually a fixed pipeline — gather evidence, score, explain — a loop only earns its keep when the system explores multiple scenarios before recommending one, which may push a scenario-heavy decision into an async job pattern instead of a single request |
| `tools` | capability with schemas, scopes, an audit trail | the line-of-business system holding the case data, and the system of record where the eventual decision gets applied, are both tool surfaces here — access to case data is scoped to what the reviewer is cleared to see |
| `context` | the right tokens in the window, the rest out | the evidence assembled behind the recommendation — case data, policy documents, comparable prior cases — decides what the explanation can actually be traced back to |
| `model` | reaching a model; surviving it being slow, wrong, or gone | often paired with a separate scoring or simulation engine producing the quantitative signal; the model's own job is turning that signal into an explanation a human can audit, not generating the score itself |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `MADE` | generation is bounded to explanation of an existing score, so one seam usually covers it | grep for provider SDK imports; confirm the scoring engine (if separate) is not itself a second, unmanaged model call |
| `loop` (orchestration shape) | tends `MADE` as fixed pipeline | evidence gathering, scoring, and explanation are enumerable steps | find the exit condition; a fixed pipeline has none because it is not a loop — if scenario exploration exists, find what bounds how many scenarios it runs |
| `trust` (trust boundary) | tends `OPEN` | the recommendation influences a real action, and whether that action executes automatically or waits on the human is rarely nailed down early | trace the recommendation from output to the point it either reaches a human's screen or triggers a downstream system directly |
| `run` (long-run home) | tends `MADE` | decisions are computed per case, not continuously, unless the system sits inside a longer-running workflow engine that owns the case across its lifecycle | confirm the decision computation is triggered per request, not a background process holding case state between requests |

## Discovery questions

1. Who has authority to accept or override this recommendation today, and
   does that authority change once the system exists?
   Purpose: sets the decision boundary for `SYSTEM.md`; a system whose
   recommendation gets auto-applied is decision-support in name only and
   needs a different trust verdict.
2. What evidence does the human currently use to make this decision, and
   where does it live?
   Purpose: feeds retrieval scope and access control for the evidence
   plane.
3. What is the cost of a false positive recommendation versus a false
   negative?
   Purpose: sets the confidence threshold and whether the system should
   defer to a human more or less readily.
4. Does an override get recorded, and does anything downstream use that
   record?
   Purpose: determines whether there is a feedback loop feeding future
   recommendations, which changes who owns the evaluation plane.
5. What decision options are people currently choosing from — a fixed menu
   of outcomes or something open-ended?
   Purpose: determines whether the output is a bounded classification or a
   free-form recommendation, which changes the evaluation design.
6. How is confidence or uncertainty communicated today, if at all?
   Purpose: sets what the experience plane has to render so uncertainty is
   visible, not implied by a confident tone.
7. Is there a regulatory or compliance requirement to explain the
   recommendation, such as an adverse-action notice?
   Purpose: sets the required depth of the rationale and feeds the audit
   trail in `05-trust-boundary.md`.
8. What happens when the recommendation is wrong and someone already acted
   on it?
   Purpose: names the incident and rollback path for `07-runbook.md`.
9. How many decisions of this kind are made per day or week, and is the
   goal to speed them up, scale their volume, or improve their quality?
   Purpose: sets the baseline `04-roi.md` compares against.
10. Does the recommendation depend on a separate quantitative model —
    scoring, simulation, optimization — distinct from the language model?
    Purpose: identifies a second component on the model plane with its own
    evaluation needs, separate from the explanation layer.
11. Who is accountable if a biased or unfair recommendation is issued
    repeatedly?
    Purpose: names an owner for fairness monitoring on the evaluation
    plane.
12. Is the decision made once per case, or does it need to be revisited as
    new evidence arrives later?
    Purpose: distinguishes a single-shot recommendation from a longer-running
    case that needs to be re-evaluated, which changes the `run` decision.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| evidence retrieval pipeline | pulls case data, policy documents, and comparable prior cases into context | the recommendation is only as good as the evidence assembled behind it |
| scoring or simulation engine | produces the quantitative signal — a score, a projected outcome — behind the recommendation | separates the deterministic or statistical judgment from the language model's explanation job |
| model gateway | the single seam a request passes through to reach a language model for the explanation | keeps `model` a `MADE` decision as usage grows past one call site |
| explanation renderer | turns the score and the retrieved evidence into a rationale a reviewer can actually audit | the experience-plane requirement that the rationale be traceable, not generated to fit the score |
| decision journal | records the case input, recommendation, rationale, and eventual human decision for every case | the audit trail this shape's oversight claim depends on |
| override and feedback capture | records what the human decided when it differs from the recommendation | the signal that reveals whether oversight is real or has quietly become rubber-stamping |
| access control layer | governs who can see the case data and policy sources feeding the recommendation | prevents the evidence pipeline from surfacing data the reviewer is not cleared to see |
| evaluation harness | grades recommendation accuracy against a baseline, calibration of confidence, and rationale traceability | the evaluation-plane requirement that all three be checked, not just the final recommendation |
| observability trace store | records what evidence and score fed each recommendation as one traceable run | lets someone debug a wrong recommendation by seeing exactly what the system saw |

## Failure modes

- The rationale is generated after the score, so it justifies whatever the
  score produced instead of reflecting the actual evidence — a reviewer
  auditing the rationale cannot find where it would have caught an error.
- Confidence is presented as a single clean number when the underlying
  evidence is thin, and reviewers stop scrutinizing high-confidence
  recommendations even when the confidence itself is miscalibrated.
- Override rate drifts toward zero not because recommendations improved but
  because reviewers rubber-stamp under time pressure — an authority transfer
  nobody decided on and nobody is tracking.
- The decision journal captures the recommendation but not what the human
  actually saw at decision time, so a later audit cannot reconstruct why an
  override happened.
- The system recommends against a fixed menu of outcomes that no longer
  matches current policy, because nobody updated the menu after the policy
  changed.
- Override feedback is collected but never reviewed, so a systematic bias in
  the recommendation persists uncorrected.

## Eval cases to include

- Golden cases with a known-correct recommendation and rationale, spanning
  the full decision menu named in discovery question 5.
- At least one calibration case: a low-evidence input should produce lower
  confidence, not a confidently wrong recommendation.
- At least one refusal or defer case where the correct behavior is
  "insufficient evidence, escalate to a human" rather than issuing a
  recommendation.
- At least one injection case: a piece of submitted evidence crafted to
  contain an instruction rather than information, checking the
  recommendation is driven by the evidence's content, not any embedded
  command.
- A fairness or consistency case: the same facts with a protected attribute
  changed should not change the recommendation, where that attribute is
  legally protected.
- A traceability case: every claim in the rendered rationale must map to
  evidence actually retrieved, checked against a case with irrelevant
  evidence mixed into the context.
