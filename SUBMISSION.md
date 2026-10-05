# Claude directory submission: ai-architect

Prepared 2026-10-06 against commit `5bd0748` of `main`. Status: staged. Nothing has been submitted, published or tagged. Frank submits from the developer portal.

## Sources and read dates

All read on 2026-10-06 from Anthropic's own pages (primary). The Terms and Policy pages were read through a summarising fetch tool, so clause wording below is as the tool returned it; read both pages once yourself before ticking the acknowledgements.

| Page | URL | Dated |
|---|---|---|
| Publish to the directory | https://claude.com/docs/directory/publish (short link https://clau.de/plugin-directory-submission redirects here) | no date shown |
| Plugin pre-submission checklist | https://claude.com/docs/plugins/pre-submission-checklist | no date shown |
| Submit your plugin | https://claude.com/docs/plugins/submit | no date shown |
| Software Directory Terms | https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms | last updated 2026-03-16 |
| Software Directory Policy | https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy | last updated 2026-04-15 |

The issue said the portal opened 2026-09-25 from a second-hand source. The primary pages show a live developer portal at https://claude.ai/directory/manage and give no opening date. Date: [OPEN].

## Requirements recorded

Who can submit: a claude.ai account on Pro, Max, Team or Enterprise (Free cannot). On Team and Enterprise an Owner submits, or a member with the Directory permission. The first organization to submit a repository folder holds the listing, so submit from the organization that should own it long term.

Process: GitHub repository (may be private while validating and submitting, must be public before the listing goes live), GitHub account connected on claude.ai with push access to the repo, then Validate, Listing details, Data handling, Compliance, Review and submit. Each version gets automated validation and a security scan. A person reviews a new listing before it goes live. By default an Anthropic reviewer publishes each passing version. Limit: 10 submissions per organization per 24 hours.

Blocking checks that apply to this bundle:

- `.claude-plugin/plugin.json` in the plugin folder.
- README of at least 40 words outside code blocks.
- A `LICENSE` file or `license` in `plugin.json`.
- Name of lowercase letters, digits and hyphens, not taken by another organization, not a reserved word, nothing implying "official".
- Files under 5 MiB each in the plugin folder, repository under 50 MiB archived, no symlinks, submodules or LFS pointers, no `.DS_Store` or `Thumbs.db`.
- Pinned versions for any `npx` or `uvx` launcher. No real credentials anywhere.

Held for a reviewer (not a rejection): `package.json` beside `package-lock.json` in the plugin root, files over 256 KiB that are not images or fonts, more than 512 files, binaries other than PNG, JPEG, GIF, WebP or fonts, a custom registry config file, local MCP servers started through a shell or inline program.

Policy points relevant here: software must not infringe others' IP; a privacy policy link is required if user data is collected; data collected should be only what the function needs; disallowed are software that moves money, serves ads or sponsored content, generates images, video or audio (design-workflow visual aids excepted), queries Claude's memory or chat history, or hides instructions. Developers must provide verified contact information, documentation, testing accounts with sample data and three working usage examples.

Seller and payment terms: the Terms page, as returned, grants Anthropic a non-exclusive, royalty-free, worldwide licence to reproduce, display and distribute descriptions and documentation of the software, plus use of the developer's name and branding to identify and promote it. It contains no fee, price, revenue-share or payout clause. The submitter indemnifies Anthropic, must keep quality and security standards, and Anthropic may remove any listing at any time for any reason without liability. Anthropic collects functional metadata about the software. No payment path through the directory is documented in the pages read. How a paid plugin would be sold there: [OPEN].

Screenshots: none of the three submit pages lists a screenshot or icon field. The portal builds the listing from `plugin.json` and the README. Screenshot requirement in the portal itself: [OPEN] until Frank opens the form. The list below is prepared anyway for the README and for any field the portal shows.

## Licence contradiction (reported, not resolved)

State on `main` at `5bd0748`:

