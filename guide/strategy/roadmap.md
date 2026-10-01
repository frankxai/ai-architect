# Guide status and roadmap

Status date: 2026-10-01. Edition: `2026.0.3-working`. This page is the single place to see what the guide is trying to become, how far it has come, and which tasks are open. Update it in the same pull request that changes progress.

## Goal

Make *AI Architect Guide* the reference a senior architect opens before an AI production decision, and earn that position with evidence rather than size or title. The [coverage audit](coverage-gap-audit.md) defines the release condition; this roadmap tracks it.

## Intentions

- **Decision core first.** Four hard-to-reverse decisions and seven operating planes stay stable across editions. New material extends them; it does not replace them.
- **Whole lifecycle.** Cover the work before deployment, below the application, across the organization, and after retirement, not only the runtime loop.
- **Evidence over assertion.** Every factual claim has a ledger record, every volatile fact has a review date, and every gate is closed by a named reviewer.
- **Vendor neutral, ecosystem aware.** Cite open protocols, standards, and open-source projects at the right boundary. Rank nothing that the reader's own evals should decide.
- **Usable on Monday.** Each chapter ends in release evidence a team can produce. Labs turn the method into a working session.
- **Ownership and exit.** Readers should finish with artifacts they own and a way to leave any vendor. The [agency and ownership contract](agency-and-ownership.md) states this as requirements.

## Progress against the release condition

| Release condition from the coverage audit | State | Evidence today | Next step |
|---|---|---|---|
| Complete coverage map with named exclusions | Partial | Audit domains mapped below; chapters 14 to 17 drafted | Publish named exclusions in the reading contract |
| Claim and source ledger with current review dates | At risk | 41 sources, 63 claims; 32 records reach `review_by` on 2026-10-04 | Source review before 2026-10-04 |
| Four reference architectures | 1 of 4 | Case-resolution agent in chapter 12 | Enterprise knowledge, realtime multimodal, sovereign or self-hosted |
| Public evaluation dataset and reproducible results | Not started | Plugin eval cases are artifact checks, not model performance | Benchmark method plus one field report |
| Named specialist reviews with dispositions | Not started | All eight required gates `pending` in `edition.yaml` | Recruit reviewers for security, legal, rights |
| Errata policy and visible correction history | Partial | Release records and contribution rule exist | Add an errata file and link it from each release record |
| Labs that reproduce the method | Partial | Four-decision review, plane matrix, ADR, eval scorecard, delegated-authority lab, agency and ownership review | One lab per release-blocking concern |
| Immutable annual release receipt | Not started | Working-edition records only | Requires every gate above |

## Coverage domains

Status key: **Covered** means a chapter section exists and cites the ledger. **Drafted** means a chapter exists but its proof artifact does not. **Gap** means neither.

| Domain | Where | State | Missing proof artifact |
|---|---|---|---|
| Problem and portfolio architecture | 01, 13 | Drafted | Opportunity record and stop-decision lab |
| Data and knowledge | [14](../manuscript/14-data-knowledge-provenance.md) | Drafted | Data and knowledge bill of materials example |
| Identity and delegated authority | [15](../manuscript/15-identity-security-delivery.md), delegated-authority lab | Covered | Independent security review |
| Security engineering | 02, 06, [15](../manuscript/15-identity-security-delivery.md) | Drafted | Threat-model and sandbox test example |
| Secure AI delivery | [15](../manuscript/15-identity-security-delivery.md) | Drafted | Signed release manifest with AI bill of materials |
| Platform and inference | [16](../manuscript/16-platform-release-reliability.md) | Drafted | Capacity model and routing policy |
| Change and release control | [16](../manuscript/16-platform-release-reliability.md), appendix B | Drafted | Release evidence packet example |
| Reliability and recovery | [16](../manuscript/16-platform-release-reliability.md) | Drafted | Game-day receipt |
| Evaluation science | 08 | Covered | Uncertainty intervals and judge-drift method |
| Observability | 09 | Covered | Trace contract and redaction tests |
| Economics and sustainability | 11, [16](../manuscript/16-platform-release-reliability.md) | Drafted | Cost per verified unit report; energy where material |
| Governance operating system | [17](../manuscript/17-governance-law-operating-model.md) | Drafted | Governance map and exception log example |
| Law, privacy, and rights | [17](../manuscript/17-governance-law-operating-model.md) | Drafted | Jurisdiction and rights record; legal review |
| Content provenance | [14](../manuscript/14-data-knowledge-provenance.md) | Drafted | Content Credential validation receipt |
| Human factors | 10 | Drafted | Human factors test report |
| Deployment modes | [16](../manuscript/16-platform-release-reliability.md) | Drafted | Deployment decision record |
| Organization and center of excellence | [17](../manuscript/17-governance-law-operating-model.md) | Drafted | Operating model and service catalog |
| Retirement | [16](../manuscript/16-platform-release-reliability.md) | Drafted | Retirement receipt |
| Field evidence | none | Gap | Versioned evidence repository |

