# Chapter 10: Production release readiness and 48-hour provider exit drills

Pattern ID: `PAT-10` (Clean-room archive verification and 48-hour provider exit package)
Decision record: [`ADR-0010`](../../kit/adrs/ADR-0010.md)
Failure mode: `FM-10` (Broken buyer release archive outside git checkout or single-vendor lock-in)

[[PLAYBOOK_FIG_CH10_EXIT_DRILL]]

## 1. The architect's problem

The final mile of building a production agent system or technical kit is packaging it so that another team—or your own team six months from now on a different cloud or model provider—can install, verify, and run it cold without hidden tribal knowledge.

Two failure modes repeatedly break agent systems at release time:

1. **Works-in-monorepo, fails-in-archive (`FM-10a`):** The engineering team runs their test suite inside their development git checkout, where untracked local `.env` files, parent-directory helper scripts, or unshipped internal markdown documents sit on disk. Every test passes in git. When a customer downloads the packaged release archive and unzips it into a clean directory outside git, running the verification command immediately fails with `ENOENT: no such file or directory` because a shipped test or script referenced an internal file excluded from the package manifest.
2. **Single-vendor architectural lock-in (`FM-10b`):** A team builds their agent product around one model vendor's proprietary assistant threads API, stores their architecture diagrams only inside a closed SaaS whiteboard, and hardcodes one payment or cloud runtime without an adapter seam. When the model vendor deprecates that API with 30 days' notice or raises token prices, or when an enterprise customer requires running the stack on a different cloud (`Chapter 20`), the team faces a three-month rewrite.

Shipping a durable agent product requires a **Clean-Room Archive Verification Gate** and a **48-Hour Provider Exit Drill** built into the repository from day one.

## 2. Architecture pattern: `PAT-10` Clean-room archive verification and 48-hour provider exit package

### Context and forces

You are preparing an agent system or architecture kit for deployment or customer delivery. You must guarantee that every claim on the buyer surface maps to an exact `file:line` in the shipped package, that the packaged archive builds and passes its verification suite when extracted into an isolated `/tmp` directory outside git, and that your team can swap model providers, storage backends, or cloud runtimes within 48 hours using open, version-controlled artifacts.

### Structural solution

Combine a **Clean-Room Package Verifier** (`scripts/verify-agentic-architecture.mjs`) with a **Portable Exit Bundle** across four layers:

1. **Explicit Package Allowlist and Internal-Doc Separation:**
   Maintain a strict manifest of files that ship to the buyer versus internal planning/pricing notes. Shipped tests must either test only shipped files or explicitly skip internal-only doc checks when those files are absent in an extracted buyer archive.
2. **Single-Command Deterministic Verification (`verify-agentic-architecture.mjs`):**
   Provide one zero-network command (`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`) that executes every artifact in the package cold:
   - Parses and validates the Structurizr C4 DSL (`18` elements, `16` relationships) and all `4` Mermaid C4 views (`kit/c4/validate-c4.mjs`).
   - Lints all `10` Architecture Decision Records (`ADR-0001..0010`) for required sections, `PAT-XX`/`FM-XX` cross-links, and at least `3` concrete rejected alternatives with reasons (`kit/adrs/validate-adrs.mjs`).
   - Evaluates the `10` threat-to-test bindings and `3` workload cost models, and runs `ingestOtelTraceSpans` on the sample OpenTelemetry GenAI trace export (`kit/workbooks/evaluate-workbook.mjs`).
   - Boots the reference MCP server (`kit/mcp/reference-mcp-server.mjs`), verifying fail-closed startup without secrets, OAuth 2.1 RFC 8707 audience rejection, `<untrusted-content>` tag sanitization, path-containment blocking, and HMAC-SHA256 two-phase approval tokens bound to `tenantId` and `expiresAt`.
   - Executes the two-provider TypeScript supervisor (`kit/workflows/supervisor-maker-checker.ts`), verifying disjoint `writePaths`, cross-family Maker/Checker separation, subagent spawn blocking (`E_SUBAGENT_SPAWN_FORBIDDEN`), and the 80% budget ceiling.
