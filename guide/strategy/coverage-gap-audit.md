# September 2026 coverage audit

## Decision

The current manuscript is a strong decision core for production agent systems. It is not yet the full annual reference an AI systems architect needs in September 2026.

Keep the four hard-to-reverse decisions and seven runtime planes. Add a coverage shell around them:

- six lifecycle stages: frame, design, prove, release, operate, retire;
- six cross-cutting concerns: value, data, identity and security, reliability, governance and law, economics and sustainability;
- five deployment modes: managed API, self-hosted, hybrid or sovereign, edge or on-device, realtime or multimodal.

This preserves the memorable method while adding the work that happens before deployment, below the application layer, across the organization, and after a system leaves service.

## What the draft already does well

The manuscript already gives senior practitioners a coherent answer to the hardest production questions:

- isolate vendor change behind an owned provider seam;
- choose the least autonomous loop that fits the uncertainty;
- make trust boundaries and authority explicit;
- give long-running work durable state and recovery;
- operate model, context, tools, orchestration, evaluation, observability, and experience as separate planes;
- price verified outcomes rather than raw tokens;
- make evidence part of the release path.

That is the core doctrine. It should remain stable across annual editions.

## What a world-reference edition must add

| Domain | Current state | September 2026 requirement | Proof artifact | Priority |
|---|---|---|---|---|
| Problem and portfolio architecture | Light | Value hypothesis, work decomposition, buy or build test, kill criteria | Opportunity record and stop decision | Release blocker |
| Data and knowledge | Partial | Data contracts, lineage, provenance, freshness, rights, retention, deletion, drift, poisoning controls | Data and knowledge bill of materials | Release blocker |
| Identity and delegated authority | Partial | Separate human, workload, agent, session, and tool identity; bind delegated scope, audience, time, and revocation | Authority receipt and denial tests | Release blocker |
| Security engineering | Strong at tool boundary | Threat model the full system, isolate code and browser work, control egress, secrets, memory, and inter-agent traffic | Threat model, abuse suite, sandbox test | Release blocker |
| Secure AI delivery | Missing | Apply secure software practice to prompts, policies, models, datasets, tools, connectors, and acquisitions | Signed release manifest and AI bill of materials | Release blocker |
| Platform and inference | Missing | Routing, quotas, caching, batch and realtime paths, capacity, accelerator choices, gateways, tenancy | Capacity model and routing policy | High |
| Change and release control | Partial | Version every behavior-bearing asset; canary, rollback, migration, replay, and retirement rules | Release evidence packet | Release blocker |
| Reliability and recovery | Partial | Service objectives, failure budgets, queue controls, backpressure, degradation, disaster recovery, incident command | Game-day receipt and recovery test | Release blocker |
| Evaluation science | Strong | Add benchmark design, uncertainty intervals, contamination checks, judge drift, inter-rater agreement, and post-release sampling | Reproducible benchmark report | High |
| Observability | Strong | Add privacy-aware telemetry, lineage across agents, policy decisions, and operational service levels | Trace contract and redaction tests | High |
| Economics and sustainability | Partial | Unit economics, capacity economics, forecast error, optimization effects, carbon and energy decisions where material | Cost per verified unit report | High |
| Governance operating system | Missing | Decision rights, exception path, AI inventory, vendor review, incident accountability, AI management cycle | Governance map and exception log | Release blocker |
| Law, privacy, and rights | Partial | Regulatory classification, privacy engineering, data rights, copyright policy, regional controls, evidence retention | Jurisdiction and rights record | Release blocker |
| Content provenance | Missing | Signed provenance for generated and edited media where authenticity matters | Content Credential validation receipt | Medium |
| Human factors | Partial | Calibrated trust, accessibility, refusal design, workload transfer, operator training, contestability | Human factors test report | High |
| Deployment modes | Missing | Managed, self-hosted, sovereign, edge, realtime, multimodal, and disconnected constraints | Deployment decision record | High |
| Organization and AI center of excellence | Missing | Federated standards, platform ownership, architecture review, procurement, enablement, and product team autonomy | Operating model and service catalog | High |
| Retirement | Missing | Disable access, export records, revoke identity, remove data, preserve audit evidence, notify owners | Retirement receipt | Release blocker |
| Field evidence | Thin | Several reference architectures, public labs, benchmarks, failure notes, corrections, and dated results | Versioned evidence repository | Release blocker for authority claim |

