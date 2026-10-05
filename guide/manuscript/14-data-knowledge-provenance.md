# 14. Data, knowledge, and provenance: know what the system knows

The context plane decides what a model sees during one run. This chapter covers the supply chain behind that context: where knowledge comes from, who may use it, how fresh it must be, how it leaves, and how a reader can trust an artifact the system produced.

Most AI incidents that look like model failures are data failures with a fluent surface. A retired policy stays in the index. A customer note crosses a tenant boundary. A poisoned page enters a crawl. An embedding store keeps records the business deleted months ago. The model reports all of it with the same confidence.

Joint government guidance now treats data supply-chain security, poisoning, drift, provenance, encryption, signatures, and trusted infrastructure as AI system concerns rather than storage details. [S24](../research/sources.yaml) C030

## Inventory before retrieval

Start with a knowledge inventory, not a vector store. For every source that can reach a model, record:

| Field | Question | Failure it prevents |
|---|---|---|
| owner | Who can correct or withdraw this source? | orphaned facts nobody can fix |
| rights basis | Why may this system read, embed, and quote it? | unlicensed or out-of-purpose use |
| classification | Which data class and tenant does it carry? | cross-tenant or cross-role leakage |
| freshness target | How old may a record be before it is wrong? | confident answers from retired policy |
| lineage | Which upstream system and transform produced it? | untraceable corrections |
| integrity | How is tampering detected? | poisoned or altered content |
| retention and deletion | When must copies, chunks, and embeddings go? | deleted data that still answers questions |
| drift signal | What shows that the source changed meaning? | slow decay of answer quality |

A source enters production only with a data contract that names its owner, rights basis, freshness target, and deletion rule. C055 Cloud vendor architecture guidance treats grounding data, data integration, and catalogs as part of the AI workload rather than a separate storage concern. [S32](../research/sources.yaml) [S34](../research/sources.yaml) C031

## Derived data is still data

Chunks, embeddings, summaries, caches, memory records, eval fixtures, and fine-tuning sets are copies. They inherit the obligations of the source and add their own failure modes.

Apply three rules:

1. **Deletion propagates.** When a source record is deleted or corrected, every derived copy is located and removed or rebuilt. Test this with a planted record before launch.
2. **Access is checked at read time.** An index built with broad credentials must still filter by the caller's entitlements when it returns results. Permission at indexing time is not permission at answer time.
3. **Memory has a write policy.** A record written by a model is untrusted until a rule accepts it. Store who wrote it, from which run, and why.

## Poisoning and drift

Treat every external or user-supplied source as potentially hostile. A poisoned document does not need to break the model. It only needs to be retrieved at the wrong moment with an instruction or a false fact.

Controls are layered. Allow-list ingestion sources. Record a content hash and signer where one exists. Quarantine new sources until a sample is reviewed. Keep retrieval results labeled with source and trust level all the way into the trace, so the policy layer in the tool plane can refuse an action that depends only on low-trust text.

Drift is quieter. A pricing table changes format, a product line is renamed, a policy is split into two documents. Monitor retrieval hit rates, citation coverage, and answer agreement on a frozen question set. A drop is a data incident even when no code changed.

## Bills of materials for knowledge

SPDX and CycloneDX define machine-readable structures for AI models, datasets, configurations, provenance, licensing, and related risk information. [S26](../research/sources.yaml) [S27](../research/sources.yaml) C033

Use them. A release that cannot list its datasets, corpora, and their licenses cannot answer a rights question or a deletion request with confidence. The [secure delivery chapter](15-identity-security-delivery.md) treats the same inventory as a release artifact.

## Provenance of what the system produces

Inbound provenance asks where knowledge came from. Outbound provenance asks whether a reader can trust what the system produced.

For text, cite source IDs and keep the context manifest with the trace. For generated or edited media where authenticity matters, such as news imagery, insurance evidence, identity documents, or brand assets, attach signed provenance. C2PA 2.4 defines cryptographically verifiable content provenance through assertions, signed claims, manifests, trust, and validation. [S37](../research/sources.yaml) C039

Validate the manifest before publication, not only at creation. A signature that nobody checks is decoration. C056

## Release evidence

A data and knowledge release is ready when the team can show:

- a knowledge inventory with owner, rights basis, freshness target, and deletion rule for every production source;
- a deletion test proving a removed record no longer appears in retrieval, memory, or cache;
- an entitlement test proving one tenant or role cannot retrieve another's records;
- a poisoning test where an injected source fails to cause a forbidden action;
- drift monitors on a frozen question set with an alert threshold and an owner;
- a machine-readable inventory of datasets and corpora shipped with the release;
- provenance validation for any generated media that is published under an authenticity claim.

If the inventory is missing, retrieval quality numbers describe a system nobody can correct.
