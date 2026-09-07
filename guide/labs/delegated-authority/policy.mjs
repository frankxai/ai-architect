import { createHash } from 'node:crypto';

// Teaching implementation: all records live in one process. The caller supplies
// authenticated identity; a model may propose request data, never this context.
export function approvalFingerprint(request, principal) {
  return createHash('sha256').update(JSON.stringify([
    principal.id, principal.tenantId, request.grantId, request.action,
    request.resource, request.amountCents, request.idempotencyKey,
  ])).digest('hex');
}

export function createAuthorityBoundary({ grants, approvals, balanceCents }) {
  if (!Number.isSafeInteger(balanceCents) || balanceCents < 0) throw new Error('invalid balance');
  const grantStore = new Map(structuredClone(grants).map((grant) => [grant.id, grant]));
  const approvalStore = new Map(structuredClone(approvals).map((approval) => [approval.id, approval]));
  const receipts = new Map();
  const revoked = new Set();
  let balance = balanceCents;

  return {
    revoke(grantId) { revoked.add(grantId); },
    balance() { return balance; },
    execute(request, principal, now) {
      const deny = (reason) => ({ status: 'denied', reason });
      if (!request || !principal || !Number.isSafeInteger(now)) return deny('invalid-context');
      // Exact input vocabulary prevents a proposal carrying its own authority.
      const fields = ['grantId', 'action', 'resource', 'amountCents', 'idempotencyKey', 'approvalId'];
      if (Object.keys(request).some((field) => !fields.includes(field))) return deny('unknown-field');
      if (fields.some((field) => field !== 'amountCents' &&
          (typeof request[field] !== 'string' || request[field].length < 1 || request[field].length > 200))) return deny('invalid-request');
      const grant = grantStore.get(request.grantId);
      if (!grant) return deny('unknown-grant');
      if (principal.id !== grant.principalId || principal.tenantId !== grant.tenantId) return deny('identity-mismatch');
      if (revoked.has(grant.id)) return deny('revoked');
      if (!Number.isSafeInteger(grant.expiresAt) || now >= grant.expiresAt) return deny('expired');
      if (request.action !== grant.action || request.resource !== grant.resource) return deny('out-of-scope');
      if (!Number.isSafeInteger(request.amountCents) || request.amountCents <= 0 ||
          !Number.isSafeInteger(grant.maxAmountCents) || request.amountCents > grant.maxAmountCents) return deny('invalid-amount');

      const fingerprint = approvalFingerprint(request, principal);
      const key = JSON.stringify([principal.tenantId, principal.id, request.idempotencyKey]);
      const previous = receipts.get(key);
      if (previous) return previous.fingerprint === fingerprint
        ? { status: 'replayed', receipt: structuredClone(previous) }
        : deny('idempotency-conflict');
      const approval = approvalStore.get(request.approvalId);
      if (!approval || approval.fingerprint !== fingerprint || approval.approvedBy === principal.id ||
          typeof approval.approvedBy !== 'string' || !approval.approvedBy ||
          !Number.isSafeInteger(approval.expiresAt) || now >= approval.expiresAt) return deny('approval-required');
      if (request.amountCents > balance) return deny('insufficient-balance');

      // Synchronous effect and receipt are atomic only within this process.
      balance -= request.amountCents;
      const receipt = { id: `receipt-${receipts.size + 1}`, fingerprint, balanceCents: balance, executedAt: now };
      receipts.set(key, receipt);
      return { status: 'executed', receipt: structuredClone(receipt) };
    },
  };
}