## Why these gaps matter now

Agent identity and authorization are no longer secondary implementation details. NIST's 2026 AI Agent Standards Initiative names authentication, identity infrastructure, secure human-agent interaction, multi-agent interaction, open protocols, and security evaluation as active standards work. AAIF working groups separately cover identity and trust, reliability, observability, security, governance, and process integration. The guide must treat delegated authority as a first-class architectural object.

Data security now covers the whole supply chain. Joint government guidance addresses poisoning, drift, provenance, integrity, encryption, and trusted infrastructure. A context chapter alone cannot carry that burden. The annual edition needs a data and knowledge architecture section with inventory, lineage, rights, retention, and deletion.

Secure delivery now includes AI-specific assets. NIST SP 800-218A extends secure software practice for model producers, system producers, and acquirers. SPDX and CycloneDX can describe models, datasets, configurations, training methods, licenses, and provenance in machine-readable inventories. Each guide reference implementation should emit an AI bill of materials with its release evidence.

The application is only one layer. Current AWS, Azure, Google Cloud, and Oracle guidance covers data platforms, infrastructure, lifecycle operations, security, reliability, cost, performance, and sustainability. Kubernetes work on agent sandboxes, inference routing, and AI gateways makes platform choices visible in the open stack. The guide needs a platform chapter without becoming a cloud product catalog.

Management and regulatory systems also moved. ISO/IEC 42001 defines an organizational AI management system. The EU General-Purpose AI Code of Practice now has transparency, copyright, and safety and security chapters. Architecture records must connect runtime evidence to organizational decisions and legal classification.

## Stable core and dated edge

The annual reference should separate durable doctrine from volatile facts.

| Layer | Content | Change rule |
|---|---|---|
| Stable core | four decisions, seven planes, lifecycle, decision rights, evidence rules | changes only with a recorded doctrine decision |
| Annual methods | reference architectures, operating model, release system, field patterns | revised in the next annual candidate |
| Monthly edge | models, protocols, regulations, platform changes, incidents, new tests | reviewed every month and promoted only after evidence |
| Live ledger | sources, claims, errata, benchmark data, status | corrected through pull requests at any time |

The promise is not that the guide contains everything forever. The promise is that its scope is explicit, its omissions are visible, its volatile facts have review dates, and its update path is public.

## Annual manuscript expansion

The 2026 candidate should add the following sections before release:

1. Architecture frame and portfolio decisions.
2. Lifecycle and evidence architecture.
3. Data, knowledge, and provenance architecture.
4. Identity, authority, security, and sandboxing.
5. Platform, inference, deployment, and capacity.
6. Reliability, incident response, and retirement.
7. Governance, operating model, privacy, rights, and regulation.
8. Three additional reference architectures: enterprise knowledge work, realtime multimodal interaction, and sovereign or self-hosted operation.
9. A public benchmark method plus one reproducible field report.
10. An Academy lab for each hard-to-reverse decision and every release-blocking concern.

## Release condition

Do not call the guide a world reference because of its size or title. Earn that position when the repository contains:

- a complete coverage map with named exclusions;
- a claim and source ledger with current review dates;
- four reference architectures with runnable or inspectable artifacts;
- a public evaluation dataset and reproducible results;
- named specialist reviews and recorded dispositions;
- an errata policy and visible correction history;
- Academy labs that let readers reproduce the method;
- an immutable annual release receipt.

Until those conditions pass, `AI Architect Guide 2026` remains a researched draft.
