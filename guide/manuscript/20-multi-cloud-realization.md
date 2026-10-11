# 20. One workload, many clouds

A customer rarely asks which cloud is best. They ask whether the research desk, the support agent or the invoice pipeline will work for them, what it will cost, and how long until the first result. The provider question comes second, and it usually arrives with history: an identity estate, a data platform, a contract with credits, a team that already operates one runtime. The architect's job is to answer the first question in a form that survives the second.

This chapter describes a working method and the catalog that carries it in this repository. The catalog holds seven workload patterns, each realized on Google Cloud, Vercel, Cloudflare, AWS, Azure and Railway. It is a design reference. Nothing in it is a deployment receipt.

## Model the workload before the vendor

Write each pattern as roles and flows. A role is a responsibility that every provider must fill: experience surface, identity, trusted API, model gateway, agent runtime, model, tool server, retrieval index, ingestion, operational store, object storage, queue, durable workflow, isolated execution, observability, evaluation and human review. A flow is a typed edge between two components: data, control or telemetry, with the data class it carries.

The customer job, the baseline and the accepted result sit at the top of the pattern in the customer's words. The request journey follows: an ordered list of steps, each naming the flows it uses, so the journey can be replayed on a canvas or emitted as a sequence diagram. Team lanes name what the customer, the AI, the system, the reviewer and the operator do, with the evidence each step leaves. Screens describe the states a person sees, including refusal and error, as structured blocks a renderer can draw.

Only then does a provider appear. A realization maps each component to a service from a registry, with every unmapped role falling back to the provider's default. C079 records the prescription: change the binding, not the design, when the provider changes. The compiler enforces it mechanically. A realization may not bind a component to another provider's service, the request journey must cover every flow, and every component must carry a flow.

## Names decay faster than designs

Provider naming changes inside a single planning cycle. Google renamed Vertex AI to Gemini Enterprise Agent Platform, with Vertex AI Search becoming Agent Search and Agent Engine becoming Agent Runtime, while RAG Engine kept its name (C078, S53). Any slide written in March would mislabel half the boxes by October. The service registry therefore records how each name was verified: from a dated source, as a long-standing name not re-read this edition, or inferred from a documented rename and waiting for confirmation. The compiler refuses to run once a source passes its review date. A realization lists every service in beta or with an inferred name, so an architect knows what to confirm before a customer reads it.

## Score after the constraints, not instead of them

Each realization carries six scores from one to five: performance, time to value, speed to execution, cost per accepted result, exit cost and governance fit. Each set of scores has a written rationale. These are judgements, recorded so they can be challenged, and they are not benchmarks.

Hard constraints come first and remove options outright. Residency, data rights, the identity estate, latency, the operating owner and the budget envelope decide which providers remain feasible. Scores compare what survives. C080 states the order, and the catalog keeps the provider ledger separate: each provider lists its consumption drivers, the meters that grow with the workload. Those drivers are presented after the customer choice. A provider's consumption opportunity is a legitimate interest of the provider's team. It never raises a customer score.

The customer ledger is computed from stated assumptions: eligible tasks, adoption, acceptance, minutes saved and value per hour on one side; run cost for every attempt and fixed monthly cost on the other. Cost is charged to attempts, not to accepted results, so failed runs count. The result is a cost per accepted result, which is the number a customer should compare across providers. Every pattern states that its figures are illustrative until a pilot measures them.

## Views from one source

The compiler emits, for every pattern and provider, a React Flow document, a Mermaid flowchart grouped by layer, a diagrams.net file and an SVG; and per pattern, a Mermaid sequence of the journey and a Structurizr workspace in which every provider is a deployment environment (S57). Component and flow identifiers are identical in all of them. C082 records why that matters: a reviewer who finds a problem in the deployment view can name the same component in the code, the trace and the incident report.

Each view was checked with the tool that consumes it, not only by inspection. Every Mermaid file parses and renders in Mermaid 12.1. Every Structurizr workspace parses in the Structurizr DSL library 6.2.3, which rejected the first version of the generator because single-line element blocks are not valid DSL. The SVG embeds the four official Google Cloud icons only where a Google service uses one, verified by hash; every other node uses an original role glyph, and the footnote says which applies.

## Prove portability with one contract

A multi-cloud claim is cheap until the same behaviour runs on more than one runtime. The repository carries three deploy templates that implement one answer contract: a question goes in, an answer comes back in which every sentence cites a retrieved passage, or the service refuses. One template runs on Vercel Functions with AI SDK 7 through AI Gateway (S56). One runs on a Cloudflare Worker with Workers AI through the AI binding and AI Gateway (S58). One runs on Cloud Run with Gemini on Agent Platform. A shared conformance suite sends the same requests to all three adapters with faked model calls and checks status codes, citations, refusals, token enforcement, oversize bodies and redacted provider errors. C083 states the rule: portability is demonstrated by one suite passing against every adapter, not asserted by a diagram.

Running the Cloudflare template in the local Workers runtime found a defect the unit tests could not: the entry module exported constants, which the runtime rejects as entrypoints. The fix moved the adapter into its own module. A deploy button would have failed for the first person who clicked it.

## A deploy button is a reproducible start, not a receipt

Each template has a one-click path. Deploy to Cloudflare accepts a repository subdirectory that must be self-contained and provisions Workers AI automatically (C081, S54). Cloud Run Button accepts a repository, a revision and a subdirectory, and runs declared hooks such as enabling the model API (S55). Vercel clones a directory into a new project, and on Vercel the function authenticates to AI Gateway with the project's identity token instead of a stored key (C084, S56).

None of this makes a template provider-tested. The templates are local-tested: their suites pass, the Vercel adapter ran through the installed AI SDK with a mock model, the Worker served real requests in the local runtime, and the Cloud Run server answered locally. A provider-tested claim needs a deployment on the named provider, a live model call, recorded cost and a teardown. Until then the catalog says so beside every button.

## What the architect hands over

For a customer conversation the architect brings one pattern, three or four realizations that survived the customer's constraints, the scores with their reasons, the customer ledger beside the provider ledger, the views the customer's engineers will open in their own tools, and, where one exists, a template the customer can deploy into their own account within minutes. The design is the deliverable. The receipts come later, from the customer's environment, and they belong to the customer.
