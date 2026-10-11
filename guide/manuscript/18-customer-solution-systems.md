# 18. Customer solution systems

The architect's deliverable is a customer result that survives operation. A presentation explains a decision; a portal makes it inspectable; a template shortens delivery. None establishes that the customer result occurs. The practice must bind each representation to the same specification and separate design quality from operating proof.

Consider a company research portal. Executives want decisions, researchers want sources, engineering wants reproducible code, and the cloud team wants workloads with continuing usage. These audiences share a project but need different views. Copying one slide deck into four systems creates four versions of truth. A versioned solution specification should hold identities, constraints, relationships, evidence references and decisions. Each audience receives a projection of that object. C064 records this delivery prescription, not the existence of a universal compiler.

## Start at the experience boundary

Write the accepted customer result before selecting a cloud or model. Name beneficiary, baseline, task volume, adoption assumption, failure consequence and acceptance owner. For research, an accepted result might be a brief whose important claims have accessible sources and whose recommendation survives a constraint change. Fluency alone cannot pass that test.

Describe the workflow in Human, AI and System columns. A person frames the question and permitted sources. The model prepares a draft. A trusted service checks source access and records the artifact. A reviewer accepts or corrects it. Publication is a separate action with separate authority. Failure branches include inaccessible sources, contradictory evidence, expired documentation, exhausted budget, tool outage and reviewer timeout. Each needs an owner and a recovery path.

Then describe screens. The project desk shows the next useful decision, current artifact and reason work is waiting. The workbench exposes alternatives and constraints. The review screen binds findings to an exact artifact. Mobile gives one decision at a time and preserves review, correction and export without requiring a large canvas. An animation may clarify progress; it cannot substitute for durable state.

The first mockup should expose unresolved work. Hiding missing evidence behind a green checkmark teaches people to mistake confidence for delivery. C065 requires maturity to follow each artifact's own evidence. A portal can be working while the workload it depicts remains a proposal. Its tested status must not travel to an untested cloud design.

## A specification is a join contract

Give every customer action, component, relationship, source and evaluation an immutable ID. A component states purpose, runtime, owner, data classification and trust boundary. A relationship states direction, payload class, transport requirement and authorization. The same component ID appears in the visual, code mapping, deployment record and incident report.

Do not force everything into one diagram. The system view describes structure. A data-flow view exposes crossings. A sequence view describes event order and timeouts. A service blueprint describes responsibility. An API contract describes requests and errors. Infrastructure code describes provisioned resources. A tested template describes reproduction. Shared identity connects these objects; identical formatting does not.

Reference existing architecture decisions and lifecycle gates. The solution specification must not become a competing approval database. The portable AI Architect engine continues to write architecture artifacts in the customer's repository. Application implementation requires a distinct scoped mandate. A generated portal does not widen that mandate, receive cloud credentials or become an execution gateway.

The [customer solution kit](../../solution-kit/README.md) compiles a synthetic specification into local HTML and topology exports. It supplies a reference boundary, not private tenancy, live inference or a hosted customer workbench. Its validator rejects imported runtime receipts and production maturity. Useful output remains inspectable without implying that the depicted system operates.

## Select the medium by its truth obligation

Use exact renderers for exact topology. Components, directions, connections, trust boundaries and labels should come from code or a reviewed specification. C4 and Structurizr are candidates for structural views; Mermaid suits compact event explanations; diagrams.net suits editable handoffs; React Flow suits a node and edge interface. The current kit emits SVG, Mermaid, diagrams.net XML and React Flow JSON. Importing JSON into a React application remains a separate integration task. C066 records the format-selection rule.

Google's official icon library supplies product, category and legacy console sets. The kit uses downloaded legacy SVGs with source and digest records. It states that generation explicitly; it does not claim to use the newer core-product set. Marks remain provider property and are excluded from the kit's Apache grant. S42 supports the existence of the official library, not an endorsement claim.

Generated imagery serves customer stories, character sheets, conceptual scenes and storyboard frames. Compose official icons, arrows and labels from the specification after generating art. An image model should not decide where customer data travels. A character may represent research, review or operation; the accountable owner remains named in the workflow. Retain generation tool, model metadata when exposed, reference identity, art direction, rights review and export digest. Unknown model identity stays unknown.

## Compare providers through customer constraints

Google Cloud, Vercel, Railway and local execution are candidates with different lifetimes and ownership boundaries. Start with data access, region, response lifetime, durable state, dependency availability, budget, owner and export. Every choice needs an honest disadvantage and replacement path.

A bounded draft may fit a web request. A research job that pauses for review requires persistent state and effect-safe replay. Customer-owned coding agents may suit private preparation. Continuous containers may suit standing workers. A Google-first organization may benefit from its existing identity and data estate. These are architectural hypotheses until tested on the customer's actual workload.

Current Cloud Run documentation describes agents, model integration and RAG use cases. S43 supports that scope. The kit's GCP view is a proposed composition, not an official Google reference architecture. Adopt provider samples at an immutable revision with license, configuration and run evidence. A sample README is not a clean-install receipt.