## Pull request and branch disposition

Reviewed on 2026-10-01. Every pull request in the repository is closed.

| PR | Subject | On main | Disposition |
|---|---|---|---|
| #1 | Vendor-neutral plugin and deploy kits | Yes, `9c15932` | Done |
| #2 | Cross-harness conductor 0.1.1 | Yes, `54bf761` | Done |
| #3 | Conductor hardening, overlay team, MCP init 0.1.3 | Yes, `3bd47e9` | Done |
| #4 | Apache-2.0 and ownership | Yes, `4a2c11b` | Done |
| #5 | Guide 2026 working edition | Yes, squash `5afbb3c` | Done |
| #6 | Windows path attribution for devendor gate | Yes, squash `8347ad9` | Done |
| #7 | Connect guide to agency and ownership | No, closed as draft | Carried forward in 2026.0.3: contract, review lab, and synthetic example. The delivery plan's session-specific machine and branch notes were dropped; its routing table and measures moved here |

| Branch | State | Action for a maintainer |
|---|---|---|
| `main` | Canonical | Merge the 2026.0.3 pull request |
| `codex/guide-agency-integration-20260905` | Content carried forward | Delete after the 2026.0.3 pull request merges |
| `copilot/process-prs-and-clean-main` | Identical to `main`, no commits | Delete |

## Task board

Owners are roles to fill, not claims of participation. A task closes only with the evidence named.

### Now

| Task | Owner | Due | Done when |
|---|---|---|---|
| Re-verify the 32 records with `review_by: 2026-10-04`: vendor model catalogs S01 to S04, appendix A prices, EU AI Act sources, Kubernetes and AAIF reports | source editor | 2026-10-04 | Sources reopened, `accessed_on` and `review_by` updated, appendix A corrected; `npm run guide:check` fails on stale evidence after that date |
| Publish the October briefing `AAB-2026-10` with the source delta | release editor | 2026-10-15 | Issue file follows the monthly template and links changed claims |
| Merge the 2026.0.3 pull request and delete stale branches | accountable author | on review | `main` contains this edition; branch list matches the table above |

### Next

| Task | Owner | Done when |
|---|---|---|
| Add named exclusions to the reading contract | accountable author | Exclusions listed with reasons |
| Write the errata policy and file | production editor | `editorial/errata.md` exists and release records link it |
| Labs for data contract, threat model, release packet, retirement, governance map | architect | One lab per drafted domain with a synthetic worked example |
| Independent read of chapters 14 to 17 from a different provider | independent verifier | Dated verdict with dispositions in a release record |
| Run the agency and ownership lab against one real bounded prototype | guide maintainer | Six cases recorded with actual results |

### Later

| Task | Owner | Done when |
|---|---|---|
| Three more reference architectures | architect | Each states deployment mode, boundaries, identity, recovery, and retirement |
| Public benchmark method and first field report | eval engineer | Reproducible by a third party from the repository |
| Specialist reviews: security, legal, rights | named reviewers | `edition.yaml` gates `passed` with evidence pointers |
| Web, PDF, and EPUB projections | release editor | Channel hashes recorded in a release receipt |

## Downstream routing

The guide stays canonical in this repository. Other surfaces project it and must not become a second source of truth.

| Work | Target | Precondition |
|---|---|---|
| Public site copy and entry paths | `frankx.ai` website repository | Reverify repository, brand source, and deployment queue |
| Business implementation templates | business templates repository | Reverify template contracts |
| Personal book manuscript | publishing repository, not yet selected | Resolve title and canonical source |
| Academy lab projection | ownership unresolved | Resolve Academy ownership first |
| Notion and Drive | editorial and review projections | Record the canonical commit in each projection |

## Measures

Primary: intended readers who produce a usable, owned architecture record that survives independent review. Record numerator, denominator, window, and definition of usable. Downloads are not outcomes.

Supporting: ledger freshness (records past `review_by`, target zero), open required gates, drafted domains with a proof artifact, first-use lab completion time, and corrections published.
