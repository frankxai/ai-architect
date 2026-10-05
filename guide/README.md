# AI Architect Guide 2026

**Build systems that can change their models without losing control.**

This directory is the canonical source for the AI Architect Guide 2026. It is a field guide, an evidence ledger, and a publishing contract in one versioned object. It also defines how the guide connects to Frank's personal book, monthly briefings, annual releases, blog, Signal Loop newsletter, research hub, and AI Architect Academy.

The governing reader is a senior architect, CTO, technical founder, or AI platform lead who must make production decisions under model churn. The guide assumes that the reader already knows APIs, cloud systems, retrieval, and software delivery.

## The thesis

AI architecture is the practice of bounding uncertainty.

Four decisions are expensive to reverse:

1. the model-provider seam;
2. the loop shape;
3. the trust boundary;
4. the long-run home.

Everything else is operated through seven planes: model, context, tools, orchestration, evaluation, observability, and experience.

This split is deliberate. The four decisions hold the system together. The seven planes make it measurable, replaceable, and operable.

The September 2026 audit added a coverage shell around that core:

- lifecycle: frame, design, prove, release, operate, retire;
- cross-cutting concerns: value, data, identity and security, reliability, governance and law, economics and sustainability;
- deployment modes: managed API, self-hosted, hybrid or sovereign, edge or on-device, realtime or multimodal.

Chapters 14 to 17 now draft that shell. The [status and roadmap](strategy/roadmap.md) shows which domains have proof artifacts and which are still drafts.

## Start here

| If you are | Read | Then do |
|---|---|---|
| an architect in a design review | [02](manuscript/02-four-decisions.md), [03](manuscript/03-seven-planes.md), [12](manuscript/12-reference-architecture.md) | [Four-decision review](labs/four-decision-review.md) |
| a CTO or platform lead | [01](manuscript/01-the-architects-job.md), [11](manuscript/11-economics.md), [16](manuscript/16-platform-release-reliability.md), [17](manuscript/17-governance-law-operating-model.md) | [Plane ownership matrix](labs/plane-ownership-matrix.md) |
| a security or risk owner | [02](manuscript/02-four-decisions.md) trust boundary, [06](manuscript/06-tool-plane.md), [14](manuscript/14-data-knowledge-provenance.md), [15](manuscript/15-identity-security-delivery.md) | [Delegated-authority lab](labs/delegated-authority/README.md) |
| a technical founder | [00](manuscript/00-reading-contract.md), [02](manuscript/02-four-decisions.md), [13](manuscript/13-ninety-day-adoption.md) | [Agency and ownership review](labs/agency-and-ownership-review.md) |

## Read the guide

**Part I. The method**