3. **48-Hour Provider Exit Drill Checklist:**
   Every external dependency in the architecture is held behind an open-format artifact or adapter seam:
   - **Model provider exit (<2 hours):** Update the tier mapping in the capability router (`PAT-02`) from Provider A (`tier-b-balanced-builder` primary adapter) to Provider B (`tier-b-balanced-builder` secondary adapter), run `npm run evals` (`16/16` cases) and `verify-agentic-architecture.mjs`, and deploy.
   - **Diagram and ADR exit (0 hours - already open):** All C4 models live in plain-text Structurizr DSL (`.dsl`) and Mermaid (`.mmd`), and all decisions live in Markdown (`ADR-0001..0010.md`) inside git.
   - **Workflow and tool exit (<24 hours):** Tool boundaries run on the open MCP JSON-RPC 2.0 protocol (`S08`), and orchestration logic ships in both plain TypeScript (`supervisor-maker-checker.ts`) and portable n8n workflow JSON (`n8n-agentic-triage-and-approval.json`).

```
[Git Checkout] ---> [Package Release Archive] ---> [Extract to isolated /tmp dir]
                                                              |
                                                              v
                                     [Run verify-agentic-architecture.mjs cold]
                                     - 10 full chapters (>=1,000 prose words each)
                                     - C4 DSL (18 elements, 16 relations) + 4 Mermaid
                                     - 10 ADRs (>=3 rejected options each)
                                     - 10 Threat bindings + OTel span cost ingester
                                     - OAuth 2.1 MCP server + TS two-provider supervisor
```

### Release and exit invariants enforced by code

- **Every chapter is complete and boilerplate-free:** `verify-agentic-architecture.mjs` verifies that all 10 chapters exceed the full-depth word floor (`>= 950` non-code prose words each), contain zero broken control characters (`\t` or `\x0c`), and share zero duplicate boilerplate paragraphs across chapters.
- **Cross-platform CLI execution (`pathToFileURL`):** Every validator script (`verify-agentic-architecture.mjs`, `validate-c4.mjs`, `validate-adrs.mjs`, `evaluate-workbook.mjs`, and `reference-mcp-server.mjs`) uses `pathToFileURL(resolve(process.argv[1])).href === import.meta.url` so CLI execution works identically on Windows, macOS, and Linux.
- **Waitlist-first commercial guard:** `verify-agentic-architecture.mjs` verifies that `buyer-page/offer.facts.json` retains `price.state: "decision_required", amount: null, currency: "EUR"` and that `buyer-page/BUYER-PAGE-DRAFT.md` displays no unratified price.

## 3. Decision record template: `ADR-0010`

Full worked record: [`kit/adrs/ADR-0010.md`](../../kit/adrs/ADR-0010.md).

```markdown
# ADR-0010: Enforce clean-room archive verification and 48-hour provider exit drills

- **Status:** Accepted
- **Date:** 2026-10-24
- **Pattern:** PAT-10 (Clean-room archive verification and 48-hour provider exit package)
- **Mitigates:** FM-10 (Broken buyer release archive outside git checkout or single-vendor lock-in)

## Context
Teams often validate builds only inside their development git checkout and hardcode vendor-specific APIs or proprietary diagramming tools that prevent exiting a provider when terms or prices change.

## Decision
Verify every release package by running `verify-agentic-architecture.mjs` across all 10 chapters, C4 models, ADRs, workbooks, MCP servers, and workflows, and keep all architecture artifacts in open, script-validated formats (Structurizr DSL, Mermaid, Markdown ADRs, MCP JSON-RPC, TypeScript, and OpenTelemetry JSON).

## Alternatives Considered and Rejected
1. **Run test suites only inside the authoring monorepo checkout:** Rejected because tests that read unshipped internal files pass in git but fail with `ENOENT` when a buyer extracts the archive.
2. **Store C4 diagrams and ADRs in a proprietary SaaS whiteboard or wiki:** Rejected because diagrams cannot be code-reviewed in pull requests or validated by CI scripts.
3. **Open live checkout before running a clean-room package verification and test-mode rehearsal:** Rejected because broken archives or untested fulfillment loops erode buyer trust immediately.

## Verification Command
`node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`
```

## 4. Production failure mode: `FM-10`

### Failure story and trigger

A team packages a commercial developer kit and runs their test suite on Windows and Linux. Two bugs slip through: first, a shipped test reads an internal pricing document that was excluded from the buyer ZIP archive; second, the CLI entry-point check uses `if (import.meta.url === "file://" + process.argv[1])`, which works on Linux but evaluates to `false` on Windows because `process.argv[1]` uses backslashes (`C:\...`). Linux buyers hit `ENOENT` on the missing internal doc, and Windows buyers run the validator CLI and get zero output.

### Blast radius when unmitigated

Every buyer who downloads the archive on launch day encounters a broken test suite or a silent CLI, triggering immediate refund requests and public support issues.

