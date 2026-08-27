# Regulatory checking

## Problem it fits

A piece of work — a filing, a transaction, a document, a piece of code — has
to be checked against a body of external rules the system did not write, and
the output is a pass, fail, or flag, plus an audit trail of the check. The
failure that defines this shape is not a wrong check in isolation — it is a
check that cannot show its work: a flag with no traceable citation back to
the specific rule and the specific evidence, or a rule silently checked in a
version that no longer matches the actual regulation.

This shape is not decision-support: there is no recommendation for a human
to accept or override, the output is closer to a verdict against a fixed
external standard. It is not retrieval-grounded-answering: the "corpus" here
is a rule set the system is bound to apply, not a knowledge base it answers
open questions from.

## The seven planes for this shape

| plane | boundary for this shape |
|---|---|
| `experience` | the audit trail is as much the deliverable as the verdict — a reviewer must be able to trace every flag back to the specific rule and the specific evidence in the checked work |
| `intelligence` | rule interpretation plus evidence matching against the work being checked; the model applies an external rule set, it does not exercise independent judgment about what is compliant |
| `orchestration` | usually a fixed pipeline run once per applicable rule — retrieve the rule, match evidence, render verdict — across every rule that applies to the item |
| `runtime` | request/response for a single check; batch or queue when checking runs at volume, such as every filing or every transaction, rather than one-off review |
| `integration` | the rule source, which must stay current, and the system holding the work being checked |
| `reliability` | graded per rule, not per document — an item can pass nine of ten applicable rules and the system must not report it as compliant |
| `operations` | rule-set currency is the central operational property; a regulation changes and the system keeps checking against the old version until someone updates the source |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `MADE` | rule interpretation and evidence matching per rule usually route through one narrow seam | grep for provider SDK imports; confirm rule-applicability logic and evidence-matching logic share the same seam or are each individually owned |
| `loop` (orchestration shape) | tends `MADE` as a fixed pipeline run once per applicable rule | the steps are enumerable per rule | check whether a genuinely ambiguous rule triggers an escalation loop to a human interpreter, and whether that loop is explicitly bounded |
| `trust` (trust boundary) | tends `OPEN` | the rule text and the checked work are two separate trust domains, and the system must not let the checked work's content alter how a rule is interpreted | trace whether the checked work's own language (an argument for its own compliance) can influence the rule-interpretation prompt |
| `run` (long-run home) | tends `MADE` for one-off checks, `OPEN` when checking runs continuously against every new item entering a pipeline | a continuously running check starts to resemble process-monitoring; confirm which pattern the actual deployment matches | check whether the check is triggered per item on demand or runs as a standing process watching for new items |

## Discovery questions

1. What is the authoritative source for the rules being checked against, and
   who owns keeping it current?
   Purpose: names the operations owner for rule-set currency, this shape's
   most common silent failure.
2. What is the unit being checked — a document, a transaction, a piece of
   code, a process — and how is it delimited?
   Purpose: sets the scope each rule's evidence-matching step operates over.
3. Does every rule apply to every item, or is applicability itself something
   the system has to determine?
   Purpose: a misjudged applicability step produces either false flags (a
   rule that does not actually apply) or false clean bills (an applicable
   rule that was never checked).
4. What does a "pass" actually certify, and who relies on that
   certification?
   Purpose: sets the audit-trail requirement and names who inherits the
   consequence if a certification turns out wrong.
5. Who reviews a flagged item, and what evidence do they need to make the
   final call?
   Purpose: feeds the human-step requirement in `SOP.md` — this shape rarely
   auto-resolves a flag.
6. How often does the rule set change, and is there an effective-date or
   grace-period structure to track?
   Purpose: a rule change with a future effective date means the system
   needs to know which version applies to which item's date.
7. What is the consequence of a false pass — something wrong gets certified
   compliant — versus a false flag — something fine gets held up?
   Purpose: sets whether the system should be tuned conservative or
   precise, and names who accepts that tradeoff.
8. Can the content being checked contain text designed to influence how a
   rule is applied to it, such as a submission that argues its own
   compliance?
   Purpose: feeds the trust boundary — the checked work is not automatically
   trustworthy just because it is an internal document.
9. Is there an existing manual or legacy automated process doing this check
   today, and what is its known error rate?
   Purpose: baseline for `04-roi.md` and a source of labeled cases for the
   eval suite.
10. What audit-trail format does an external auditor or regulator expect, if
    this check is ever itself audited?
    Purpose: sets the evidence-pointer and citation format the experience
    and reliability planes must produce.
11. Are there rules that require judgment or interpretation rather than a
    mechanical check — a principle versus a bright-line rule?
    Purpose: distinguishes rules the system can check deterministically from
    ones needing explicit human interpretation, which changes both the loop
    and trust decisions.
12. What happens when two applicable rules conflict?
    Purpose: forces an explicit precedence or escalation rule rather than
    letting the system silently pick one interpretation.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| rule source connector | pulls the current rule set from its authoritative source, including effective dates and versioning | the mechanism that prevents the shape's most common silent failure — checking against a stale rule |
| rule applicability engine | determines which rules apply to a given item before checking begins | prevents both false flags from rules that do not apply and false clean bills from rules that were skipped |
| evidence matcher | locates the specific part of the checked work relevant to each applicable rule | the mechanism behind the traceable citation the audit trail requires |
| model gateway | the seam applying rule interpretation and evidence matching per rule | keeps `model` a `MADE` decision as the rule set grows |
| verdict renderer | produces the pass, fail, or flag output with a citation back to both the rule and the evidence | the experience-plane requirement that a verdict be auditable, not asserted |
| audit trail store | durable record of every check, its verdict, and its evidence pointers, in the format an external audit expects | answers discovery question 10 as a system property, not a report generated after the fact |
| human review queue | routes flags and judgment-required rules to a qualified reviewer | the human step named in discovery question 5 |
| rule-set currency monitor | flags when the rule source has changed and prior results may need re-evaluation | the operations-plane owner's tooling for the shape's central risk |
| evaluation harness | measures per-rule accuracy against labeled known-compliant and known-noncompliant cases | the reliability-plane requirement that grading happen per rule, not per document |

## Failure modes

- The rule source updates but the system keeps checking against the cached
  prior version, silently certifying items against an obsolete rule.
- A rule genuinely applies to the item but the applicability engine misses
  it, so the item passes clean while an applicable rule was never actually
  checked.
- The verdict cites a rule but the evidence pointer does not actually
  support the citation — a flag or a pass that cannot survive a human
  re-check.
- The checked work contains text that argues its own compliance, and the
  system's rule interpretation shifts based on that framing instead of
  independently verifying against the rule.
- Two applicable rules conflict and the system silently picks one instead of
  surfacing the conflict, producing a verdict that looks authoritative but
  rests on an undisclosed judgment call.
- A rule requiring genuine interpretation — a principle-based standard —
  gets checked as if it were a bright-line rule, producing false confidence
  in a mechanical pass or fail.

## Eval cases to include

- Golden cases with known-compliant and known-noncompliant items across the
  applicable rule set, each with the correct verdict and evidence pointer.
- At least one case testing rule-set currency — an item checked against a
  rule with a future effective date, verifying the correct version applies.
- At least one injection case: checked content crafted to argue its own
  compliance, verifying the verdict is driven by independent rule
  application, not the content's framing.
- A case testing conflicting applicable rules, checking the system surfaces
  the conflict rather than silently resolving it.
- A case testing a judgment-required, non-bright-line rule, verifying it
  routes to human review rather than receiving a mechanical pass or fail.
