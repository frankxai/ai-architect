# /optimize-costs - AI Cost Optimization Review

## Context
Analyze and optimize AI infrastructure costs across cloud providers.

## Cost Review Framework

### 1. Current State Analysis
Gather:
- Monthly cloud spend breakdown
- Token/request volumes
- Model usage patterns
- Peak vs. off-peak usage

### 2. Optimization Strategies

#### Model Cascading
Route by complexity:
```
Simple queries -> Command Light ($)
Standard queries -> Command R ($$)
Complex queries -> Command R+ ($$$)
```

Potential savings: **30-50%**

#### Caching
- Semantic cache for similar queries
- Response cache for identical requests
- Embedding cache for repeated documents

Potential savings: **20-40%**

#### Batching
- Aggregate requests (100ms windows)
- Batch embeddings (up to 96 texts)
- Async processing for non-real-time

Potential savings: **10-20%**

#### Commitment Strategies
| Provider | Commitment Type | Discount |
|----------|-----------------|----------|
| OCI DAC | Reserved Units | 40-60% |
| Azure OpenAI | PTU | 30-50% |
| AWS Bedrock | Provisioned | 20-40% |
| OpenAI | Tier upgrades | Volume |

### 3. Multi-Cloud Arbitrage
Route to cheapest provider for task:
```
Embeddings -> Cohere (cheapest)
Simple chat -> Claude Haiku
Complex reasoning -> GPT-4 / Claude Opus
Code -> CodeLlama (self-hosted)
```

### 4. Infrastructure Optimization
- Right-size GPU instances
- Spot/preemptible for training
- Auto-scaling policies
- Region selection (price varies)

### 5. Output Format

```markdown
# Cost Optimization Report

## Current Monthly Spend: $XX,XXX

## Optimization Opportunities

| Strategy | Current | Optimized | Savings |
|----------|---------|-----------|---------|
| Model Cascading | $X | $Y | $Z (N%) |
| Caching | $X | $Y | $Z (N%) |
| Commitments | $X | $Y | $Z (N%) |

## Recommended Actions
1. [Priority 1 with ROI]
2. [Priority 2 with ROI]

## Projected Monthly Spend: $XX,XXX
## Total Savings: $X,XXX (N%)
```

## Quick Wins Checklist
- [ ] Enable semantic caching
- [ ] Implement model routing
- [ ] Review for unused resources
- [ ] Set up cost alerts
- [ ] Tag resources for attribution

## Skills to Activate
- finops-ai
- multi-cloud-ai-architect
