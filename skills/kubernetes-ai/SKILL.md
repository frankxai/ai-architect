---
name: Kubernetes AI Expert
description: Deploy and operate AI workloads on Kubernetes with GPU scheduling, model serving, and MLOps patterns
version: 1.0.0
triggers:
  - kubernetes
  - k8s
  - helm
  - GPU
  - model serving
---

# Kubernetes AI Expert

You are an expert in deploying and operating AI/ML workloads on Kubernetes, including GPU scheduling, model serving frameworks, and MLOps patterns.

## GPU Workload Scheduling

### NVIDIA GPU Operator

```yaml
# Install GPU Operator via Helm
# helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
# helm install gpu-operator nvidia/gpu-operator

# Verify GPU availability
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test
spec:
  containers:
  - name: cuda-test
    image: nvcr.io/nvidia/cuda:12.2.0-base-ubuntu22.04
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: 1
  restartPolicy: Never
```

### GPU Resource Requests

```yaml
# Request specific GPU resources
apiVersion: v1
kind: Pod
metadata:
  name: llm-inference
spec:
  containers:
  - name: inference
    image: your-inference-image
    resources:
      limits:
        nvidia.com/gpu: 2
        memory: "64Gi"
        cpu: "16"
      requests:
        nvidia.com/gpu: 2
        memory: "64Gi"
        cpu: "16"
  nodeSelector:
    nvidia.com/gpu.product: "NVIDIA-A100-SXM4-80GB"
  tolerations:
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"
```

### Multi-Instance GPU (MIG)

```yaml
# Request MIG slice
apiVersion: v1
kind: Pod
metadata:
  name: mig-workload
spec:
  containers:
  - name: inference
    image: your-inference-image
    resources:
      limits:
        nvidia.com/mig-3g.40gb: 1  # Request 3g.40gb MIG slice
```

## Model Serving Frameworks

### vLLM Deployment

```yaml
# vLLM for high-throughput LLM inference
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-llama
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-llama
  template:
    metadata:
      labels:
        app: vllm-llama
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        args:
        - --model=meta-llama/Llama-3.1-8B-Instruct
        - --tensor-parallel-size=1
        - --max-model-len=8192
        - --gpu-memory-utilization=0.9
        ports:
        - containerPort: 8000
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "32Gi"
        env:
        - name: HF_TOKEN
          valueFrom:
            secretKeyRef:
              name: huggingface-token
              key: token
        volumeMounts:
        - name: model-cache
          mountPath: /root/.cache/huggingface
      volumes:
      - name: model-cache
        persistentVolumeClaim:
          claimName: model-cache-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: vllm-llama
spec:
  selector:
    app: vllm-llama
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### NVIDIA Triton Inference Server

```yaml
# Triton for multi-model serving
apiVersion: apps/v1
kind: Deployment
metadata:
  name: triton-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: triton-server
  template:
    metadata:
      labels:
        app: triton-server
    spec:
      containers:
      - name: triton
        image: nvcr.io/nvidia/tritonserver:24.01-py3
        args:
        - tritonserver
        - --model-repository=s3://bucket/models
        - --model-control-mode=poll
        - --repository-poll-secs=30
        ports:
        - containerPort: 8000  # HTTP
        - containerPort: 8001  # gRPC
        - containerPort: 8002  # Metrics
        resources:
          limits:
            nvidia.com/gpu: 2
            memory: "64Gi"
        livenessProbe:
          httpGet:
            path: /v2/health/live
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /v2/health/ready
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
```

### Text Generation Inference (TGI)

```yaml
# HuggingFace TGI
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tgi-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tgi-server
  template:
    metadata:
      labels:
        app: tgi-server
    spec:
      containers:
      - name: tgi
        image: ghcr.io/huggingface/text-generation-inference:2.0
        args:
        - --model-id=meta-llama/Llama-3.1-8B-Instruct
        - --quantize=bitsandbytes-nf4
        - --max-input-length=4096
        - --max-total-tokens=8192
        ports:
        - containerPort: 80
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: "24Gi"
        env:
        - name: HUGGING_FACE_HUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: hf-token
              key: token
```

## Helm Charts

### AI Platform Helm Chart

```yaml
# charts/ai-platform/values.yaml
global:
  imageRegistry: ""
  storageClass: "gp3"

inference:
  enabled: true
  replicas: 2
  model: "meta-llama/Llama-3.1-8B-Instruct"
  framework: "vllm"  # vllm, tgi, triton

  resources:
    limits:
      nvidia.com/gpu: 1
      memory: "32Gi"
      cpu: "8"

  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 10
    targetCPUUtilization: 70
    targetGPUUtilization: 80

  nodeSelector:
    node-type: gpu

  tolerations:
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"

vectorDB:
  enabled: true
  type: "qdrant"  # qdrant, milvus, weaviate
  replicas: 3
  storage: "100Gi"

gateway:
  enabled: true
  type: "nginx"
  rateLimiting:
    enabled: true
    requestsPerSecond: 100

monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
```

```yaml
# charts/ai-platform/templates/deployment.yaml
{{- if .Values.inference.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "ai-platform.fullname" . }}-inference
  labels:
    {{- include "ai-platform.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.inference.replicas }}
  selector:
    matchLabels:
      app.kubernetes.io/name: {{ include "ai-platform.name" . }}-inference
  template:
    metadata:
      labels:
        app.kubernetes.io/name: {{ include "ai-platform.name" . }}-inference
    spec:
      containers:
      - name: inference
        image: {{ .Values.inference.image }}
        resources:
          {{- toYaml .Values.inference.resources | nindent 10 }}
      {{- with .Values.inference.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.inference.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
{{- end }}
```

## Auto-Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: llm-inference-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: llm-inference
  minReplicas: 1
  maxReplicas: 10
  metrics:
  # Scale on GPU utilization (requires DCGM exporter)
  - type: Pods
    pods:
      metric:
        name: DCGM_FI_DEV_GPU_UTIL
      target:
        type: AverageValue
        averageValue: "80"
  # Scale on request queue length
  - type: External
    external:
      metric:
        name: inference_queue_length
      target:
        type: AverageValue
        averageValue: "50"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
```

### KEDA for Event-Driven Scaling

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: llm-inference-scaler
spec:
  scaleTargetRef:
    name: llm-inference
  minReplicaCount: 1
  maxReplicaCount: 20
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      metricName: inference_requests_pending
      threshold: "100"
      query: sum(inference_requests_pending{service="llm-inference"})
  - type: rabbitmq
    metadata:
      host: amqp://rabbitmq:5672
      queueName: inference-queue
      queueLength: "50"
```

## Networking

### Ingress with Rate Limiting

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1s"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.ai-platform.com
    secretName: ai-api-tls
  rules:
  - host: api.ai-platform.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: ai-gateway
            port:
              number: 8000
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: llm-inference-policy
spec:
  podSelector:
    matchLabels:
      app: llm-inference
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ai-gateway
    ports:
    - port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: model-cache
    ports:
    - port: 8080
  # Allow DNS
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - port: 53
      protocol: UDP
```

## Monitoring

### ServiceMonitor for Prometheus

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: llm-inference-monitor
spec:
  selector:
    matchLabels:
      app: llm-inference
  endpoints:
  - port: metrics
    interval: 15s
    path: /metrics
```

### GPU Metrics with DCGM

```yaml
# Install DCGM Exporter
# helm install dcgm-exporter nvidia/dcgm-exporter

apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: dcgm-exporter
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: dcgm-exporter
  endpoints:
  - port: metrics
    interval: 15s
```

### Grafana Dashboard ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: llm-inference-dashboard
  labels:
    grafana_dashboard: "1"
data:
  llm-dashboard.json: |
    {
      "dashboard": {
        "title": "LLM Inference Metrics",
        "panels": [
          {
            "title": "GPU Utilization",
            "targets": [
              {
                "expr": "DCGM_FI_DEV_GPU_UTIL{pod=~\"llm-.*\"}"
              }
            ]
          },
          {
            "title": "Inference Latency P99",
            "targets": [
              {
                "expr": "histogram_quantile(0.99, rate(inference_latency_bucket[5m]))"
              }
            ]
          },
          {
            "title": "Tokens per Second",
            "targets": [
              {
                "expr": "rate(tokens_generated_total[1m])"
              }
            ]
          }
        ]
      }
    }
```

## Managed Kubernetes AI Services

### AWS EKS with GPU

```hcl
# Terraform for EKS with GPU nodes
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "ai-platform"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    gpu = {
      instance_types = ["g5.2xlarge"]
      capacity_type  = "ON_DEMAND"

      min_size     = 1
      max_size     = 10
      desired_size = 2

      ami_type = "AL2_x86_64_GPU"

      labels = {
        "node-type" = "gpu"
      }

      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}
```

### Azure AKS with GPU

```hcl
resource "azurerm_kubernetes_cluster_node_pool" "gpu" {
  name                  = "gpu"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_NC24ads_A100_v4"
  node_count            = 2

  node_labels = {
    "node-type" = "gpu"
  }

  node_taints = [
    "nvidia.com/gpu=true:NoSchedule"
  ]
}
```

### OCI OKE with GPU

```hcl
resource "oci_containerengine_node_pool" "gpu" {
  cluster_id     = oci_containerengine_cluster.main.id
  compartment_id = var.compartment_id
  name           = "gpu-pool"

  node_config_details {
    size = 2
    placement_configs {
      availability_domain = data.oci_identity_availability_domain.ad.name
      subnet_id           = oci_core_subnet.private.id
    }
  }

  node_shape = "BM.GPU.A100-v2.8"

  node_source_details {
    source_type = "IMAGE"
    image_id    = data.oci_core_images.gpu.images[0].id
  }
}
```

## Resources

- [NVIDIA GPU Operator](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [Triton Inference Server](https://github.com/triton-inference-server/server)
- [KEDA](https://keda.sh/)
- [Kubernetes GPU Scheduling](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)
