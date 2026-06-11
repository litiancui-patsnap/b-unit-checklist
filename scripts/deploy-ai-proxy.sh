#!/usr/bin/env bash
set -euo pipefail

ENV_ID="${1:-}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

if [ -z "$ENV_ID" ]; then
  echo "Usage: bash scripts/deploy-ai-proxy.sh <WECHAT_CLOUD_ENV_ID>"
  exit 1
fi

if [ ! -x "$CLI" ]; then
  echo "WeChat Developer Tools CLI not found at: $CLI"
  exit 1
fi

"$CLI" cloud functions deploy \
  --env "$ENV_ID" \
  --names aiProxy \
  --remote-npm-install \
  --project "$PROJECT_DIR"
