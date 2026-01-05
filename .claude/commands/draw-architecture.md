# /draw-architecture - Generate D2 Architecture Diagrams

## Context
Generate professional architecture diagrams using D2 language.

## Usage
```
/draw-architecture [description of system]
```

## Workflow

### 1. Understand Requirements
- What system/component to visualize?
- What level of detail? (high-level, detailed, sequence)
- What cloud provider(s)?
- Any specific services to highlight?

### 2. Select Template Base
Check `templates/d2/` for existing templates:
- `oci-genai-rag.d2` - RAG architecture
- `multi-cloud-ai.d2` - Multi-cloud patterns
- `oci-gpu-cluster.d2` - GPU training
- `ai-gateway.d2` - Multi-provider routing
- `security-zones.d2` - Security architecture

### 3. Generate D2 Code
Structure the diagram with:
```d2
# Direction and styling
direction: right

# Cloud containers
aws: AWS {
  style.fill: "#FF9900"
}

oci: OCI {
  style.fill: "#F80000"
}

# Components inside containers
aws.bedrock: Bedrock
oci.genai: GenAI

# Connections with labels
aws.bedrock -> oci.genai: "failover"
```

### 4. Output Format
Provide:
1. D2 code in fenced block
2. Render command: `d2 --layout=tala diagram.d2 diagram.svg`
3. Brief explanation of architecture decisions

## D2 Quick Reference
```d2
# Containers (groups)
cloud: Cloud Provider { component1; component2 }

# Connections
a -> b: label
a <-> b: bidirectional
a -- b: no arrow

# Styling
node.style.fill: "#hexcolor"
node.style.stroke: "#hexcolor"
connection.style.stroke-dash: 3

# Icons (URL or path)
node.icon: https://icons.example.com/icon.svg
```

## Skills to Activate
- architecture-diagramming