### Detection telemetry

- Clean-room `/tmp` extraction test failing with `ENOENT`.
- Static check for `import.meta.url === \`file://\${process.argv[1]}\`` without `pathToFileURL(resolve(process.argv[1])).href`.
- `devendor-audit.mjs` catching employer-specific or customer-specific terms in shipped files.

### Deterministic mitigation

1. Use `pathToFileURL(resolve(process.argv[1])).href === import.meta.url` across every executable `.mjs` script in the kit.
2. Run `node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs` and `npm run devendor` (`0 hits across 370+ files`) before every push.

## 5. Worked implementation and red-team walkthrough

When you run `node --experimental-strip-types products/agentic-architecture/scripts/verify-agentic-architecture.mjs`, the script executes all seven verification stages in sequence and prints a deterministic JSON receipt:

1. **Chapters check:** Scans all 10 markdown files in `playbook/chapters/`, confirming `PAT-01..10`, `ADR-0001..0010`, `FM-01..10`, valid CMO visual placeholder tokens, `>= 950` non-code prose words per chapter, and zero control-character escapes.
2. **C4 check (`validateC4`):** Parses `kit/c4/agentic-system.dsl` (`18` elements, `16` relationships) and all `4` `.mmd` files.
3. **ADR check (`validateAdrs`):** Verifies `ADR-0000-template.md` and `ADR-0001..0010.md`, confirming at least `3` numbered rejected alternatives with concrete reasons per ADR.
4. **Workbook & OTel check (`evaluateWorkbook`):** Verifies all `10` threat-to-test bindings, computes all-attempts costs for all `3` workloads, and runs `ingestOtelTraceSpans` on `sample-otel-spans.json`.
5. **MCP server check:** Verifies `E_SERVER_UNCONFIGURED`, `E_OAUTH_AUDIENCE_MISMATCH`, `<untrusted-content>` tag stripping, `E_PATH_CONTAINMENT`, `pending_approval`, and HMAC-SHA256 `approvalToken` verification.
6. **Supervisor check:** Executes `runSupervisorPipeline` and `assertNoNestedSubagentSpawn` (`E_SUBAGENT_SPAWN_FORBIDDEN`).
7. **Buyer surface check:** Verifies `COMPETITIVE-BAR.md` references and confirms `offer.facts.json` (`price.state: "decision_required", amount: null, currency: "EUR"`) and `BUYER-PAGE-DRAFT.md` contain no displayed prices.

### Red-team verification checklist for chapter 10

- Copy `products/agentic-architecture` into an isolated `/tmp` directory and run `verify-agentic-architecture.mjs` cold; confirm it exits `0` and prints `state: "AGENTIC_ARCHITECTURE_PLAYBOOK_AND_KIT_VERIFIED"`.
- Add a dollar or euro price (`$99` or `EUR 149`) to `buyer-page/BUYER-PAGE-DRAFT.md` and confirm `verify-agentic-architecture.mjs` rejects the file.
- Run `npm run devendor` and confirm `0 hit(s)` across the entire repository.

## 6. Operational metrics and production rollout sequence

Running a quarterly 48-hour provider exit drill and clean-room archive check keeps your team's architecture portable before an external vendor crisis forces an emergency migration:

1. **Step 1 (Automated clean-room archive extraction on every release branch):** Package the deliverable into an archive, extract it into an isolated `/tmp` directory outside the git working tree, install dependencies from the frozen lockfile, and execute `verify-agentic-architecture.mjs`. Track `release.clean_room_verify_status` and `release.shipped_file_count` in the release receipt so no unshipped repository file is ever referenced by a shipped test.
2. **Step 2 (Model-seam failover rehearsal):** In staging, flip the `balanced-builder` and `frontier-reasoner` tier mappings in the capability seam (`PAT-02`) from the primary model family to the secondary model family, run the 16-case evaluation suite (`npm run evals`) and the 24-case grounding conformance suite (`npm run templates:answer`), and verify that total elapsed migration time stays under two hours with zero application code edits.
3. **Step 3 (Storage and workflow portability audit):** Export the active Structurizr C4 workspace (`agentic-system.dsl`), the 10 Markdown ADRs (`ADR-0001..0010.md`), the n8n workflow JSON (`n8n-agentic-triage-and-approval.json`), and a batch of OpenTelemetry GenAI spans (`sample-otel-spans.json`), confirming that a new engineer on a clean machine can reconstruct the entire architecture and cost model in one afternoon.
