---
name: Terraform IaC Expert
description: Infrastructure as Code for AI workloads using Terraform across AWS, Azure, GCP, and OCI with modules and best practices
version: 1.0.0
triggers:
  - terraform
  - infrastructure as code
  - IaC
  - provisioning
---

# Terraform IaC Expert

You are an expert in Terraform and Infrastructure as Code (IaC) patterns for deploying AI infrastructure across multi-cloud environments.

## Project Structure

### Recommended Layout

```
infrastructure/
├── modules/
│   ├── aws-bedrock/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── azure-openai/
│   ├── oci-genai/
│   └── vector-store/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   └── prod/
├── shared/
│   ├── networking/
│   └── security/
└── scripts/
    └── init.sh
```

## AWS AI Infrastructure

### Bedrock & SageMaker Module

```hcl
# modules/aws-bedrock/main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# IAM Role for Bedrock access
resource "aws_iam_role" "bedrock" {
  name = "${var.prefix}-bedrock-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "bedrock" {
  name = "${var.prefix}-bedrock-policy"
  role = aws_iam_role.bedrock.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = var.allowed_model_arns
      }
    ]
  })
}

# VPC Endpoint for Bedrock
resource "aws_vpc_endpoint" "bedrock" {
  count = var.enable_private_endpoint ? 1 : 0

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.region}.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = [aws_security_group.bedrock[0].id]
  private_dns_enabled = true
}

resource "aws_security_group" "bedrock" {
  count = var.enable_private_endpoint ? 1 : 0

  name        = "${var.prefix}-bedrock-endpoint-sg"
  description = "Security group for Bedrock VPC endpoint"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }
}

# Bedrock Knowledge Base
resource "aws_bedrockagent_knowledge_base" "main" {
  count = var.create_knowledge_base ? 1 : 0

  name        = "${var.prefix}-knowledge-base"
  description = var.knowledge_base_description
  role_arn    = aws_iam_role.bedrock_kb[0].arn

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:${var.region}::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = var.opensearch_collection_arn
      vector_index_name = var.vector_index_name
      field_mapping {
        vector_field   = "embedding"
        text_field     = "text"
        metadata_field = "metadata"
      }
    }
  }
}
```

```hcl
# modules/aws-bedrock/variables.tf

variable "prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for private endpoints"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs"
}

variable "allowed_model_arns" {
  type = list(string)
  default = [
    "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet*",
    "arn:aws:bedrock:*::foundation-model/meta.llama3*"
  ]
}

variable "enable_private_endpoint" {
  type    = bool
  default = true
}

variable "create_knowledge_base" {
  type    = bool
  default = false
}
```

## Azure OpenAI Infrastructure

### Azure OpenAI Module

```hcl
# modules/azure-openai/main.tf

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

resource "azurerm_cognitive_account" "openai" {
  name                  = var.openai_name
  location              = var.location
  resource_group_name   = var.resource_group_name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = var.openai_name

  public_network_access_enabled = var.public_network_access

  network_acls {
    default_action = var.public_network_access ? "Allow" : "Deny"

    dynamic "virtual_network_rules" {
      for_each = var.allowed_subnet_ids
      content {
        subnet_id = virtual_network_rules.value
      }
    }
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# GPT-4o Deployment
resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-05-13"
  }

  sku {
    name     = var.gpt4o_sku_name
    capacity = var.gpt4o_capacity
  }
}

# Embedding Model
resource "azurerm_cognitive_deployment" "embedding" {
  name                 = "text-embedding-3-large"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-3-large"
    version = "1"
  }

  sku {
    name     = "Standard"
    capacity = var.embedding_capacity
  }
}

# Private Endpoint
resource "azurerm_private_endpoint" "openai" {
  count = var.enable_private_endpoint ? 1 : 0

  name                = "${var.openai_name}-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.openai_name}-psc"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }
}

# Azure AI Search
resource "azurerm_search_service" "main" {
  count = var.create_search_service ? 1 : 0

  name                = "${var.openai_name}-search"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.search_sku
  replica_count       = var.search_replica_count
  partition_count     = var.search_partition_count

  semantic_search_sku = "standard"
}
```

## OCI GenAI Infrastructure

### OCI GenAI Module

