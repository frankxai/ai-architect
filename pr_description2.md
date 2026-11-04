Class: Docs

What changed:
Updated README.md and AGENTS.md to ensure all documented script invocations correspond to their entries in `package.json`.
- `node scripts/architect-conductor.mjs` was updated to `npm run conductor --`.
- `node scripts/build-team-json.mjs` was updated to `npm run team`.
- `node scripts/check-artifacts.mjs` was updated to `npm run artifacts --`.

Verification:
- The command `npm test` runs successfully, passing all 106 tests in `ai-architect`.
- Tested the modified documentation via manual code inspection.

Left alone:
- Did not modify `node scripts/install-cross-harness.mjs` and `node mcp/server.mjs`, as there are no corresponding scripts in `package.json` and modifying `package.json` falls outside the explicit "Docs only" requirement in the issue scope.

Risks:
- Low risk, docs-only changes.
