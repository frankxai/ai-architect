# Working-edition change record: 2026.0.2

Date: 2026-09-07. State: public working edition; final annual book remains draft.

## Changes

- Replaced regex ledger checks with a strict YAML parser and regression tests for invalid dates, duplicate IDs, missing fields, unsupported claim states, and absent or failed final gates.
- Distinguished source-supported facts, reasoned inferences, and proposed prescriptions.
- Added individual evidence records for the nine numeric model entries. The source and claim ledgers contain 41 and 54 records respectively.
- Added the delegated-authority lab and the first September working briefing. Its tests run without network access, credentials, or external effects.
- Corrected the public author title, marked personal-book prose as proposed, removed an unsupported rollout statement, and pinned the A2A source version.
- Preserved the existing Apache-2.0 technical-documentation license. No Academy domain, paid-book rights, or newsletter-send decision is implied.

## Verification scope

The local repository suite passes, including 19 existing Node tests and 29 new guide, policy, and attribution tests. The 16 existing eval cases are artifact and pattern checks, not measured model performance. The ROI check skips because no architecture price record is present.

An isolated agent verifier rechecked the numeric model rows, protocol versions, security ranking, and selected legal and operations claims. Its first review found defects that drove this change. The pull request records the subsequent disposition and CI result for the exact commit. No external human expert has certified this edition.

## Publication boundary

The website should link to a full commit SHA under `guide/`, label it a working edition, and expose the review gates. A pinned link is reproducible even as the main branch changes. There is no final-book tag, PDF or EPUB release, subscriber send, or new Academy publication in this change.

The new visual reader remains deferred until desktop and mobile evidence can satisfy the web-release contract. This release uses the existing architecture hub layout.

## Remaining work

Final-book security, legal and rights, source coverage, editorial reading, independent final-edition verification, and accountable-author approval remain open. The [coverage audit](../strategy/coverage-gap-audit.md) continues to govern the annual candidate. Corrections use a new commit and reference this record; the prior draft receipt remains unchanged.
