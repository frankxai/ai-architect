# Document extraction

## Problem it fits

Unstructured documents — invoices, contracts, forms, scanned mail, emailed
attachments — need to become structured, validated records at volume,
feeding a downstream system that expects clean data. The failure that
defines this shape is not garbled output the way a broken parser fails
loudly; it is a confidently wrong field value that passes schema validation
and looks correct, or a required field silently filled with a guess instead
of being reported as absent. A document graded "processed successfully" can
still contain one wrong field that breaks everything downstream that trusted
it.

This shape is not retrieval-grounded-answering: there is no citation-to-
answer loop, the output is a structured record, not prose with sources. It
is not regulatory-checking: extraction produces data, it does not itself
render a pass/fail verdict, though its output may later feed one.

## The seven planes for this shape

| plane | owns | boundary for this shape |
|---|---|---|
| `experience` | streaming partial work; letting a human interrupt or approve | often no per-document human interface at all; the human touchpoint is a review queue for low-confidence extractions, not a live interaction |
| `observability` | every model call, tool call and token as one traceable run | what was parsed, extracted, and validated per document, traced as one run; this is also where document-layout drift first becomes visible — a vendor changing their invoice template is the main operational risk, and it degrades silently unless someone is watching this trace |
| `evaluation` | deciding a change helped, before users do | graded at the field level, not the document level — one wrong field in an otherwise-correct document is still a failure for whatever downstream process trusted that field |
| `orchestration` | the shape: workflow, one loop, or many | usually a fixed pipeline per document — ingest, parse, extract, validate, route; a bounded retry loop only earns its keep when the first pass fails schema validation |
| `tools` | capability with schemas, scopes, an audit trail | the source system holding inbound documents, and the destination system that receives the structured records, are the tool surfaces; single documents can be request/response, but volume needs a queue or worker capability that survives bursts and retries |
| `context` | the right tokens in the window, the rest out | OCR or parsing output is the context extraction works from — the center of gravity is per-field precision on what actually reached the window, not narrative quality |
| `model` | reaching a model; surviving it being slow, wrong, or gone | the seam that turns parsed text into structured field values, plus schema validation on the way out |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `MADE` | one seam for the extraction call, sometimes paired with a separate OCR or parsing service | grep for provider SDK imports; confirm OCR/parsing and extraction are each single-seamed if they are separate services |
| `loop` (orchestration shape) | tends `MADE` as fixed pipeline | the steps are enumerable per document | find the exit condition on any retry — a fixed pipeline has none; a validation-triggered retry needs an explicit bound |
| `trust` (trust boundary) | tends `MADE` more often than other shapes | the document is usually a known, scoped input the customer already receives, not an open surface | check whether extracted values feed straight into a downstream system with no review — that reopens the boundary even for a scoped input |
| `run` (long-run home) | tends `OPEN` when volume is high | a queue or worker durable runtime is needed to absorb bursts and retries, unlike the narrow request window of a single-answer shape | confirm there is a durable job runtime, not a request handler holding volume traffic open |

## Discovery questions

1. What document types feed this pipeline, and how much do they vary in
   layout across sources?
   Purpose: layout variance decides whether one extraction schema suffices
   or per-source handling is needed.
2. What is the target schema, and which fields are required versus
   optional?
   Purpose: a required-but-missing field needs an explicit "not present"
   signal, not a guessed default.
3. What volume and burst pattern is expected — a steady trickle or periodic
   spikes?
   Purpose: sets the `run` decision between request/response and a durable
   queue.
4. What happens today when a document cannot be processed — is there a
   human fallback?
   Purpose: names the review-queue owner and the escalation path for
   `07-runbook.md`.
5. What is the acceptable error rate per field, and does it differ by field
   — a dollar amount versus a free-text note, for example?
   Purpose: sets per-field confidence thresholds and where automatic versus
   human-reviewed routing splits.
6. Where do extracted records go, and what validates them before they are
   used downstream?
   Purpose: identifies whether an independent schema or business-rule
   validation step exists, or the model's output is trusted directly.
7. Do documents ever contain content designed to manipulate downstream
   processing — an invoice note field carrying instruction-like text, for
   instance?
   Purpose: feeds the trust boundary; even a scoped input can carry
   adversarial content if a third party authored the document.
8. How is ground truth for evaluation obtained — manual labeling, comparison
   against an existing system, or spot audits?
   Purpose: sets what `06-evals/cases.jsonl` can actually be built from.
9. Are there fields that require values not literally present in the
   document — a category derived from context, for example?
   Purpose: distinguishes extraction from inference; inference needs a
   different tolerance for wrongness and a different evaluation.
10. What is the retention and access policy for source documents once they
    are extracted?
    Purpose: feeds the integration and operations planes — a document a
    user cannot see after processing needs a deletion or access-expiry
    rule.
11. Who currently does this extraction manually, and how long does one
    document take them?
    Purpose: baseline for `04-roi.md`.
12. Does the schema itself change over time — a new field added, a format
    updated — and who owns that change?
    Purpose: names the operations owner for schema drift, separate from
    document-layout drift.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| document ingestion pipeline | pulls documents from source and normalizes format — PDF, scan, email attachment — into a processable form | extraction quality is bounded by what reaches it in usable shape |
| OCR or parsing service | converts image or non-text formats into text the extraction step can read | the step where a misread character enters the pipeline if this is not accurate |
| extraction model gateway | the seam that turns parsed text into structured field values | keeps `model` a `MADE` decision as document volume grows |
| schema validator | checks extracted output against the target schema and business rules before it is trusted | the layer that catches a malformed value before it reaches a downstream system |
| confidence scorer | produces a per-field confidence used to route between automatic acceptance and human review | the mechanism that turns "probably right" into a routing decision instead of a guess |
| review queue | surfaces low-confidence or failed extractions to a human and captures the correction | the human fallback named in discovery question 4 |
| durable job queue | handles volume and retries without holding a request open | the `run` decision's answer when volume is high |
| destination system connector | writes validated records into the system of record | the integration point where extraction actually pays off |
| evaluation harness | measures field-level accuracy against labeled ground truth | the reliability-plane requirement that grading happen per field, not per document |
| observability trace store | records what was parsed, extracted, and validated per document | lets someone debug a wrong field by seeing exactly what the pipeline saw at each step |

## Failure modes

- A field extracts a plausible-looking value that passes schema validation
  but is wrong — invisible to any check that validates format rather than
  content.
- OCR misreads a character in a critical field (an amount, a date) and
  extraction confidently structures the wrong value with high confidence.
- The document layout changes upstream — a vendor updates their invoice
  template — and extraction quality degrades gradually rather than failing
  loudly, so nobody notices until downstream records are visibly wrong.
- A required field is genuinely absent from the document, and the model
  fills it with an inferred or default value instead of flagging "not
  present."
- Confidence scoring is uncalibrated, so the review queue either floods with
  correct extractions or waves through wrong ones without review.
- Free-text content in the document — a notes field, an email body —
  contains instruction-like text that the extraction step follows instead of
  treating as content to extract.

## Eval cases to include

- Golden cases spanning the document-type and layout variance named in
  discovery question 1, with known-correct field values.
- At least one case with a genuinely missing required field, checking the
  system reports "not present" rather than guessing.
- At least one injection case: a document containing instruction-like text
  in a free-text field, checking extraction treats it as content, not a
  command.
- A case testing a degraded or low-quality input — a poor scan, a corrupted
  PDF — checking confidence correctly drops instead of extracting garbage
  confidently.
- A case testing a layout the pipeline has not seen before, to measure
  graceful degradation versus silent wrong extraction.
