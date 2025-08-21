#!/bin/bash

echo "🔐 Simple Mobile API Test for field_agent_test"
echo "=============================================="

# Login and get token
echo "Step 1: Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "field_agent_test", "password": "password123"}' | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Access token obtained: ${TOKEN:0:20}..."
echo ""

# Test mobile cases endpoint
echo "Step 2: Testing mobile cases endpoint..."
curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" | jq '{
    success: .success,
    message: .message,
    caseCount: (.data | length),
    firstCase: (.data[0] | {
      caseId: .caseId,
      customerName: .customerName,
      status: .status,
      assignedToFieldUser: .assignedToFieldUser
    })
  }'

echo ""
echo "🎯 Test completed!"
