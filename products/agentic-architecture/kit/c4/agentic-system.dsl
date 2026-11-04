workspace "Agentic Architecture Reference System" "C4 model as code for an evidence-gated production agent system" {

  model {
    operator = person "Platform Architect / Operator" "Designs, reviews, and approves consequential agent actions."
    customer = person "End User / Buyer" "Submits requests and receives verified deliverables."
    checkerHuman = person "Accountable Owner" "Signs off on G5 pricing and Tier-2 production approvals."

    modelProviderA = softwareSystem "Model Provider Family A" "Primary reasoning and Maker generation API." "External"
    modelProviderB = softwareSystem "Model Provider Family B" "Independent Checker model family (distinct vendor)." "External"
    externalSaas = softwareSystem "External SaaS / Merchant API" "Webhook source and outward action target." "External"

    agentPlatform = softwareSystem "Agentic Architecture Runtime" "Bounded supervisor, capability proxy, and evidence gate." {
      webSurface = container "Operator & Buyer Web Surface" "Next.js App Router" "Renders decision desk, rehearsal, and waitlist."
      supervisor = container "Deterministic Supervisor" "TypeScript / Node.js" "Enforces state machine, disjoint writePaths, and budget ceiling."
      capabilityProxy = container "Scoped Capability Proxy (MCP Host)" "Node.js" "Enforces Tier 0/1/2 tool boundaries and untrusted-content tagging." {
        ingressTagger = component "Untrusted Ingress Tagger" "Module" "Wraps external data in <untrusted-content> and strips forged closing tags."
        tierRouter = component "Tier 0/1/2 Policy Router" "Module" "Classifies tool calls into Read, Idempotent Draft, or Two-Phase Write."
        idempotencyGuard = component "Idempotency & Path Guard" "Module" "Enforces realpath containment and idempotencyKey deduplication."
        approvalVerifier = component "Two-Phase Approval Verifier" "Module" "Verifies cryptographic approval tokens from a distinct principal."
        otelRedactor = component "PII-Redacted Span Emitter" "Module" "Emits OpenTelemetry GenAI spans with secrets and emails scrubbed."
      }
      makerWorker = container "Maker Specialist Sandbox" "Isolated Container" "Executes scoped tasks within assigned writePaths."
      checkerWorker = container "Clean-Room Checker Sandbox" "Read-Only Container" "Runs cross-model verification with writePaths=[]."
      stateStore = container "Convergent State & Memory Store" "KV / Relational" "Stores write-before-mark orders, working docs, and tenant-isolated memories."
    }

    customer -> webSurface "Submits task or waitlist signal over HTTPS"
    operator -> supervisor "Configures run budget and reviews gate receipts"
    checkerHuman -> approvalVerifier "Signs Tier-2 approval tokens"
    externalSaas -> webSurface "Delivers timestamp-signed webhooks (timestamp.rawBody)"
    supervisor -> makerWorker "Dispatches HandoffPacket (disjoint writePaths)"
    supervisor -> checkerWorker "Dispatches CleanRoomPacket (writePaths=[])"
    makerWorker -> capabilityProxy "Invokes Tier 0/1/2 tools over JSON-RPC"
    makerWorker -> modelProviderA "Calls pinned model snapshot"
    checkerWorker -> modelProviderB "Calls independent model family"
    capabilityProxy -> stateStore "Reads and writes tenant-scoped state (write-before-mark)"
    capabilityProxy -> externalSaas "Executes approved Tier-2 outward actions"
  }

  views {
    systemContext agentPlatform "C1_SystemContext" {
      include *
      autoLayout lr
    }
    container agentPlatform "C2_Containers" {
      include *
      autoLayout tb
    }
    component capabilityProxy "C3_ToolPlaneComponents" {
      include *
      autoLayout tb
    }
    dynamic agentPlatform "C4_MakerCheckerSequence" "Maker-Checker and Two-Phase Approval Flow" {
      operator -> supervisor "1. Start bounded run"
      supervisor -> makerWorker "2. Dispatch HandoffPacket"
      makerWorker -> capabilityProxy "3. Propose Tier-2 action"
      capabilityProxy -> checkerHuman "4. Hold for approval token"
      supervisor -> checkerWorker "5. Run cross-model clean-room check"
    }
  }
}
