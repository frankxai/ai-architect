# 17. Governance, law, and the operating model: decide who decides

Architecture fails quietly when nobody can say who approved a risk, who may grant an exception, or who answers when a regulator, customer, or auditor asks for evidence. This chapter turns governance from a document set into decision rights connected to runtime evidence.

This chapter is architectural guidance, not legal advice. Regulatory classification and obligations for a specific system require qualified legal review in the relevant jurisdiction.

## Governance as decision rights

A field method for AI architecture needs an explicit lifecycle and organizational operating model in addition to runtime planes. [S17](../research/sources.yaml) [S23](../research/sources.yaml) [S31](../research/sources.yaml) [S32](../research/sources.yaml) [S33](../research/sources.yaml) [S35](../research/sources.yaml) C029

Express governance as a short table of decisions, each with one accountable role, the evidence required, and the exception path. C062

| Decision | Accountable role | Evidence required | Exception path |
|---|---|---|---|
| start a use case | product owner | value hypothesis, kill criterion, risk class | portfolio review |
| grant write authority to an agent | system owner with security reviewer | trust-boundary tests, abuse suite, revocation drill | time-boxed waiver with compensating control |
| approve a new model or provider | platform owner | eval comparison on frozen cases, data terms | canary under restricted traffic |
| add a data source | data owner | data contract, rights basis, deletion test | read-only pilot with synthetic data |
| release a behavior change | system owner | release packet with rollback receipt | emergency change with post-review |
| retire a system | system owner | retirement receipt | none |

Every exception is logged with an owner, an expiry, and the control that compensates for the missing evidence. An exception log that only grows is a governance incident.

## Management systems and risk frameworks

ISO IEC 42001 defines an organizational AI management system built around policy, objectives, risk and opportunity management, and continual management review. [S23](../research/sources.yaml) C028 The NIST GenAI Profile is a cross-sector companion to AI RMF 1.0 for risks across design, development, use, and evaluation. [S17](../research/sources.yaml) C018

Neither standard tells you how to build a trust boundary. Both expect evidence that you did. The architecture artifacts in this guide, including decision records, eval reports, traces, release packets, and retirement receipts, are the operating evidence a management system reviews. Map them once, so audits read existing artifacts instead of commissioning new ones.

## Regulation as an architecture input

The EU AI Act became generally applicable on 2026-08-02, with separate dates for prohibited practices, GPAI duties, and high-risk systems. [S20](../research/sources.yaml) C020 The General-Purpose AI Code of Practice has transparency, copyright, and safety and security chapters, with the last chapter applying to providers of models with systemic risk. [S38](../research/sources.yaml) C040 The Commission's high-risk classification guidance remains a draft and should be treated as volatile until finalized. [S39](../research/sources.yaml) C041

Architecturally, three practices hold regardless of jurisdiction:

1. **Classify early.** Record the intended purpose, affected people, and decision impact in the frame stage. Classification drives logging, human oversight, and documentation duties, so it must exist before the design is fixed.
2. **Emit evidence from the runtime.** Compliance evidence should be produced by the runtime and release process instead of assembled after deployment. [S17](../research/sources.yaml) [S20](../research/sources.yaml) C021
3. **Keep a jurisdiction and rights record.** Note where data is stored and processed, which regional controls apply, the copyright policy for training and retrieval content, and the evidence retention period.

## The operating model

Central teams that own every decision become queues. Product teams that own every decision repeat the same mistakes. A federated model works better for most organizations: a small central group owns standards, the shared platform, architecture review, and the exception process, while product teams own outcomes, evals, and operation of their systems. C063

One vendor's published model describes an AI center of excellence as a cross-functional group of architects, technologists, subject-matter experts, and business roles responsible for strategy, standards, governance, and responsible adoption. [S35](../research/sources.yaml) Whatever the name, judge it by service levels: how long an architecture review takes, how many exceptions are open, and how often a product team reuses a platform seam instead of building its own.

Procurement belongs in this model. Vendor reviews ask for data terms, model change notice, regional processing, incident notification, and exit support. The provider seam from [chapter 2](02-four-decisions.md) makes the exit credible.

## Release evidence

Governance is working when the team can show:

- a decision-rights table with named roles and an exception log with expiries;
- an AI inventory listing each system, its risk class, owner, deployment mode, and last review date;
- a mapping from architecture artifacts to the management system and applicable regulation;
- a jurisdiction and rights record for each production system;
- an architecture-review service level that is measured, not assumed;
- legal sign-off on classification for any system that may fall into a regulated category.