Model catalogs require separate refresh. The inspected Gemini API catalog distinguishes stable and preview endpoints. The old Vertex AI model-documentation URL currently resolves into Gemini Enterprise Agent Platform documentation. S44 records that observation. It does not establish access, data terms, region support or quota for a customer account. Those checks belong to the selected adapter and deployment receipt.

## Keep customer benefit and consumption separate

Cloud teams often need workload wins and consumption growth. Customers need useful results, short delivery time and acceptable cost. These reinforce one another when adoption grows because the system works. They conflict when complexity increases spend without accepted value. C067 requires both ledgers to remain visible.

The customer ledger tracks eligible tasks, adoption, accepted results, correction time, incidents, total delivery cost and realized benefit. The provider ledger tracks attributable billable service usage, account, region, credits and exclusions. API charges outside a provider's billable services must not silently count as that provider's consumption. Customer willingness to pay and provider metering answer different questions.

An illustrative scenario assumes 1,000 eligible tasks per month, 60 percent adoption, 80 percent acceptance, 12 minutes saved per accepted result and EUR 60 per hour of capacity value. This yields 480 accepted results and EUR 5,760 gross capacity value. At EUR 1,200 all-attempt inference, hosting, review and support cost, net capacity value is EUR 4,560. C068 records an example, not revenue or measured ROI.

Test adoption, acceptance and correction burden in the pilot. Saved time may not become financial value when the freed capacity is unused. Edge cases may increase review effort. Include abandoned runs and retries. Report cost per accepted result with its denominator. Token prices alone miss the operating system.

## Intelligence is a budgeted design choice

Separate sophistication from maturity. A deterministic program can be production verified while coordinated agents remain conceptual. Use A0 for deterministic processing, A1 for grounded assistance, A2 for tool workflows, A3 for bounded reasoning and A4 for coordination across scoped roles. These are local design labels, not industry credentials or measurements of general intelligence.

Compare the simplest feasible design and one justified alternative on frozen tasks. Require coordination to improve accepted-result quality, latency, economics or authority separation. Reviewer independence may justify another worker; agreement among similar models does not establish truth. All workers consume the root budget and inherit bounded permissions. A model change invalidates affected evaluations even when the UI looks identical.

Assess usefulness, experience, factual evidence, technical correctness, reliability, economics, portability and maintenance separately. Hard failures remain hard failures. A tenant breach cannot be averaged away by typography. An unsupported customer-success claim cannot be offset by a polished chapter.

## Industry research and the living encyclopedia

Build industry portals around observed jobs. Support triage, invoice exceptions, technical retrieval and research briefs are initial hypotheses. Their rank depends on task volume, evidence access, failure consequences, adoption and recovery. No universal highest-return case is defensible without a customer baseline.

Each encyclopedia entry needs a decision, alternatives, failure to test, required artifact, sources, freshness, maturity and owner. Cross-link entries by IDs. Architecture centers are upstream references; wiki pages are projections; repositories own code; assessments own results. A partner directory records actual relationship state and scope. Public documentation does not make its publisher a signed Academy partner.

Keep inventions as hypotheses until independently tested. Experience-to-topology compilation, evidence-preserving portals, source-drift maps and portable acceptance capsules are useful candidates. Architecture-as-code and model-driven engineering already contain relevant prior work. C069 requires prior-work investigation before novelty claims. A proposed combination is neither a patent nor a proven moat.

Source refresh should identify affected claims, templates, pages and chapters, then open a bounded correction. Recurrence exists only after an actual scheduler is installed and its receipt retained. Describing proactive agents does not activate them.

## Deliver the acceptance capsule

The handoff joins specification, source revision, dependency lock, configuration, diagrams, supported-host instructions, test output, findings, owner, rollback and export. C070 makes this the portable acceptance unit. Give another practitioner enough evidence to reproduce the result and enough honesty to know where reproduction ends.

For the book, record chapter length, draft contributor, exposed model/harness identity, source refresh, editorial changes and independent review. A mechanically checked working edition remains distinct from a final author-approved book. The Academy teaches the same practice through its existing competency graph. Reading, generating diagrams and paying for instruction do not confer production competence.

Each accepted customer result should improve a maintained template, reference entry, evaluation case and teaching artifact. The practice decays when every demo creates another unowned portal. Preserve evidence and earn the next level of authority through reproducible work.

## Keep image interfaces current

For API-based visual production, the inspected OpenAI guide recommends GPT Image 2.5 Sunburst for precise editing and Flare for fast generation (S45; C071). The deprecation page schedules removal of the API alias `chatgpt-image-latest` on 1 December 2026 (S46; C072). Pin a supported evaluated snapshot and track the dependency. These statements concern API documentation; they do not identify the backend chosen inside ChatGPT or establish access in the customer's account.

Prepare a scene brief, character continuity sheet, synthetic screen storyboard and exact graph separately. Generated character or environment layers can support a story; component IDs, icon assets, numbers and arrows come from reviewed source. Record actual interface, exposed model metadata, input rights, prompt, output digest, review and rejected attempts. The accompanying `solution-kit/visual-recipes.md` supplies briefs for desktop concepts, mobile sequences, character workflows and constrained edits. Each concept must pass composition and interaction review before it becomes a customer-facing release.
