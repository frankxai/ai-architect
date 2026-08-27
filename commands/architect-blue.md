---
description: Map each red-team finding to a fail-closed control. Dispatches blue-team. Does not patch application source.
argument-hint: "[goal]"
---

# /architect-blue

Overlay. Load SOP first. SOP wins.

## Stop if

- `docs/architecture/red-team.md` is missing — run `/architect-red` first.
- A human gate would be crossed to "just fix it".

## Dispatch

Dispatch `blue-team`. Write only `docs/architecture/blue-team.md`.