| Chapter | Question answered |
|---|---|
| [00. Reading contract](manuscript/00-reading-contract.md) | What does this guide promise, and what does it refuse to pretend? |
| [01. The architect's job](manuscript/01-the-architects-job.md) | What is architecture when model behavior is probabilistic? |
| [02. Four hard-to-reverse decisions](manuscript/02-four-decisions.md) | Which choices deserve senior attention first? |
| [03. Seven operating planes](manuscript/03-seven-planes.md) | How do you assign ownership and evidence? |

**Part II. The planes**

| Chapter | Question answered |
|---|---|
| [04. Model plane](manuscript/04-model-plane.md) | How do you buy capability without marrying a vendor? |
| [05. Context plane](manuscript/05-context-plane.md) | How does information enter the reasoning boundary? |
| [06. Tool plane](manuscript/06-tool-plane.md) | How does text become an action without becoming a security bug? |
| [07. Orchestration plane](manuscript/07-orchestration-plane.md) | Which loop shape fits the task, and where should it run? |
| [08. Evaluation plane](manuscript/08-evaluation-plane.md) | What proves that the system works? |
| [09. Observability plane](manuscript/09-observability-plane.md) | What must a trace explain after a bad run? |
| [10. Experience plane](manuscript/10-experience-plane.md) | Where do humans see, stop, approve, and recover? |
| [11. Economics](manuscript/11-economics.md) | What is the real cost of useful work? |

**Part III. Apply it**

| Chapter | Question answered |
|---|---|
| [12. Reference architecture](manuscript/12-reference-architecture.md) | How do the decisions and planes fit in one deployable design? |
| [13. Ninety-day adoption](manuscript/13-ninety-day-adoption.md) | How does a team turn the method into operating practice? |

**Part IV. The whole system** (draft, added in 2026.0.3)

| Chapter | Question answered |
|---|---|
| [14. Data, knowledge, and provenance](manuscript/14-data-knowledge-provenance.md) | Where does knowledge come from, who may use it, and how does it leave? |
| [15. Identity, security, and secure delivery](manuscript/15-identity-security-delivery.md) | Who is acting, under whose authority, and through which supply chain? |
| [16. Platform, release, reliability, and retirement](manuscript/16-platform-release-reliability.md) | Where does it run, how does it change, fail, recover, and stop? |
| [17. Governance, law, and the operating model](manuscript/17-governance-law-operating-model.md) | Who decides, and what evidence answers an auditor or regulator? |

**Appendices**

| Appendix | Question answered |
|---|---|
| [A. Model snapshot](manuscript/appendix-a-model-snapshot.md) | What did the vendor market look like on the verification date? |
| [B. Decision records](manuscript/appendix-b-decision-records.md) | Which records make the architecture reviewable? |

## The open ecosystem this guide connects to

The guide cites these at the boundary where each one applies. It does not rank them; your evals decide. Every entry has a source record in [sources.yaml](research/sources.yaml).

| Boundary | Open protocol, standard, or project | Chapter |
|---|---|---|
| tool and context connectivity | Model Context Protocol and its authorization profile (S08, S09) | 06, 15 |
| agent-to-agent work | Agent2Agent 1.0 under the Agentic AI Foundation (S10, S41) | 07, 15 |
| durable execution | Temporal workflow patterns (S11) | 07, 16 |
| telemetry | OpenTelemetry GenAI semantic conventions (S16) | 09 |
| agent security | OWASP Top 10 for Agentic Applications and LLM Top 10 (S18, S19) | 02, 15 |
| AI bill of materials | SPDX 3.0.1 AI profile, CycloneDX ML-BOM (S26, S27) | 14, 15 |
| content provenance | C2PA 2.4 (S37) | 14 |
| platform | Kubernetes Agent Sandbox, AI Gateway working group, Gateway API Inference Extension (S28 to S30) | 15, 16 |
| cloud architecture | Well-architected AI guidance from the major cloud providers (S31 to S34) | 16 |
| risk and management | NIST AI 600-1, NIST agent standards, ISO IEC 42001, NIST SP 800-218A (S17, S22, S23, S25) | 15, 17 |
| regulation | EU AI Act and GPAI Code of Practice (S20, S38, S39) | 17 |

Inside this repository, the [`/architect` plugin](../README.md) runs the same method as a nine-stage gated lifecycle in your own codebase.

## Publication state

Edition `2026.0.4-working` is a public working edition, not the final annual book. It has 20 manuscript files, a source and claim ledger, and an executable authority-boundary lab. Final-book source, security, rights, editorial, and author gates remain open. See [edition.yaml](edition.yaml) and [review gates](editorial/review-gates.md). Claims of full field coverage, human expert certification, and production benchmark results are not made.

Start with the [four decisions](manuscript/02-four-decisions.md), check the [status and roadmap](strategy/roadmap.md), run the [authority-boundary lab](labs/delegated-authority/README.md), or read the [September briefing](publishing/issues/AAB-2026-09.md). The [architecture hub](https://www.frankx.ai/ai-architecture) connects this working source to the wider field guide.

## System map

| Object | Owner | Purpose |
|---|---|---|
| `manuscript/` | accountable author | durable book content |
| `research/sources.yaml` | source editor | source identity, authority, access date, volatility |
| `research/claims.yaml` | claim editor | fact, inference, prescription, evidence, review date |
| `editorial/` | production editor | voice, review roles, gates, AI disclosure |
| `labs/` | architect | reusable decision and evaluation tools |
| `publishing/` | release editor | channel projections and release rules |
| `strategy/` | accountable author | roadmap, scope audit, product architecture, agency contract, and personal-book boundary |
| `releases/` | verifier | immutable edition receipts |
| `scripts/check-guide.mjs` | repository | mechanical quality gate |

## Local quality gate

```bash
npm ci --ignore-scripts
npm run guide:check
npm run guide:test
```

The script checks the manuscript inventory, required authority-system files, word floor, YAML structure, unique IDs, claim metadata, real calendar dates, final-gate evidence, local links, placeholders, em dashes, and the Humanizer ban list. Regression tests exercise gate failures. Lab tests exercise local policy behavior. Neither certifies truth or production security.

## Authority system

The [authority system](strategy/authority-system.md) defines two books with separate jobs:

- *Building Intelligence That Compounds* is the first-person operating doctrine. See the [personal book brief](strategy/personal-book-brief.md).
- *AI Architect Guide* is the neutral, source-backed technical reference.

`AI Architect Briefing` is the monthly change stream inside Signal Loop. `AI Architect Ultimate` is the frozen annual package. The [content graph](publishing/content-graph.yaml), [monthly template](publishing/monthly-brief-template.md), and [annual template](publishing/annual-ultimate-template.md) make the relationships inspectable.

## Agency and ownership extension

The proposed [agency contract](strategy/agency-and-ownership.md) translates the freedom-oriented mission into architecture requirements without changing this guide's neutral technical voice. Use the [agency and ownership review](labs/agency-and-ownership-review.md) and compare the [synthetic worked example](labs/agency-and-ownership-example.md). These additions are draft material, not a public rebrand or release approval.

## Contribution rule

A pull request that changes a factual claim must change its claim record or explain why the claim record is unaffected. A final edition cannot be marked released while any required human gate is pending. Merging a clearly labeled working draft does not close those gates.

Maintained by Frank Riemer, Founder and AI Architect. Research and initial drafting support for this edition is disclosed in [AI contribution](editorial/ai-contribution.md).
