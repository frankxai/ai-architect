# Lab: authority before execution

A tool proposal is data. The application decides whether an authenticated principal may perform that exact action on that exact resource. This lab makes that distinction executable.

Run from the repository root with Node.js 22 or later:

```bash
node --test guide/labs/delegated-authority/policy.test.mjs
```

No API key, network, payment, customer data, or model is involved. The account and principal names are invented. The result measures deterministic policy behavior, not model quality or security certification.

## What the test proves

The proposed reservation must fit an unexpired grant owned by the authenticated principal and tenant. A separate approval record binds the actor, tenant, grant, action, resource, amount, and replay key. Unknown fields, changed payloads, self-approval, and excess amounts are denied before the in-memory balance changes. Revocation takes effect before replay handling. A duplicate accepted request returns the original receipt without a second mutation.

The grant and approval stores are trusted application inputs. The model cannot create records in either store. The authenticated principal and clock must come from the service, not the request body. A digest binds fields; it is not a signature and does not establish who approved them.

## Two-hour exercise

1. Run the tests and keep the result with your architecture decision record.
2. Add a malicious proposal for your own tool, including a changed resource and a cross-tenant identity.
3. Require a failed request to leave both state and effect count unchanged.
4. Trace where your real service obtains identity, grants, approvals, and time. If any come from model output, the exercise has found a boundary defect.
5. Record which parts need a transactional data store or external-service contract before production.

## Where this implementation stops

Everything lives in one synchronous process. Restarting it loses approvals, revocations, receipts, and balance. Multiple workers do not share the replay journal. There is no authentication, authorization server, cryptographic approval, human-approver role lookup, durable audit log, queue, or network service. Duplicate grant and approval IDs must be rejected by a production store. Per-action amount limits are not cumulative spending limits.

A real external action needs a transactional receipt strategy, an outbox or equivalent recovery design, downstream idempotency, reconciliation after uncertain responses, durable revocation, and independent security review. A database transaction by itself cannot guarantee an exactly-once effect at an unrelated service.

MCP's authorization specification supplies relevant protocol requirements [S09](../../research/sources.yaml). The binding and replay rules here are the guide's proposed application-level pattern, [C054](../../research/claims.yaml), not a claim that this lab implements MCP or OAuth.

## Assessment

Pass the exercise when your added tests demonstrate denial without mutation, replay without duplicate effects, and revocation before execution. Also identify at least three production gaps in this implementation. A green test run without those limitations is an incomplete submission.