| Place | Says |
|---|---|
| `LICENSE`, `NOTICE`, `LICENSING.md`, `.claude-plugin/plugin.json`, `package.json` | Apache-2.0 (adopted in PR #4, "Adopt Apache-2.0 and correct ownership") |
| `LICENSING.md` | Earlier revisions released under MIT stay under MIT |
| `skills/ai-architect-review/SKILL.md` front matter and last line | MIT |
| https://www.frankx.ai/ai-architect (read 2026-10-06) | "Get the skill (MIT)" and "It is MIT licensed" |
| `templates/deploy/durable-worker/package.json` | MIT |
| `templates/deploy/request-scoped-agent/package.json` | Apache-2.0 |
| `docs/reviews/2026-10-05-mcp-template-integration.md` | Says "Main already declares FSL". That sentence is about `frankxai/saas-ai-architect-academy`, not this repo |
| `frankxai/ai-architect-academy` and `frankxai/saas-ai-architect-academy` `LICENSING.md` / `LICENSE` | FSL-1.1-ALv2 (read 2026-10-06) |

So the "repo says FSL-1.1" premise in issue 10 does not hold for `frankxai/ai-architect`. FSL-1.1 is in the two Academy repos. Inside this repo the bundle is Apache-2.0 and the review skill plus one template carry a file-level MIT header, which `LICENSING.md` allows. The one visible mismatch is the skill and the public page saying MIT while the manifest says Apache-2.0.

Options for Frank (no choice made here):

1. Apache-2.0 for the whole bundle. Change the skill header and last line to Apache-2.0 and the frankx.ai page to match. Frank is the sole rights holder per `LICENSING.md`. Simple for reviewers; the MIT copies already distributed stay MIT.
2. Apache-2.0 for the bundle with a documented file-level MIT exception for `skills/ai-architect-review` and the durable-worker template. No content change; add one sentence to `README.md` and `LICENSING.md` naming the exception. The page and the manifest then agree once the exception is stated.
3. FSL-1.1-ALv2 for the bundle, matching the Academy repos. Requires a new `LICENSE`, `plugin.json` license value and a decision about already-published Apache-2.0 and MIT releases. FSL is source-available, not open source. The pages read do not state that the directory requires an OSI-approved licence; confirm in the portal. [OPEN]

Whichever is chosen, `plugin.json` `license` and the `LICENSE` file must agree before Validate.

## Employer-derived and third-party material (by location only)

`scripts/devendor-audit.mjs` is the repo's own gate for named employer and customer terms. It needs the `yaml` package to start; installing it was not done in this run, so the audit did not execute. Its pattern was run as a plain search instead over the whole tracked tree.

- `guide/research/sources.yaml` lines 287 to 298: two public vendor-documentation citations (S34, S35). The audit allow-lists these as source attribution. Decide whether a public listing should keep them. Flag only.
- `scripts/devendor-audit.mjs` lines 19, 28, 29: the pattern and the allow-list themselves.
- `NOTICE`: a trademark non-grant sentence naming third parties.
- `skills/trust-boundary/references/owasp-genai-llm-top10-2026.md`: a title-level table derived from the OWASP Gen AI Security Project list, with source and retrieval date. OWASP's licence for that list was not checked. [OPEN]
- `guide/` (55 files): the Guide 2026 manuscript, whose own review gate lists "final-book rights review pending" (`guide/editorial/review-gates.md`) and "Rights and content-license decision: pending" (`guide/releases/2026-0-1-draft.md`). It ships inside the plugin folder today because the plugin folder is the repository root. Moving the plugin into a subfolder, or keeping the guide out of the directory copy, is Frank's call. Not changed here.
- `guide/strategy/personal-book-brief.md` lines 110 to 114 and 162: employer-chronology planning rows. Planning text, not a claim. Flag only.

Nothing was deleted. No customer names from the audit pattern were found outside the files above.

## Bundle layout check

| Item | State on `5bd0748` |
|---|---|
| `.claude-plugin/plugin.json` | present, name `ai-architect`, version `0.1.3`, description, author, homepage, repository, license, keywords |
| README | `README.md`, 1507 words by whitespace count |
| LICENSE | present (Apache-2.0 text) |
| Plugin folder | repository root |
| Tracked files | 240 (limit before a reviewer hold: 512) |
| Largest-file check | no tracked file over 256 KiB; no binary extensions |
| Symlinks, submodules, LFS | none found |
| `claude plugin validate .` (Claude Code, 2026-10-06) | passed, one warning: root `CLAUDE.md` is not loaded as context |
| Repo checks `node scripts/validate-install.mjs` | 102 checks, 102 pass |
| Skill parity check | pass |
| Lockfile hold risk | `package.json` and `package-lock.json` sit at the root, which the checklist lists as held for a reviewer ("Dependencies install from a lockfile"). `package.json` has only a `yaml` devDependency and `"private": true` |
| `.mcp.json` / hooks | none; `mcp/server.mjs` is a local stdio server not wired into the manifest, so there is no MCP connector to submit |
| Name collision | not checkable without the portal. [OPEN] |

Staged in this PR: only this file. The layout already meets the structural requirements, so no manifest, README or LICENSE content changed. Candidate edits waiting on Frank's decisions: `displayName` in `plugin.json`, the licence alignment above, and a decision on the lockfile hold.

The claims audit on the README was not run as a separate tool: no estate claims-audit tool was reachable from this checkout. [OPEN] Two readings done by hand: the README says "no hosted agent and no account", and the repo's own devendor and parity checks pass. A person should still read the README against the Directory Policy (no ads, no money movement, no media generation) before submitting.

## Fields to enter

Portal step 1, Source:
- Repository: `frankxai/ai-architect`
- Plugin path: empty (root)
- Branch or tag: empty (default branch `main`) or a tag Frank chooses

Listing details (read from the repo, not typed): name `ai-architect`, description and author from `plugin.json`, README as the long description.

Data handling (draft answers from the repo; Frank confirms):
- Reads or stores personal data: the plugin reads repository files in the user's checkout and writes artifacts to `docs/architecture/`. It stores nothing outside that tree. Confirm. [OPEN]
- Sends data to services other than declared connectors: `mcp/server.mjs` header states "No model calls. No network sockets." The header is a comment; verify against the code before answering. [OPEN]
- Retention: nothing retained by the plugin beyond the files it writes in the user's repo.
- Intended for under 18: [OPEN], likely no.

Compliance: contact email Frank chooses (the repo shows `frank@frankx.ai` in `package.json`; confirm it is the one for Anthropic contact). Four acknowledgements: read the Terms and Policy first.

Review and submit: choose GitHub push webhook (default) or scheduled check only. Needs repo admin on GitHub for the webhook.

## Checklist for Frank

- [ ] Choose a licence option above; make `LICENSE`, `NOTICE`, `LICENSING.md`, `plugin.json` and the skill header agree
- [ ] Decide whether `guide/` ships in the directory copy
- [ ] Decide on the root lockfile (accept the reviewer hold, or remove `package-lock.json` from the plugin copy)
- [ ] Decide on the two Oracle source citations in `guide/research/sources.yaml`
- [ ] Check OWASP's licence for the Top 10 reference table
- [ ] Run `node scripts/devendor-audit.mjs` after installing `yaml` with the repo's lockfile
- [ ] Confirm the claims in the README against the Policy
- [ ] Repository must be public before the listing goes live
- [ ] Open https://claude.ai/directory/manage on a Pro, Max, Team or Enterprise account, connect GitHub, run Validate, clear every Blocks finding
- [ ] Prepare the Policy's three working usage examples and a testing account or sample data note (the examples in `examples/` are candidates: `contract-rag`, `personal-ai-coe`, `support-triage`)
- [ ] Answer Data handling, tick the four acknowledgements, submit

## Screenshots to capture

Not required by the pages read ([OPEN] in the portal). For the README and any listing image field:

1. `/architect` starting on a repository, showing the nine-stage plan.
2. A red gate stopping a run, with the failing check named.
3. The written artifact set under `docs/architecture/` in a file tree.
4. The independent verifier re-deriving an evidence pointer.
5. One finished example (`examples/contract-rag` or `examples/support-triage`) rendered as a document.

Capture on a real run; do not mock these.

## Short listing text (draft, from existing plugin.json)

A gated AI-architecture lifecycle for Claude Code. `/architect` runs a nine-stage agent team and writes an evidence-backed artifact set into your repository at `docs/architecture/`. A red gate stops the run. Runs on your own keys, with no hosted service and no account.
