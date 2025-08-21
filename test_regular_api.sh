#!/bin/bash

echo "🔐 Testing Regular API for field_agent_test"
echo "=========================================="

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

# Test regular cases endpoint (what mobile app actually uses)
echo "Step 2: Testing regular /api/cases endpoint..."
curl -s -X GET "http://localhost:3000/api/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '{
    success: .success,
    message: .message,
    caseCount: (.data.cases | length),
    statuses: [.data.cases[].status] | unique,
    firstCase: (.data.cases[0] | {
      id: .id,
      applicantName: .applicantName,
      status: .status,
      assignedTo: .assignedTo
    })
  }'

echo ""
echo "🎯 Test completed!"
