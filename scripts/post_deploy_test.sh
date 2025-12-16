#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/post_deploy_test.sh <BASE_URL> <TEST_USERNAME> <TEST_PASSWORD>
BASE_URL="$1"
USERNAME="$2"
PASSWORD="$3"

if [ -z "$BASE_URL" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <base_url> <test_username> <test_password>"
  exit 2
fi

echo "Running post-deploy smoke tests against $BASE_URL"

# 1) Login and get cookies
curl -c /tmp/cookies.txt -s -X POST "$BASE_URL/api/login" -H 'Content-Type: application/json' -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" | jq

echo "Requesting verification email (should return 200 or 429 if rate-limited)"
curl -b /tmp/cookies.txt -s -X POST "$BASE_URL/api/user/send_verification" -H 'Content-Type: application/json' | jq

echo "Requesting password reset for the user (should return 200)"
curl -s -X POST "$BASE_URL/api/request_password_reset" -H 'Content-Type: application/json' -d "{\"email\": \"$USERNAME@example.com\"}" | jq

echo "Post-deploy tests finished. Inspect the server logs for verification/reset links if SMTP is not enabled in staging."
