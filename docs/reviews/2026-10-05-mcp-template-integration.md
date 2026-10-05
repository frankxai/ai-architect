# MCP and deploy-lab integration review, 2026-10-05

Repository: `frankxai/ai-architect`. Remote base observed:
`8347ad953d3ed708fcac489db4f5ce68f161649c`.

Local candidate branch: `codex/academy-mcp-reliability-20261005`.
Guide additions from PR #8 head `c00fc44` were carried forward, preserving
authorship, as local commit `7343c8a4fcb23c7ba50e8c7d1db0d9ca759dc124`.
The publisher must record the resulting remote integration commit separately.

## Branch decisions

| Remote branch | Ahead / behind main | Decision |
|---|---:|---|
| `copilot/update-ai-architect-guide` | 1 / 0 | Carry PR #8's chapters, labs and roadmap with current source corrections |
| `codex/guide-agency-integration-20260905` | 1 / 4 | Its useful contract and labs are already carried by #8; retain branch history |
| `copilot/process-prs-and-clean-main` | 0 / 0 | Identical to main; no unique work to integrate |

## Material findings and changes

The MCP process could terminate on JSON `null`, answered tool notifications,
and omitted MCP error status when subprocess checks failed. It now returns
protocol errors for malformed messages, ignores notifications without executing
tools, supports ping, validates arguments, bounds input lines and subprocess
duration, and marks unsuccessful execution as a tool error. Initialization
refuses symlink paths and uses exclusive copies. Stage agents still write only
their authorized architecture artifacts; no application-code authoring tool was
added. The generated team roster now includes all eleven source agents.

The request surface previously rewrote to an absent `/api` entry and lacked
upstream failure handling. It now has a recognized Node server entrypoint,
separate private proxy and worker tokens, authenticated creation and polling,
body limits, a five-second upstream timeout, and bounded gateway errors. The
worker limits retained jobs and records terminal model-step failure instead of
wedging the queue. The root test command includes both deploy labs; CI paths
include JavaScript changes.

The worker documentation previously claimed a database and durable storage
while the code used only in-memory structures. It now describes a dry-run lab,
operator-driven execution, and restart data loss. No Postgres, Redis, payment,
community entitlement, production agent runner, or hosted MCP service is claimed.
Book and model catalogs belong to a source ledger; the [partial source review](../../guide/releases/2026-10-05-source-review.md)
records observed corrections without closing final-edition review gates.

## Observed local verification

| Command or gate | Observed outcome |
|---|---|
| `npm ci` | Success; pinned YAML dependency installed |
| `npm test` | Exit 0: 102 install checks, skill parity, 16 surface eval cases, 23 conductor/MCP/overlay tests, 8 deploy-lab tests, guide quality, 31 ledger/authority/audit tests |
| `node scripts/build-team-json.mjs` | Eleven agents generated from source instructions |
| Artifact checks for support-triage, contract-rag, personal-ai-coe | 79 checks passed per example |
| ROI checks for the same examples | 21, 27 and 19 checks passed respectively; date/format checks, no live price benchmark |
| `git diff --check` | Exit 0 |

No model calls or cloud deployments ran during these tests. The default root
ROI and artifact commands skip when no customer artifact directory exists;
the explicit example runs provide the artifact and ROI evidence above. These
tests establish local contracts, failure handling, and authorization behavior.
An independent source/editorial review and deployed-tenant smoke test remain
separate work.

## SaaS estate disposition

`frankxai/saas-ai-architect-academy` was read only. Its main head was `ce53709`.
The Supabase scaffold branch is zero ahead and three behind, already integrated.
The FSL estate-license branch is four ahead and one behind; its changes concern
license, ownership notice and package metadata. Main already declares FSL.
No open SaaS pull request appeared in the connector's open-PR search.

Its package requests Next.js and its lint configuration at version 16 while the
checked-in lockfile names 15.5.3. The browser data adapter keeps progress and
waitlist submissions in localStorage; the static adapter has no persistence.
The Supabase-backed signup copy therefore exceeds the implemented behavior.
Billing and authenticated resource access were not found in the inspected app
source. Keep this surface inactive and migrate curriculum, authoring and
evidence specifications only after the canonical commercial application is
chosen. Nothing in this review activates it or changes its license.
