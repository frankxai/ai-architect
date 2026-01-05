# /build-rag - Build RAG System

## Context
Design and implement a Retrieval-Augmented Generation system.

## Workflow

### 1. Requirements Gathering
- **Data sources**: Documents, APIs, databases?
- **Volume**: How many documents? Update frequency?
- **Query patterns**: Semantic search, hybrid, filters?
- **Latency requirements**: Real-time or batch?
- **Security**: Access control, PII handling?

### 2. Architecture Selection

#### OCI GenAI Agents (Managed)
Best for: Quick deployment, OCI-native
```
Documents -> OCI Object Storage -> GenAI Agent -> Knowledge Base
                                       |
                                   RAG Tool -> User Queries
```

#### Custom RAG Stack
Best for: Full control, multi-cloud
```
Documents -> Chunking -> Embeddings -> Vector DB
                              |
User Query -> Embeddings -> Similarity Search -> Context
                                                    |
                                              LLM -> Response
```

### 3. Component Selection

| Component | OCI Option | Alternatives |
|-----------|------------|--------------|
| Vector Store | OCI OpenSearch | Pinecone, Weaviate, Qdrant |
| Embeddings | Cohere Embed | OpenAI, HuggingFace |
| LLM | Command R+ | Claude, GPT-4, Llama |
| Orchestration | GenAI Agents | LangChain, LlamaIndex |

### 4. Implementation

#### Chunking Strategy
```python
# Recommended settings
chunk_size = 512  # tokens
chunk_overlap = 50  # tokens
separators = ["\n\n", "\n", ". ", " "]
```

#### Retrieval Tuning
```python
# Hybrid search recommended
retrieval_config = {
    "top_k": 5,
    "similarity_threshold": 0.7,
    "rerank": True,  # Use Cohere Rerank
    "hybrid_alpha": 0.5  # Balance semantic/keyword
}
```

### 5. Deliverables
1. Architecture diagram (D2)
2. Implementation code
3. Terraform for infrastructure
4. Evaluation metrics setup
5. Cost estimate

## Skills to Activate
- rag-expert
- genai-dac-specialist
- architecture-diagramming
