# Process monitoring

## Problem it fits

The system watches a stream of events over time — transactions, logs,
metrics, sensor readings — and raises an alert or triggers a workflow when
something drifts from normal. There is no single request that starts the
work; the system is either always running or running on a schedule, and its
job is to notice when the present stops resembling the past. The failure
that defines this shape is not one bad classification — it is noise (a
threshold so sensitive that real signal gets lost in alert fatigue) or
silence (drift that never crosses a static threshold because the threshold
itself went stale).

This shape is not conversational-service: there is no human turn-taking, the
system acts on its own schedule. It is not decision-support: monitoring
triggers on the stream's own timing, not on a human's request for a
recommendation.

## The seven planes for this shape

| plane | boundary for this shape |
|---|---|
| `experience` | almost no experience plane most of the time — nobody is watching; it becomes fully active only at alert time, when the alert itself is the entire interface |
| `intelligence` | anomaly or drift detection against a baseline, not per-item classification; the center of gravity is defining and keeping the baseline current |
| `orchestration` | a continuous or scheduled evaluation loop over incoming events, not request-triggered; the cadence — real-time streaming versus periodic batch — is itself a design decision |
| `runtime` | a long-running or scheduled process, not request/response — it needs a durable home that survives restarts without losing its position in the stream |
| `integration` | the event source or sources being watched, and the alerting or workflow-trigger destination |
| `reliability` | graded on detection precision and recall against known incidents, and on time-to-detect, not on a single output's correctness |
| `operations` | baseline recalibration and threshold tuning are ongoing work, not one-time setup — a static threshold decays as the underlying process shifts |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `OPEN` | depends heavily on whether detection is statistical, rule-based, a trained model, or an LLM reasoning over summarized events — often more than one seam exists at once | list every place a detection decision is made and check whether each one goes through a single, identifiable seam |
| `loop` (orchestration shape) | tends `MADE` as a scheduled or streaming evaluation loop | the evaluation cadence is usually explicit, but the exit condition — what counts as "caught up" — needs to be as explicit as the cadence | find what happens when the loop falls behind the stream; a loop with no catch-up behavior silently drops evaluation coverage |
| `trust` (trust boundary) | tends `MADE` | the event stream is usually internal, known-format telemetry rather than open user input | check whether any event field carries free text from an external or untrusted party — that reopens the boundary even for an otherwise internal stream |
| `run` (long-run home) | tends `OPEN` | this is the shape most likely to need a genuinely durable, always-on runtime; a request/response service cannot watch a stream between requests | confirm the evaluation process has a durable home, not a scheduled job that silently stops running after a deploy |

## Discovery questions

1. What event stream is being watched, and what is its normal, baseline
   behavior?
   Purpose: without an explicit baseline, "drift" has no reference point and
   the system will alert on noise or miss real drift.
2. What should trigger an alert or workflow, and how is that different from
   normal variation?
   Purpose: sets the detection threshold and guards against the shape's
   defining failure of alert fatigue from an oversensitive threshold.
3. Who receives the alert, and what are they expected to do with it?
   Purpose: names the human step and escalation path; an alert with no
   defined recipient action is noise by definition.
4. How often does the baseline itself change for legitimate reasons —
   seasonality, growth, a planned change?
   Purpose: sets the recalibration cadence on the operations plane; a stale
   baseline is the shape's most common silent failure.
5. What is the acceptable time-to-detect, and does it differ by severity?
   Purpose: determines whether the loop runs as real-time streaming or
   periodic batch evaluation.
6. What happens today when this kind of drift occurs — is it caught, and how
   long does that take?
   Purpose: baseline for `04-roi.md` and a source of realistic eval cases.
7. What is the cost of a false alert versus a missed one?
   Purpose: sets the precision-recall tradeoff the detection method should
   be tuned toward.
8. Does the event stream ever go silent or delayed for a legitimate reason —
   maintenance, a holiday, an upstream outage?
   Purpose: distinguishes "no data" from "no drift"; a naive system either
   alerts on data gaps as if they were drift, or worse, reads silence as
   "all clear."
9. Should the system only alert, or should it also trigger an automated
   workflow — a rollback, a scaling action, a ticket?
   Purpose: determines whether the trust and run decisions extend beyond
   detection into an irreversible automated action.
10. What is the volume and velocity of the event stream?
    Purpose: sets the runtime and integration requirements — a low-volume
    periodic stream and a high-velocity real-time stream need materially
    different infrastructure.
11. Are events ever tagged or annotated after the fact by a person —
    confirmed incident, false alarm?
    Purpose: identifies a feedback source for recalibrating the baseline and
    for building eval cases.
12. Does any event field carry free text or content originating outside the
    organization?
    Purpose: feeds the trust boundary — most monitoring streams are internal
    telemetry, but a stream that includes user-submitted or third-party
    text reopens the injection question.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| event ingestion pipeline | collects the stream from its source(s) into a form the detection layer can evaluate | the entry point everything else depends on being complete and timely |
| baseline state store | holds the current definition of "normal" that new events are compared against | the reference point without which "drift" cannot be defined |
| detection engine | statistical, rule-based, trained-model, or LLM-based method that flags drift or anomalies | the intelligence-plane center of gravity for this shape |
| alerting and notification router | delivers a triggered alert to the right recipient through the right channel | closes the loop named in discovery question 3 — an alert nobody sees is not an alert |
| workflow trigger connector | fires an automated downstream action when monitoring is wired to more than alerting | the mechanism behind discovery question 9 when the answer is "yes, also act" |
| durable always-on runtime | keeps the evaluation loop running and tracks stream position across restarts | the `run` decision's answer for a shape that has to watch continuously |
| recalibration job | periodically or event-triggered process that updates the baseline as the underlying process shifts | prevents the shape's most common silent failure — a stale baseline |
| evaluation harness | measures precision and recall against a labeled set of known incidents, plus time-to-detect | the reliability-plane requirement that detection quality be measured, not assumed |
| observability trace store | records what the baseline was and what triggered each alert | supports post-incident review and recalibration decisions |

## Failure modes

- The baseline is set once at launch and never recalibrated, so legitimate
  drift trips false alerts until someone manually loosens the threshold — or
  loosens it so far that real drift stops triggering anything.
- Alert fatigue: thresholds are tuned sensitive enough to catch everything,
  recipients start ignoring the channel, and a real incident goes unactioned
  inside the noise.
- The event stream goes silent because of an upstream outage, and the
  system reports "no drift detected" instead of "no data received" —
  silence is read as a clean signal.
- The detection loop crashes or restarts and loses its position in the
  stream, silently skipping the events that occurred during the gap.
- An automated workflow trigger fires on a false positive and takes an
  action with real consequences, because the trust decision between
  detection and automated action was never made explicit.
- A recalibration job absorbs an actual incident into the new baseline
  because it ran during the incident window, and the system stops detecting
  a drift it has already learned to call normal.

## Eval cases to include

- Golden cases replaying known historical incidents, checking the system
  detects them within the target time-to-detect.
- At least one false-positive case — a legitimate variation that should not
  trigger an alert — testing that the threshold is not oversensitive.
- At least one silence or gap case, where the stream stops delivering
  events, checking the system distinguishes "no data" from "no drift."
- A case testing baseline recalibration timing, verifying an actual incident
  inside a recalibration window is not absorbed as the new normal.
- A case testing the automated-workflow trigger path, where wired, checking
  a low-confidence detection does not fire an irreversible action without
  the human step named in discovery question 3.
