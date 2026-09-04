# 13. Ninety-day adoption: turn the method into operating practice

The guide becomes useful when it changes a live architecture review.

Start with one production or near-production system that has a real operator, measurable value, and at least one consequential failure. Do not begin with a company-wide council or a catalog of every experiment. One bounded system will expose the missing contracts faster.

## Days 1 to 30: expose the decisions

### Week 1: name the outcome

Write one sentence describing the user and business state the system must create. Add non-goals and a falsifiable kill criterion. Name the accountable product owner and operator.

Collect the current diagram, prompts, model settings, tools, data sources, evals, traces, cost records, policies, runbooks, and incident notes. Missing artifacts are findings.

### Week 2: run the four-decision review

For each decision, record `MADE` or `OPEN`, owner, evidence pointer, and review date:

- model-provider seam;
- loop shape;
- trust boundary;
- long-run home.

When several are open, work in blast-radius order: trust, long-run home, loop, model seam.

### Week 3: assign the seven planes

Put one accountable owner against model, context, tools, orchestration, evaluation, observability, and experience. Ask each owner for the last current artifact and runtime signal they produced.

Use the plane matrix from the labs. Do not accept shared ownership without one final decision maker.

### Week 4: publish the decision pack

Create the system record: outcome, four decisions, plane owners, user flows, state model, trust boundary, cost model, eval plan, and runbook gaps. Keep it next to the code. Open decisions carry a date and cost of delay.

**Day-30 proof:** a reviewer can identify the first irreversible action, its policy gate, state owner, evidence, and recovery path.

## Days 31 to 60: build the evidence loop

### Weeks 5 and 6: create the task bank

Start with ten to twenty cases drawn from common work, costly edge cases, prior failures, and policy denials. Define starting state, required end state, forbidden state, source fixtures, trial count, and budget.

Grade outcome, path, safety, and economics. Use deterministic checks first. Add a model rubric only for qualities that code cannot judge, then calibrate it against a named human.

### Week 7: instrument the decision trace

Join task, exact model, context sources, policy, tool, state, outcome, latency, cost, and user events under one trace. Add redaction and retention by field class.

Write incident queries before dashboards. Prove that an operator can find a tool commit after cancellation, a completion without a verified state, a stale source, a repeated idempotency key, and a cost regression.

### Week 8: inject failure

Kill a worker after a tool commits. Lose the response. Deliver approval twice. Expire approval. Poison a source. Deny access. Exhaust the model budget. Change policy during a pause. Make the provider unavailable.

Fix the first boundary that fails. Turn each material failure into a regression case.

**Day-60 proof:** the team can reproduce a bad run, point to its first wrong state, recover safely, and prevent the same class through a test.

## Days 61 to 90: earn release authority

### Weeks 9 and 10: compare the next simpler design

Run the same bank on the chosen loop and the next simpler loop. Compare successful outcomes, serious failures, p95 latency, tokens, tool calls, total cost, and human correction time.

Remove agents, tools, context, and routes that do not buy measured value. Add autonomy only where the task path or context genuinely requires it.

### Week 11: establish change control

Define canaries and rollback triggers for models, prompts, adapters, tools, policies, retrieval, and orchestration. Set evidence review dates by half-life. A model catalog may need monthly review. A stable internal prescription may need a six-month challenge.

No material change ships without its affected eval slice and version record.

### Week 12: run independent verification

Give a fresh reviewer the repository, source ledger, claims, commands, and release criteria. Do not give them the drafting conversation. Ask them to reopen sources, rerun checks, sample claims, test evidence pointers, and record disagreement.

The accountable author resolves findings and decides whether to release.

**Day-90 proof:** one tagged architecture package contains decisions, owners, task bank, traces, cost model, runbook, verifier receipt, and known limits.

## The authority program

Public authority should follow the same evidence cycle as the product.

For each major pattern:

1. state the architectural claim;
2. publish a reusable template or small reference design;
3. publish the test and the conditions;
4. record the result and limit;
5. invite a reproducible challenge;
6. issue a versioned correction when evidence changes.

One pattern can produce a guide chapter, lab, architecture review, conference talk, case note, Academy lesson, and search page. All projections point back to the same canonical claim and release.

Avoid volume without proof. A weekly opinion about models decays quickly. A decision record, adversarial case, cost comparison, and verifier receipt remain useful after the model name changes.

## Quarterly review

Every quarter, ask:

- Which decision has the shortest remaining half-life?
- Which plane has an owner but weak evidence?
- Which production correction has no regression case?
- Which expensive route has no comparison with a simpler design?
- Which tool holds more authority than its task needs?
- Which public claim needs a correction or narrower wording?

The aim is not architectural permanence. The aim is controlled change with a record that another expert can inspect.
