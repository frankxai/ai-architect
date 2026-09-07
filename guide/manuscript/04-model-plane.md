# 04. Model plane: buy capability, keep the exit

The model plane supplies capability to a product contract. It should make a model easy to replace and hard to change by accident.

Those goals pull in different directions. Fast-moving teams want the newest model. Operators want repeatable behavior. Finance wants a lower unit cost. Security may restrict providers, regions, training terms, or tools. Product needs a quality level on real work. The plane owner turns those demands into a procurement and release process.

## Route tasks, not prestige

Define task classes before model routes. A useful task profile includes:

- user and business outcome;
- input and output modes;
- maximum context and output size;
- tool and structured-output needs;
- latency target;
- quality floor and forbidden failures;
- data, region, and retention limits;
- cost ceiling per successful task.

Then evaluate approved model candidates on that profile. The route may use one model, a cheap default with a harder-case route, or a small portfolio split by modality. Keep the route visible in configuration and traces.

A model router should not infer business risk from prompt length alone. A short request to delete a tenant can be riskier than a long request to summarize a public report. Route on task class, policy class, observed difficulty, and budget.

## Keep one provider seam

Place provider-specific request formats, tool encodings, streaming events, usage fields, error types, and version names behind one owned seam. Above it, expose product tasks and a normalized run record. Below it, keep explicit adapters.

Do not erase real differences. If one model supports a mode that matters, represent that as a capability flag and test the fallback. A fake universal interface becomes dangerous when it silently drops reasoning controls, tool constraints, citations, or safety events.

A good seam answers:

- Which feature is portable?
- Which feature is provider-specific?
- What happens when the feature is absent?
- Which eval protects the behavior?
- How long would migration take?

## Aliases for exploration, snapshots for proof

Vendor aliases can move to a newer release. Dated model IDs hold behavior more steadily. xAI's documentation, for example, distinguishes moving aliases from date-pinned releases and recommends the latter when consistency matters. [S04](../research/sources.yaml)

Use moving aliases in discovery when the upside of fresh capability outweighs drift. Use a pinned model or recorded version for a production baseline, a regulated decision, or any result that must be reproduced. If a provider does not expose an immutable version, store the observed model ID and treat repeatability as limited.

Every model change needs a canary. Run capability cases to find gains, regression cases to protect known behavior, safety cases to test forbidden outcomes, and economics cases to catch cost or latency shifts. A global “better” model can still be worse on your tool schema or language mix.

## Price the successful outcome

Token price is only one term. Use this working formula:

`cost per success = (model + tools + infrastructure + review + failure recovery) / verified outcomes`

Long outputs, repeated tool calls, retries, evaluator calls, and human correction can dominate the headline model price. A model that costs more per token may cost less per successful task if it finishes in fewer turns with fewer corrections.

Track the distribution, not only the average. A small tail of looping runs can break the budget. Set per-run caps for tokens, time, tool calls, and attempts. Make the stop reason visible to the user and operator.

## Treat the 2026 catalog as dated data

On 2026-09-04, OpenAI documented GPT-6 Astra and a GPT-5.6 family with a wide price range; Anthropic documented Fable 5.1, Opus 5, Sonnet 5, and Haiku 4.5; Google listed several stable Gemini 3.x Flash models and preview models; xAI documented Grok 4.6. Context windows, output limits, tools, and prices differed. [S01](../research/sources.yaml) [S02](../research/sources.yaml) [S03](../research/sources.yaml) [S04](../research/sources.yaml)

That snapshot belongs in Appendix A, outside the core method. The architectural conclusion is an inference: vendor facts decay too quickly to carry the product boundary.

## Release evidence

The model-plane owner should be able to provide:

1. the approved model registry and exact versions;
2. the route for each task class;
3. the last capability, regression, safety, and cost report;
4. a trace showing the actual model selected;
5. the fallback and rollback test;
6. the next source and eval review date.

If the only evidence is a vendor announcement or a benchmark screenshot, model selection has not become architecture yet.
