#!/bin/bash

# STRICTLY ENFORCED SERVICE NAME
SERVICE_NAME="snap-ledger"
REPO_URL="https://github.com/darrenwu-git/snap_ledger"
BRANCH="main"

echo "🚀 Deploying $SERVICE_NAME from $BRANCH..."

# Load secrets from .env (API Key)
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check for API Key
if [ -z "$VITE_BUILDER_API_KEY" ]; then
  echo "❌ Error: VITE_BUILDER_API_KEY not found in .env"
  exit 1
fi

# Load Production Config from .env.production
if [ -f .env.production ]; then
  echo "📄 Loading production configuration from .env.production..."
  # Clean read of values (removing quotes)
  PROD_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  PROD_SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'")
  PROD_INVITE_CODE=$(grep VITE_INVITE_CODE .env.production | cut -d '=' -f2 | tr -d '"' | tr -d "'")
else
  echo "❌ Error: .env.production not found! Cannot deploy without production keys."
  exit 1
fi

# Trigger Deployment
response=$(curl -s -w "\n%{http_code}" -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VITE_BUILDER_API_KEY" \
  -d "{
    \"repo_url\": \"$REPO_URL\",
    \"service_name\": \"$SERVICE_NAME\",
    \"branch\": \"$BRANCH\",
    \"env_vars\": {
      \"VITE_SUPABASE_URL\": \"$PROD_SUPABASE_URL\",
      \"VITE_SUPABASE_ANON_KEY\": \"$PROD_SUPABASE_KEY\",
      \"VITE_INVITE_CODE\": \"$PROD_INVITE_CODE\",
      \"VITE_BUILDER_API_KEY\": \"$VITE_BUILDER_API_KEY\"
    }
  }")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "✅ Deployment triggered successfully!"
  echo "$body"
else
  echo "❌ Deployment failed with status $http_code"
  echo "$body"
  exit 1
fi
