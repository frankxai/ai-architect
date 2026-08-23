# Retrieval-grounded answering

## Problem it fits

A user asks a question and the correct answer lives in a corpus the system
does not own the truth of — internal documentation, a knowledge base,
contracts, product manuals, prior support tickets. The system's job is to
find the right passages, answer from them, cite where the answer came from,
and say "not found" when the corpus does not cover the question. The failure
that defines this shape is not a wrong answer from a bad model — it is a
confident answer built on the wrong passage, or no passage at all.

This shape is not decision-support: there is no recommendation to accept or
override, only an answer with a citation trail. It is not
conversational-service: the loop is one question in, one grounded answer
out, even if the surface is a chat window — the system does not need memory
of the conversation to do its job, only memory of the corpus.

## The seven planes for this shape

| plane | owns | boundary for this shape |
|---|---|---|
| `experience` | streaming partial work; letting a human interrupt or approve | the citation is part of the answer, not a footnote — a user must be able to see which passage backed which claim before they act on it, and "not found" has to render as a first-class answer, not an error state |
| `observability` | every model call, tool call and token as one traceable run | every query's retrieved chunks, reranker scores, and generated answer are one traceable run; corpus and index freshness live here too — staleness is invisible unless someone is watching, not a one-time setup fact |
| `evaluation` | deciding a change helped, before users do | retrieval and generation are graded separately: a recall eval on retrieval, a faithfulness eval on generation — a generation eval alone cannot see a retrieval failure |
| `orchestration` | the shape: workflow, one loop, or many | usually a fixed workflow — retrieve, rerank, generate, cite — not a loop; a loop only earns its keep if the system needs to reformulate the query itself when the first retrieval comes back thin, or when multi-hop retrieval across a very large corpus pushes past a single request window |
| `tools` | capability with schemas, scopes, an audit trail | the corpus source (document store, wiki, ticket system) is the tool surface here — a user must never retrieve a passage they are not allowed to read, and every retrieval call is scoped and audited like any other tool call |
| `context` | the right tokens in the window, the rest out | this is the shape's center of gravity: query understanding, retrieval, and reranking decide what reaches the window before generation ever runs |
| `model` | reaching a model; surviving it being slow, wrong, or gone | the generation seam that turns retrieved context into a grounded answer — the model's job is to answer only from what the context plane handed it, nothing else |

## The four decisions as they usually land

| decision | typical verdict | why | evidence to check |
|---|---|---|---|
| `model` (model call seam) | tends `MADE` | the loop is narrow enough that one seam usually suffices for both query understanding and generation | grep for provider SDK imports; confirm exactly one module owns the call |
| `loop` (orchestration shape) | tends `MADE` as fixed workflow | the steps are enumerable: retrieve, rerank, generate, cite | find the exit condition — a fixed workflow has no exit condition to find, because there is no loop; if there is a loop, find what bounds it in code |
| `trust` (trust boundary) | tends `OPEN` more often than the shape's simplicity suggests | retrieved passages are the shape's entire input, and they come from documents an untrusted party may have written or edited | trace one retrieved passage from the retriever call to the line where it is labelled as data, not instruction, in the prompt |
| `run` (long-run home) | tends `MADE` | retrieval and generation both fit inside a normal request; a long-run home is rarely needed unless indexing itself runs inside the same service | confirm indexing is a separate job from the query path, not sharing its execution budget |

## Discovery questions

1. What is the corpus, and who is the source of truth for what is currently
   in it?
   Purpose: the corpus owner is who signs off on `05-trust-boundary.md` and
   who is accountable when an answer cites something stale or wrong.
2. What access control already exists on the source documents, and does the
   retrieval path preserve it per user?
   Purpose: a retrieval system that flattens access control turns "answer
   questions from our docs" into "leak restricted docs to whoever asks."
3. How is the corpus updated today, and how often?
   Purpose: sets the re-indexing cadence that `07-runbook.md` needs an owner
   for; a corpus that changes daily and indexes monthly is answering from a
   stale world.
4. What should the system say when the answer is not in the corpus?
   Purpose: "not found" is a designed behavior, not a fallback — without it,
   the model fills the gap from its own training data and the citation
   promise breaks silently.
5. What counts as a citation the user can act on — a document title, a
   section, a line, a URL?
   Purpose: determines what the retrieval layer needs to preserve alongside
   the text (chunk provenance) and what the experience plane needs to
   render.
