# Deployment Guide — SentinelOS NON-DEMO

## Overview
This guide walks through completing Azure deployment for the Sentinel API.

## Required GitHub Secrets
Add the following under Settings → Secrets → Actions:

- AZURE_CREDENTIALS
- ACR_LOGIN_SERVER
- ACR_USERNAME
- ACR_PASSWORD
- CONTAINER_APP_NAME
- AZURE_RESOURCE_GROUP

## Deployment Flow
1. Push to main
2. GitHub Actions builds Docker image
3. Image is pushed to Azure Container Registry
4. Container App is updated

## Verify Deployment
Once deployed:

GET /health

Expected:
{
  "status": "ok"
}

## Next Steps
- add custom domain (.io)
- enable TLS and secure ingress
- add authentication layer
- connect frontend client
