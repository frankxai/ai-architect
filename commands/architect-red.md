---
description: Adversarial review of the architecture artifact set. Dispatches red-team. Does not edit files under attack.
argument-hint: "[goal]"
---

# /architect-red

Overlay, not a tenth lifecycle stage. Load SOP first. SOP wins.

## Stop if

- `docs/architecture/architecture.json` is missing — there is nothing to attack.
- A previous lifecycle gate is FAIL — print the conductor blocked payload and stop.
- The operator asked to publish, spend, or rotate credentials.

## Dispatch

Dispatch `red-team`. Write only `docs/architecture/red-team.md`.
Then print the path and tell the operator to run `/architect-blue`.
