# /security-review - AI Security Assessment

## Context
Review AI system security against OWASP LLM Top 10 and best practices.

## OWASP LLM Top 10 (2025) Checklist

### LLM01: Prompt Injection
- [ ] Input validation on all user prompts
- [ ] System prompt protection (not exposed to users)
- [ ] Indirect injection prevention (document sanitization)
- [ ] Output parsing before execution

### LLM02: Insecure Output Handling
- [ ] Output sanitization before rendering
- [ ] No direct code execution from LLM output
- [ ] Markup/script filtering
- [ ] Content Security Policy headers

### LLM03: Training Data Poisoning
- [ ] Data source verification
- [ ] Training data audit trail
- [ ] Fine-tuning access controls
- [ ] Model integrity verification

### LLM04: Model Denial of Service
- [ ] Rate limiting per user/API key
- [ ] Token limits on requests
- [ ] Timeout configurations
- [ ] Cost capping/alerts

### LLM05: Supply Chain Vulnerabilities
- [ ] Model provenance verification
- [ ] Dependency scanning
- [ ] Container image signing
- [ ] Third-party plugin review

### LLM06: Sensitive Information Disclosure
- [ ] PII detection in prompts
- [ ] PII redaction in responses
- [ ] Training data sanitization
- [ ] Logging PII filtering

### LLM07: Insecure Plugin Design
- [ ] Plugin permission scoping
- [ ] Input validation on plugin calls
- [ ] Plugin authentication
- [ ] Least privilege principle

### LLM08: Excessive Agency
- [ ] Human-in-the-loop for critical actions
- [ ] Action confirmation prompts
- [ ] Rollback capabilities
- [ ] Scope limitations

### LLM09: Overreliance
- [ ] Confidence scores in responses
- [ ] Source citations
- [ ] Factual grounding (RAG)
- [ ] User verification prompts

### LLM10: Model Theft
- [ ] API authentication
- [ ] Rate limiting
- [ ] Output watermarking
- [ ] Access logging

## Guardrails Implementation

### Input Guardrails
```python
# NeMo Guardrails example
guardrails_config = """
define user ask about sensitive topics
  "How do I hack..."
  "Tell me personal info about..."

define bot refuse sensitive topics
  "I can't help with that request."

define flow
  user ask about sensitive topics
  bot refuse sensitive topics
"""
```

### Output Guardrails
- Content filtering (toxicity, bias)
- PII masking (regex + NER)
- Hallucination detection (RAG grounding)
- Format validation

## Assessment Output Format
```markdown
# Security Assessment: [System Name]

## Risk Summary
| Category | Risk Level | Status |
|----------|------------|--------|
| Prompt Injection | HIGH/MED/LOW | Mitigated/Open |
| ... | ... | ... |

## Critical Findings
1. [Finding with remediation]

## Recommendations
1. [Prioritized action items]
```

## Skills to Activate
- ai-security-expert