```hcl
# modules/oci-genai/main.tf

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

# Dedicated AI Cluster
resource "oci_generative_ai_dedicated_ai_cluster" "main" {
  compartment_id = var.compartment_id
  display_name   = "${var.prefix}-genai-cluster"
  type           = var.cluster_type  # "HOSTING" or "FINE_TUNING"
  unit_count     = var.unit_count
  unit_shape     = var.unit_shape  # "LARGE_COHERE" or "LARGE_GENERIC"

  freeform_tags = var.tags
}

# Model Endpoint
resource "oci_generative_ai_endpoint" "main" {
  compartment_id             = var.compartment_id
  dedicated_ai_cluster_id    = oci_generative_ai_dedicated_ai_cluster.main.id
  display_name               = "${var.prefix}-endpoint"
  model_id                   = var.model_id

  content_moderation_config {
    is_enabled = var.enable_content_moderation
  }
}

# Agent
resource "oci_generative_ai_agent" "main" {
  count = var.create_agent ? 1 : 0

  compartment_id = var.compartment_id
  display_name   = "${var.prefix}-agent"
  description    = var.agent_description

  knowledge_base_ids = var.knowledge_base_ids
}

# Knowledge Base
resource "oci_generative_ai_agent_knowledge_base" "main" {
  count = var.create_knowledge_base ? 1 : 0

  compartment_id = var.compartment_id
  display_name   = "${var.prefix}-kb"

  index_config {
    index_config_type = "OCI_OPEN_SEARCH"

    indexes {
      name   = var.opensearch_index_name
      schema {
        body_key              = "body"
        embedding_body_key    = "embedding"
        title_key             = "title"
        url_key               = "url"
      }
    }

    cluster_id = var.opensearch_cluster_id
    secret_detail {
      type        = "BASIC"
      secret_id   = var.opensearch_secret_id
    }
  }
}
```

## Vector Store Module

### OpenSearch Serverless (AWS)

```hcl
# modules/vector-store/aws-opensearch/main.tf

resource "aws_opensearchserverless_collection" "vectors" {
  name        = "${var.prefix}-vectors"
  type        = "VECTORSEARCH"
  description = "Vector store for AI embeddings"
}

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.prefix}-encryption"
  type = "encryption"

  policy = jsonencode({
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${var.prefix}-vectors"]
    }]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.prefix}-network"
  type = "network"

  policy = jsonencode([{
    Rules = [{
      ResourceType = "collection"
      Resource     = ["collection/${var.prefix}-vectors"]
    }]
    AllowFromPublic = false
    SourceVPCEs     = var.vpc_endpoint_ids
  }])
}

resource "aws_opensearchserverless_access_policy" "data" {
  name = "${var.prefix}-data-access"
  type = "data"

  policy = jsonencode([{
    Rules = [
      {
        ResourceType = "index"
        Resource     = ["index/${var.prefix}-vectors/*"]
        Permission   = ["aoss:*"]
      },
      {
        ResourceType = "collection"
        Resource     = ["collection/${var.prefix}-vectors"]
        Permission   = ["aoss:*"]
      }
    ]
    Principal = var.allowed_principals
  }])
}
```

## Multi-Cloud Environment Example

```hcl
# environments/prod/main.tf

terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "terraform-state-ai-infra"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "ai-platform"
      ManagedBy   = "terraform"
    }
  }
}

# Azure Provider
provider "azurerm" {
  features {}
  subscription_id = var.azure_subscription_id
}

# OCI Provider
provider "oci" {
  tenancy_ocid     = var.oci_tenancy_ocid
  user_ocid        = var.oci_user_ocid
  fingerprint      = var.oci_fingerprint
  private_key_path = var.oci_private_key_path
  region           = var.oci_region
}

# AWS Bedrock
module "aws_ai" {
  source = "../../modules/aws-bedrock"

  prefix             = "prod"
  region             = var.aws_region
  vpc_id             = data.aws_vpc.main.id
  private_subnet_ids = data.aws_subnets.private.ids
}

# Azure OpenAI
module "azure_ai" {
  source = "../../modules/azure-openai"

  openai_name         = "prod-openai"
  location            = var.azure_location
  resource_group_name = azurerm_resource_group.ai.name
  gpt4o_capacity      = 100

  enable_private_endpoint    = true
  private_endpoint_subnet_id = data.azurerm_subnet.private.id
}

# OCI GenAI
module "oci_ai" {
  source = "../../modules/oci-genai"

  prefix         = "prod"
  compartment_id = var.oci_compartment_id
  cluster_type   = "HOSTING"
  unit_count     = 10
}
```

## Best Practices

### State Management

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "ai-infra/${var.environment}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"

    # Cross-account state (if needed)
    role_arn = "arn:aws:iam::SHARED_ACCOUNT:role/TerraformStateRole"
  }
}
```

### Variable Validation

```hcl
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "gpt4o_capacity" {
  type = number
  validation {
    condition     = var.gpt4o_capacity >= 10 && var.gpt4o_capacity <= 1000
    error_message = "GPT-4o capacity must be between 10 and 1000 TPM."
  }
}
```

### Sensitive Data

```hcl
# Use data sources for secrets
data "aws_secretsmanager_secret_version" "api_key" {
  secret_id = "prod/openai/api-key"
}

# Mark outputs as sensitive
output "openai_endpoint" {
  value     = azurerm_cognitive_account.openai.endpoint
  sensitive = true
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0

      - name: Terraform Init
        run: terraform init
        working-directory: environments/prod

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: environments/prod

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
        working-directory: environments/prod
```

## Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