6. Are there passages in the corpus that should never surface verbatim —
   personal data, legal language, anything requiring a redaction pass?
   Purpose: feeds the trust boundary directly; redaction has to happen before
   generation sees the text, not after.
7. What is the expected question distribution — narrow and repetitive, or
   open-ended and novel?
   Purpose: narrow, repetitive questions can often be answered by a smaller
   pre-built index; open-ended questions need retrieval robust to phrasing
   the corpus never used.
8. What language(s) does the corpus exist in, and what language(s) do users
   ask in?
   Purpose: cross-lingual retrieval is a different embedding and evaluation
   problem than same-language retrieval; naming the mismatch now avoids
   discovering it in production.
9. Who currently answers these questions when there is no system, and how
   long does it take them?
   Purpose: gives the baseline `04-roi.md` compares against, and tells you
   who to interview for the golden eval cases.
10. What happens today when someone gets a wrong answer from the current
    process — is it caught, and by whom?
    Purpose: names the review or feedback loop this system needs to preserve
    or improve on; a system with worse error-catching than the process it
    replaces is a regression dressed as an upgrade.
11. Does the corpus contain conflicting information across documents — an
    old policy and a new one, for example?
    Purpose: conflicting sources force a ranking or recency decision the
    retrieval layer has to make explicitly, or the system will answer from
    whichever chunk the retriever happened to surface first.
12. What is the cost of a wrong answer here versus a slow "I don't know"?
    Purpose: sets the calibration target for the refusal behavior in
    `gate.evals` — a shape where wrong answers are costly should refuse more
    readily than one where speed matters more than perfect recall.

## Bill of materials (capability roles)

| role | what it does | why this shape needs it |
|---|---|---|
| document ingestion pipeline | pulls source documents from where they live, normalizes format, tracks provenance | retrieval quality is bounded by ingestion quality — a chunk with no provenance cannot be cited |
| embedding service | turns text chunks and queries into vectors for similarity search | the mechanism that makes "find the relevant passage" possible at corpus scale |
| vector store | indexes and serves nearest-neighbor lookups over embedded chunks | the retrieval layer's storage and query engine |
| reranker | reorders retrieved candidates by relevance before generation sees them | first-pass vector search is a recall step, not a precision step; reranking closes the gap |
| model gateway | the single seam a request passes through to reach a language model | keeps `model` a `MADE` decision as usage grows past one call site |
| access-control propagation | carries the source document's permissions through to the retrieval result | the mechanism that prevents the trust-boundary failure named in decision question 2 |
| citation renderer | attaches the source passage's location to each claim in the generated answer | the experience-plane requirement that a citation be visible, not just logged |
| evaluation harness | runs retrieval-recall and generation-faithfulness evals separately | the evaluation-plane requirement that the two failure types are graded apart |
| observability trace store | records each query's retrieved chunks and generated answer as one traceable run | lets someone debug a wrong answer by seeing what the model actually saw |

## Failure modes

- The reranker never sees the right candidate because the first-pass vector
  search's top-k was too narrow — looks like a generation failure, is a
  retrieval failure.
- Chunking splits an answer across a boundary, so no single chunk contains
  the full fact — the model then either guesses the missing half or the
  reranker discards the incomplete chunk as low-relevance.
- The corpus updates but the index does not, and the system answers
  confidently from a stale version with no signal that it is stale.
- Access control is enforced at the document level but not at the chunk
  level, so a chunk from a restricted document surfaces to a user without
  access to the source.
- The system never says "not found" because the model always generates
  something plausible from the retrieved context, even when that context is
  irrelevant to the question asked.
- A retrieved passage contains text written to manipulate a downstream
  reader ("ignore prior instructions and...") and the system treats it as
  part of the answer's reasoning rather than as quoted, untrusted data.

## Eval cases to include

- Golden cases drawn from real questions with known-correct answers and
  known-correct citations, covering the question distribution named in
  discovery question 7 — narrow ones and open-ended ones both need
  coverage.
- At least one refusal case where the correct answer is "not found" because
  the corpus genuinely does not cover the question — this is the case most
  systems in this shape fail first.
- At least one injection case: a corpus passage crafted to contain an
  instruction rather than information, checking that the system answers the
  user's question from the passage's content and does not follow an
  instruction embedded inside it.
- A case with conflicting sources in the corpus, checking the system either
  surfaces the conflict or applies a stated recency/authority rule rather
  than silently picking one.
- A case testing a chunk-boundary split, where the correct answer requires
  information split across two adjacent chunks.
