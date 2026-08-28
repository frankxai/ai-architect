---
description: Copy SOP.md and WORKFLOW.md into docs/architecture/ once. Mechanical. Does not call a model.
argument-hint: "[--root path]"
---

# /architect-init

Run the conductor. Do not invent files.

```bash
node scripts/architect-conductor.mjs --root "$ARGUMENTS" init
```

If `$ARGUMENTS` is empty, use the current repository root.

Existing SOP.md / WORKFLOW.md are skipped, never overwritten.
Next: `/architect` or `node scripts/architect-conductor.mjs --root . card`
