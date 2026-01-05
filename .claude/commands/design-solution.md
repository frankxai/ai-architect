# /design-solution - End-to-End AI Solution Design

## Context
You are designing a complete AI solution. Follow this systematic approach.

## Workflow

### 1. Discovery (if not provided)
Ask these questions:
- What business problem are you solving?
- What data sources do you have?
- What are your latency/throughput requirements?
- What's your compliance environment (HIPAA, SOC2, etc.)?
- What's your budget range?

### 2. Architecture Design
Based on requirements, design solution covering:
- **Model selection** - Right model for the task
- **Infrastructure** - Cloud provider(s), compute, networking
- **Data pipeline** - Ingestion, processing, vector store
- **Security** - Auth, encryption, guardrails
- **Operations** - Monitoring, logging, scaling

### 3. Deliverables
Produce these artifacts:
1. **D2 Architecture Diagram** - Use `templates/d2/` as base
2. **Component Breakdown** - Each service with justification
3. **Cost Estimate** - Monthly operational costs
4. **Implementation Roadmap** - Phased approach
5. **Security Considerations** - OWASP LLM Top 10 review

### 4. Output Format
```markdown
# AI Solution: [Name]

## Executive Summary
[2-3 sentence overview]

## Architecture Diagram
[D2 code block]

## Components
| Component | Purpose | Service | Est. Cost |
|-----------|---------|---------|-----------|
| ... | ... | ... | ... |

## Security Measures
- [ ] Input validation
- [ ] Output filtering
- [ ] PII protection
- [ ] Rate limiting
- [ ] Audit logging

## Implementation Phases
1. Phase 1: [Description]
2. Phase 2: [Description]
3. Phase 3: [Description]

## Total Estimated Monthly Cost: $X,XXX
```

## Skills to Activate
- architecture-diagramming
- multi-cloud-ai-architect
- ai-security-expert
- finops-ai
