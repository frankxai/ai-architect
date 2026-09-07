import test from 'node:test';
import assert from 'node:assert/strict';
import { approvalFingerprint, createAuthorityBoundary } from './policy.mjs';

const now = 1000;
const principal = { id: 'agent-7', tenantId: 'tenant-a' };
const request = { grantId: 'grant-1', action: 'reserve', resource: 'budget-1', amountCents: 500, idempotencyKey: 'order-1', approvalId: 'approval-1' };
function fixture(approvalOverrides = {}) {
  return createAuthorityBoundary({
    balanceCents: 2000,
    grants: [{ id: 'grant-1', principalId: 'agent-7', tenantId: 'tenant-a', action: 'reserve', resource: 'budget-1', maxAmountCents: 1000, expiresAt: 2000 }],
    approvals: [{ id: 'approval-1', fingerprint: approvalFingerprint(request, principal), approvedBy: 'human-1', expiresAt: 1500, ...approvalOverrides }],
  });
}
test('exact approved request executes once and duplicate replays receipt', () => {
  const boundary = fixture();
  const first = boundary.execute(request, principal, now);
  const second = boundary.execute(request, principal, now);
  assert.equal(first.status, 'executed');
  assert.equal(second.status, 'replayed');
  assert.deepEqual(first.receipt, second.receipt);
  assert.equal(boundary.balance(), 1500);
});
for (const [name, proposal, actor, time, reason] of [
  ['cross tenant', request, { ...principal, tenantId: 'tenant-b' }, now, 'identity-mismatch'],
  ['impersonation', request, { ...principal, id: 'agent-8' }, now, 'identity-mismatch'],
  ['unknown grant', { ...request, grantId: 'made-up' }, principal, now, 'unknown-grant'],
  ['resource escalation', { ...request, resource: 'budget-2' }, principal, now, 'out-of-scope'],
  ['action escalation', { ...request, action: 'withdraw' }, principal, now, 'out-of-scope'],
  ['grant expiry boundary', request, principal, 2000, 'expired'],
  ['approval expiry boundary', request, principal, 1500, 'approval-required'],
  ['amount above grant', { ...request, amountCents: 1001 }, principal, now, 'invalid-amount'],
  ['negative amount', { ...request, amountCents: -1 }, principal, now, 'invalid-amount'],
  ['fractional amount', { ...request, amountCents: 0.1 }, principal, now, 'invalid-amount'],
  ['not a number', { ...request, amountCents: NaN }, principal, now, 'invalid-amount'],
  ['changed approved payload', { ...request, amountCents: 501 }, principal, now, 'approval-required'],
  ['fabricated approval', { ...request, approvalId: 'fabricated' }, principal, now, 'approval-required'],
  ['proposal carries authority', { ...request, approved: true }, principal, now, 'unknown-field'],
  ['empty replay key', { ...request, idempotencyKey: '' }, principal, now, 'invalid-request'],
]) {
  test(`${name} is denied without changing balance`, () => {
    const boundary = fixture();
    assert.deepEqual(boundary.execute(proposal, actor, time), { status: 'denied', reason });
    assert.equal(boundary.balance(), 2000);
  });
}
test('revocation applies even to an already executed replay key', () => {
  const boundary = fixture();
  boundary.execute(request, principal, now);
  boundary.revoke('grant-1');
  assert.equal(boundary.execute(request, principal, now).reason, 'revoked');
  assert.equal(boundary.balance(), 1500);
});
test('same replay key with different amount is a conflict', () => {
  const boundary = fixture();
  boundary.execute(request, principal, now);
  assert.equal(boundary.execute({ ...request, amountCents: 501 }, principal, now).reason, 'idempotency-conflict');
  assert.equal(boundary.balance(), 1500);
});
test('actor cannot approve its own action', () => {
  assert.equal(fixture({ approvedBy: principal.id }).execute(request, principal, now).reason, 'approval-required');
});
test('returned receipt cannot mutate stored evidence', () => {
  const boundary = fixture();
  const first = boundary.execute(request, principal, now);
  first.receipt.balanceCents = 0;
  assert.equal(boundary.execute(request, principal, now).receipt.balanceCents, 1500);
});
