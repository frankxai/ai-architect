# MCP Servers Guide for AI Architects

## Recommended MCP Server Stack

This guide covers the essential MCP servers for an AI Architect workflow, focusing on infrastructure management, documentation, and enterprise integration.

## Tier 1: Essential Servers

### 1. GitHub MCP Server
**Purpose:** Repository management, code search, PR workflows

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

**Use Cases:**
- Search codebases for architecture patterns
- Create/review PRs for IaC changes
- Manage issues for architecture decisions
- Access GitHub Actions for CI/CD

### 2. PostgreSQL/Database MCP Server
**Purpose:** Database access for architecture metadata

```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "postgresql://user:pass@host:5432/db"
    }
  }
}
```

**Use Cases:**
- Query model registry
- Access cost tracking data
- Retrieve deployment history
- Architecture decision records

### 3. Filesystem MCP Server
**Purpose:** Local file access for Terraform, configs

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/projects"]
  }
}
```

**Use Cases:**
- Read/write Terraform files
- Access architecture documents
- Manage configuration files
- Generate reports

## Tier 2: Cloud Infrastructure Servers

### 4. OCI MCP Server (Custom)
**Purpose:** Oracle Cloud Infrastructure management

```json
{
  "oci": {
    "command": "python",
    "args": ["-m", "oci_mcp_server"],
    "env": {
      "OCI_CONFIG_FILE": "~/.oci/config",
      "OCI_CONFIG_PROFILE": "DEFAULT"
    }
  }
}
```

**Capabilities to Build:**
- List/manage compute instances
- GenAI cluster management
- Object storage operations
- Networking configuration
- Cost reporting

### 5. Terraform MCP Server (Custom)
**Purpose:** Infrastructure as Code operations

```json
{
  "terraform": {
    "command": "python",
    "args": ["-m", "terraform_mcp_server"],
    "env": {
      "TF_WORKSPACE_DIR": "/path/to/terraform"
    }
  }
}
```

**Capabilities:**
- terraform plan (preview changes)
- terraform apply (with confirmation)
- State inspection
- Module management
- Cost estimation

## Tier 3: Documentation & Knowledge

### 6. Notion MCP Server
**Purpose:** Architecture documentation management

```json
{
  "notion": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-notion"],
    "env": {
      "NOTION_API_KEY": "${NOTION_TOKEN}"
    }
  }
}
```

**Use Cases:**
- Access architecture decision records
- Update project documentation
- Query knowledge bases
- Manage runbooks

### 7. Confluence MCP Server (Custom)
**Purpose:** Enterprise documentation

```json
{
  "confluence": {
    "command": "python",
    "args": ["-m", "confluence_mcp_server"],
    "env": {
      "CONFLUENCE_URL": "https://company.atlassian.net",
      "CONFLUENCE_TOKEN": "${CONFLUENCE_TOKEN}"
    }
  }
}
```

## Tier 4: Monitoring & Operations

### 8. Datadog/Grafana MCP Server (Custom)
**Purpose:** Monitoring and observability

```json
{
  "monitoring": {
    "command": "python",
    "args": ["-m", "monitoring_mcp_server"],
    "env": {
      "DATADOG_API_KEY": "${DD_API_KEY}",
      "GRAFANA_URL": "https://grafana.company.com"
    }
  }
}
```

**Capabilities:**
- Query metrics
- Create dashboards
- Set up alerts
- Incident management

### 9. Linear/Jira MCP Server
**Purpose:** Project and issue tracking

```json
{
  "linear": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-linear"],
    "env": {
      "LINEAR_API_KEY": "${LINEAR_TOKEN}"
    }
  }
}
```

## Complete Configuration

### Claude Desktop Config
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/c/Users/Frank/claude-ai-architect",
        "/mnt/c/Users/Frank/terraform-projects"
      ]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${POSTGRES_URL}"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Claude Code Config
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ${NOTION_TOKEN}\", \"Notion-Version\": \"2022-06-28\"}"
      }
    }
  }
}
```

## Custom MCP Server: OCI Infrastructure

### Server Implementation
```python
# oci_mcp_server/__main__.py
from mcp import Server
import oci

server = Server("oci-infrastructure")
config = oci.config.from_file()

# Compute Client
compute_client = oci.core.ComputeClient(config)

# GenAI Client
genai_client = oci.generative_ai.GenerativeAiClient(config)

@server.tool()
async def list_gpu_instances(compartment_id: str) -> list:
    """List all GPU instances in a compartment."""
    instances = compute_client.list_instances(compartment_id).data
    gpu_instances = [i for i in instances if "GPU" in i.shape]
    return [
        {
            "id": i.id,
            "name": i.display_name,
            "shape": i.shape,
            "state": i.lifecycle_state
        }
        for i in gpu_instances
    ]

@server.tool()
async def list_genai_clusters(compartment_id: str) -> list:
    """List Dedicated AI Clusters."""
    clusters = genai_client.list_dedicated_ai_clusters(compartment_id).data
    return [
        {
            "id": c.id,
            "name": c.display_name,
            "type": c.type,
            "units": c.unit_count,
            "state": c.lifecycle_state
        }
        for c in clusters
    ]

@server.tool()
async def get_genai_endpoints(cluster_id: str) -> list:
    """List endpoints on a GenAI cluster."""
    endpoints = genai_client.list_endpoints(
        dedicated_ai_cluster_id=cluster_id
    ).data
    return [
        {
            "id": e.id,
            "name": e.display_name,
            "model": e.model_id,
            "state": e.lifecycle_state
        }
        for e in endpoints
    ]

@server.resource("oci://costs")
async def get_cost_summary() -> dict:
    """Get OCI cost summary for AI services."""
    # Implementation using OCI Cost Analysis API
    pass

if __name__ == "__main__":
    server.run()
```

