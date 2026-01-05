# /deploy-genai - Deploy OCI GenAI DAC

## Context
Deploy an Oracle Cloud Infrastructure GenAI Dedicated AI Cluster.

## Prerequisites
- OCI tenancy with GenAI service enabled
- Compartment with proper IAM policies
- OCI CLI configured or Terraform auth set up

## Workflow

### 1. Gather Requirements
- **Use case**: Hosting only or Fine-tuning needed?
- **Model**: Cohere Command R+/R/Light or Meta Llama?
- **Traffic**: Expected requests/minute
- **Region**: Availability (check OCI GenAI regions)

### 2. Size the Cluster
| Traffic Level | DAC Units | Monthly Est. |
|---------------|-----------|--------------|
| Dev/Test | 2-5 | $3-7.5K |
| Light Prod | 5-10 | $7.5-15K |
| Production | 10-20 | $15-30K |
| High Volume | 20-50 | $30-75K |

### 3. Deploy Options

#### Option A: Terraform (Recommended)
```bash
cd templates/terraform/oci-genai-dac

# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit: compartment_id, region, cluster_name, unit_count

terraform init
terraform plan
terraform apply
```

#### Option B: OCI CLI
```bash
# Create Dedicated AI Cluster
oci generative-ai dedicated-ai-cluster create \
  --compartment-id $COMPARTMENT_ID \
  --unit-count 5 \
  --unit-shape LARGE_COHERE \
  --display-name "production-dac"

# Create Endpoint
oci generative-ai endpoint create \
  --compartment-id $COMPARTMENT_ID \
  --dedicated-ai-cluster-id $DAC_OCID \
  --model-id cohere.command-r-plus
```

### 4. Post-Deployment
- [ ] Verify endpoint health
- [ ] Configure monitoring/alerts
- [ ] Set up cost tracking tags
- [ ] Test inference latency
- [ ] Document endpoint URLs

### 5. Output
Provide:
1. Terraform module or CLI commands
2. Monitoring setup instructions
3. Cost projection
4. Scaling recommendations

## Skills to Activate
- genai-dac-specialist
- oci-services-expert
- terraform-iac
