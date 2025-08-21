#!/bin/bash

echo "🔍 Testing Mobile API Structure"
echo "==============================="

# Get token
echo "Getting token..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" \
  -d '{"username": "field_agent_test", "password": "password123"}' | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token obtained"
echo ""

# Test API structure
echo "Testing API structure..."
curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" | jq '{
    success: .success,
    message: .message,
    dataKeys: (.data | keys),
    casesCount: (.data.cases | length // 0),
    paginationExists: (.data.pagination != null),
    syncTimestampExists: (.data.syncTimestamp != null)
  }'

echo ""
echo "Expected structure:"
echo "{"
echo "  success: true,"
echo "  data: {"
echo "    cases: [...],"
echo "    pagination: {...},"
echo "    syncTimestamp: '...'"
echo "  }"
echo "}"
