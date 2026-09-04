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

The September 2026 audit adds a coverage shell around that core:

- lifecycle: frame, design, prove, release, operate, retire;
- cross-cutting concerns: value, data, identity and security, reliability, governance and law, economics and sustainability;
- deployment modes: managed API, self-hosted, hybrid or sovereign, edge or on-device, realtime or multimodal.

The current chapters establish the core. The [coverage audit](strategy/coverage-gap-audit.md) names the work required before the annual candidate can claim full field coverage.

## Read the guide

| Part | Question answered |
|---|---|
| [00. Reading contract](manuscript/00-reading-contract.md) | What does this guide promise, and what does it refuse to pretend? |
| [01. The architect's job](manuscript/01-the-architects-job.md) | What is architecture when model behavior is probabilistic? |
| [02. Four hard-to-reverse decisions](manuscript/02-four-decisions.md) | Which choices deserve senior attention first? |
| [03. Seven operating planes](manuscript/03-seven-planes.md) | How do you assign ownership and evidence? |
| [04. Model plane](manuscript/04-model-plane.md) | How do you buy capability without marrying a vendor? |
| [05. Context plane](manuscript/05-context-plane.md) | How does information enter the reasoning boundary? |
| [06. Tool plane](manuscript/06-tool-plane.md) | How does text become an action without becoming a security bug? |
| [07. Orchestration plane](manuscript/07-orchestration-plane.md) | Which loop shape fits the task, and where should it run? |
| [08. Evaluation plane](manuscript/08-evaluation-plane.md) | What proves that the system works? |
| [09. Observability plane](manuscript/09-observability-plane.md) | What must a trace explain after a bad run? |
| [10. Experience plane](manuscript/10-experience-plane.md) | Where do humans see, stop, approve, and recover? |
| [11. Economics](manuscript/11-economics.md) | What is the real cost of useful work? |
| [12. Reference architecture](manuscript/12-reference-architecture.md) | How do the decisions and planes fit in one deployable design? |
| [13. Ninety-day adoption](manuscript/13-ninety-day-adoption.md) | How does a team turn the method into operating practice? |
| [Appendix A. Model snapshot](manuscript/appendix-a-model-snapshot.md) | What did the vendor market look like on the verification date? |
| [Appendix B. Decision records](manuscript/appendix-b-decision-records.md) | Which records make the architecture reviewable? |

## Publication state

Edition `2026.0.1-draft` is a researched draft. Automated source, structure, and style checks pass before a pull request is opened. Release still requires named human review and an independent verifier in a fresh context. See [edition.yaml](edition.yaml) and [review gates](editorial/review-gates.md).

## System map

| Object | Owner | Purpose |
|---|---|---|
| `manuscript/` | accountable author | durable book content |
| `research/sources.yaml` | source editor | source identity, authority, access date, volatility |
| `research/claims.yaml` | claim editor | fact, inference, prescription, evidence, review date |
| `editorial/` | production editor | voice, review roles, gates, AI disclosure |
| `labs/` | architect | reusable decision and evaluation tools |
| `publishing/` | release editor | channel projections and release rules |
| `strategy/` | accountable author | scope audit, product architecture, and personal-book boundary |
| `releases/` | verifier | immutable edition receipts |
| `scripts/check-guide.mjs` | repository | mechanical quality gate |

## Local quality gate

```bash
node guide/scripts/check-guide.mjs
```

The script checks the manuscript inventory, required authority-system files, word floor, source IDs, claim evidence, review dates, placeholders, em dashes, and the Humanizer ban list. It does not certify truth. That remains a source-editor and verifier duty.

## Authority system

The [authority system](strategy/authority-system.md) defines two books with separate jobs:

- *Building Intelligence That Compounds* is the first-person operating doctrine. See the [personal book brief](strategy/personal-book-brief.md).
- *AI Architect Guide* is the neutral, source-backed technical reference.

`AI Architect Briefing` is the monthly change stream inside Signal Loop. `AI Architect Ultimate` is the frozen annual package. The [content graph](publishing/content-graph.yaml), [monthly template](publishing/monthly-brief-template.md), and [annual template](publishing/annual-ultimate-template.md) make the relationships inspectable.

## Contribution rule

A pull request that changes a factual claim must change its claim record or explain why the claim record is unaffected. A release cannot be marked ready while any required human gate is pending.

Maintained by Frank Riemer, Founder and AI Systems Architect. Research and initial drafting support for this edition is disclosed in [AI contribution](editorial/ai-contribution.md).
