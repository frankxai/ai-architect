# Grounded answers on Cloud Run with Gemini

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Ffrankxai%2Fai-architect.git&dir=templates%2Fdeploy%2Fgcp-cloud-run-gemini&revision=main)

The `ai-architect-answer/v1` contract as a Cloud Run service. The model is `gemini-3.8-flash` on Gemini Enterprise Agent Platform (formerly Vertex AI), called with `@google/genai` and the service account's Application Default Credentials on the `global` endpoint. No API key is stored.

## What happens when you click Run on Google Cloud

1. Cloud Shell clones the repository, enables `aiplatform.googleapis.com` (prebuild hook in `app.json`) and builds the `Dockerfile`.
2. The service deploys with at most 5 instances and 512 MiB each.
3. At start-up the server reads the project ID from the metadata server and switches to live mode.

If `/v1/answer` returns 502 with a permission error, the runtime service account cannot call the model. Grant it the Agent Platform user role:

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:SERVICE_ACCOUNT --role=roles/aiplatform.user
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.8-flash` | Model ID |
| `GOOGLE_CLOUD_LOCATION` | `global` | Model endpoint location |
| `GOOGLE_CLOUD_PROJECT` | from metadata | Override the project |
| `ANSWER_MODE` | `auto` | `live`, `fixture` or `auto` |
| `ANSWER_TOKEN` | unset | When set, `/v1/answer` requires a bearer token |

## Local

```bash
npm ci
npm test                              # SDK surface and server tests, no network
PORT=8080 node server.mjs             # fixture mode unless a project is configured
```

## Evidence state

Local-tested: conformance suite, the installed `@google/genai` client accepts the adapter's options, and the server answered health, page and cited answers locally in fixture mode. Not verified here: the container build (no Docker daemon in the build environment), the Cloud Run Button flow, and a live Gemini call.
