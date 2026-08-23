# Vendored schemas

These JSON Schema files are copied verbatim from the AI Capability Registry. They are
vendored so that the team profile in `team/` and the gate profiles in `gates/` can be
validated with no network access and no dependency on a private repository.

| File | Origin | Copied |
|---|---|---|
| `agent-team.schema.json` | `ai-capability-registry` · `registry/schema/agent-team.schema.json` | 2026-08-22 |
| `operating-excellence-gate.schema.json` | `ai-capability-registry` · `registry/schema/operating-excellence-gate.schema.json` | 2026-08-22 |
| `portable-profile-reference.schema.json` | `ai-capability-registry` · `registry/schema/portable-profile-reference.schema.json` | 2026-08-22 |

`portable-profile-reference.schema.json` is not a schema this plugin authors against
directly. It is vendored because `agent-team.schema.json` carries a relative `$ref` to
it from its `portable_contract` property, and `team/ai-architect-team.json` uses that
property to declare `independent_verifier: true`. Without the third file the `$ref`
cannot resolve.

## What validates against what

- `team/ai-architect-team.json` → `agent-team.schema.json`
- `gates/gate.*.json` → `operating-excellence-gate.schema.json`

## Base fields

Both schemas set `"additionalProperties": true` and list required fields that are not
defined inside the schema file itself: `id`, `name`, `type`, `source`, `status`,
`trust_level`, `apps`, `last_reviewed`. In the origin registry those are defined by
`capability.schema.json`, which is not vendored here because neither vendored schema
`$ref`s it. The instances in `team/` and `gates/` supply all of them, with values drawn
from the origin enumerations:

- `type`: one of `skill`, `plugin`, `connector`, `mcp_server`, `prompt_pack`, `workflow`, `app`, `device`, `script`, `site`, `other`
- `source`: one of `official_vendor`, `curated_remote`, `internal_custom`, `contractor_built`, `community`, `experimental`, `unknown`
- `status`: one of `active`, `watch`, `experimental`, `deprecated`, `retired`, `unknown`
- `trust_level`: one of `high`, `medium`, `low`, `unknown`
- `apps`: an object whose values are one of `installed`, `supported`, `reference_only`, `not_applicable`, `unknown`, `planned`

## Editing rule

Do not edit the three `.schema.json` files. If the origin changes, re-copy them and
update the copied dates in the table above.
