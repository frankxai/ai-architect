# How this repository connects to the rest of the estate

| surface | job | this repo's relationship |
|---|---|---|
| `frankxai/ai-architect` (this) | Installable team + gates + deploy kits | Source of truth for `/architect` |
| `frankxai/ai-coe` | Center-of-Excellence operating model, templates, agent cards | Consume this team's `SYSTEM.md` / `WORKFLOW.md` / `SOP.md` as the architecture track. Do not fork the plugin into ai-coe. Link here. |
| `frankxai/ai-architect-academy` | Labs and instructor engine | Labs exercise the same four decisions. Named-customer binaries do not belong in either public tree. |
| `frankxai/awesome-ai-coe` | Public catalog | List this plugin; do not copy files. |
| `frankxai/frankx.ai-vercel-website` | Public hub, review runner, atlas | Serves the review skill and the visual studio. Does not host an agent. |
| `frankxai/skills` | Cross-harness skill pack | `ai-architect-review` must stay byte-identical to `skills/ai-architect-review/SKILL.md` here. |

Sync rule: change the review skill here first, then copy to the website `public/skills/` and update `scripts/skill-parity.json`. Never the other way around unless the live site is the edited original and this repo is catching up — then pin the new hash in the same commit.

ai-coe update: add a pointer page that names this repository as the architecture lifecycle, and keep CoE artifacts (RACI, intake, operating reviews) in ai-coe. Two repos, one contract, no duplicated agent files.