## Custom MCP Server: Terraform Operations

### Server Implementation
```python
# terraform_mcp_server/__main__.py
from mcp import Server
import subprocess
import json
import os

server = Server("terraform")

@server.tool()
async def terraform_plan(workspace_dir: str) -> dict:
    """Run terraform plan and return summary."""
    result = subprocess.run(
        ["terraform", "plan", "-json", "-no-color"],
        cwd=workspace_dir,
        capture_output=True,
        text=True
    )

    # Parse plan output
    changes = {"add": 0, "change": 0, "destroy": 0}
    for line in result.stdout.split('\n'):
        if line:
            data = json.loads(line)
            if data.get("type") == "planned_change":
                action = data["change"]["action"]
                if action == "create":
                    changes["add"] += 1
                elif action == "update":
                    changes["change"] += 1
                elif action == "delete":
                    changes["destroy"] += 1

    return {
        "success": result.returncode == 0,
        "changes": changes,
        "output": result.stdout if result.returncode == 0 else result.stderr
    }

@server.tool()
async def terraform_state_list(workspace_dir: str) -> list:
    """List resources in Terraform state."""
    result = subprocess.run(
        ["terraform", "state", "list"],
        cwd=workspace_dir,
        capture_output=True,
        text=True
    )
    return result.stdout.strip().split('\n')

@server.tool()
async def terraform_output(workspace_dir: str) -> dict:
    """Get Terraform outputs."""
    result = subprocess.run(
        ["terraform", "output", "-json"],
        cwd=workspace_dir,
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

@server.resource("terraform://modules")
async def list_modules(workspace_dir: str) -> list:
    """List available Terraform modules."""
    modules_dir = os.path.join(workspace_dir, "modules")
    if os.path.exists(modules_dir):
        return os.listdir(modules_dir)
    return []

if __name__ == "__main__":
    server.run()
```

## Best Practices

### Security
```yaml
DO:
  - Store credentials in environment variables
  - Use scoped API tokens (minimal permissions)
  - Rotate credentials regularly
  - Audit MCP server access logs

DON'T:
  - Hardcode credentials in config
  - Use admin tokens for read-only tasks
  - Share credentials across environments
  - Expose MCP servers to public networks
```

### Performance
```yaml
Caching:
  - Cache frequent API responses
  - Use TTL appropriate for data freshness
  - Implement stale-while-revalidate

Batching:
  - Combine related API calls
  - Use bulk endpoints when available
  - Paginate large result sets

Rate Limiting:
  - Respect API rate limits
  - Implement exponential backoff
  - Queue requests during limits
```

### Reliability
```yaml
Error Handling:
  - Return clear error messages
  - Implement retries with backoff
  - Handle partial failures gracefully

Logging:
  - Log all tool invocations
  - Include request/response metadata
  - Track latency and errors

Health Checks:
  - Implement health endpoints
  - Monitor server availability
  - Alert on failures
```

## Recommended GitHub Repositories

### Official MCP Servers
- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - Official MCP servers

### Community Servers
- [awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) - Curated list
- [mcp-server-registry](https://github.com/mcp-community/registry) - Community registry

### AI Agent Frameworks
- [anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) - Claude examples
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain) - LangChain framework
- [run-llama/llama_index](https://github.com/run-llama/llama_index) - LlamaIndex
- [microsoft/autogen](https://github.com/microsoft/autogen) - AutoGen framework
- [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) - CrewAI

### Infrastructure Tools
- [hashicorp/terraform](https://github.com/hashicorp/terraform) - Infrastructure as Code
- [oracle/oci-python-sdk](https://github.com/oracle/oci-python-sdk) - OCI SDK
- [oracle/terraform-provider-oci](https://github.com/oracle/terraform-provider-oci) - OCI Terraform

## Installation Commands

```bash
# Install official MCP servers
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-memory

# Install community servers
npm install -g @notionhq/notion-mcp-server

# For custom Python servers
pip install mcp oci anthropic
```

## Testing MCP Servers

```bash
# Test with Claude Code debug mode
claude --mcp-debug

# Check server status
/mcp-status

# List available tools
# (invoke through Claude conversation)
```
