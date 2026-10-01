# Working-edition change record: 2026.0.3

Date: 2026-10-01. State: public working edition; final annual book remains draft.

## Changes

- Added Part IV, four draft chapters that close the release-blocking coverage gaps named in the [coverage audit](../strategy/coverage-gap-audit.md): [14. Data, knowledge, and provenance](../manuscript/14-data-knowledge-provenance.md), [15. Identity, security, and secure delivery](../manuscript/15-identity-security-delivery.md), [16. Platform, release, reliability, and retirement](../manuscript/16-platform-release-reliability.md), and [17. Governance, law, and the operating model](../manuscript/17-governance-law-operating-model.md).
- The new chapters cite existing source records S17 to S41, which the manuscript previously did not use, and existing claims. Nine new prescription records, C055 to C063, carry the new rules. No new source was added.
- Carried forward the agency and ownership contract, review lab, and synthetic example from closed draft PR 7. Its delivery plan was not imported: session-specific machine and branch notes were dropped, and its routing table and measures moved to the roadmap.
- Added the [status and roadmap](../strategy/roadmap.md): goal, intentions, progress against the release condition, coverage-domain status, PR and branch disposition, and a task board.
- Reorganized the guide entry page into four parts, reading paths by role, and a map of the open protocols, standards, and projects the guide cites.
- The quality gate now requires 20 manuscript files and the new strategy and lab files.

## Verification scope

`npm test` passes locally, including the guide gate and ledger tests. The new chapters passed the mechanical style, link, marker, and word-floor checks. No source was reopened in this pass, so source support for the new chapters rests on the ledger's existing `supports` summaries and claim records. No independent reviewer has read chapters 14 to 17.

## Known risk

32 source and claim records reach `review_by: 2026-10-04`. After that date `npm run guide:check` fails on stale evidence until a source editor reopens those sources and updates the records. This is the first task on the roadmap.

## Remaining work

All eight required final-edition gates remain pending. The roadmap lists the open tasks. The prior working-edition records remain unchanged.
