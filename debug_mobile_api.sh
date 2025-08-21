#!/bin/bash

echo "🔍 Debug Mobile API Filtering"
echo "============================="

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" \
  -d '{"username": "field_agent_test", "password": "password123"}' | jq -r '.data.tokens.accessToken')

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Test mobile cases endpoint with detailed response
echo "🔍 Testing mobile API response..."
curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" | jq '{
    success: .success,
    message: .message,
    totalCases: (.data | length),
    cases: [.data[] | {
      caseId: .caseId,
      customerName: .customerName,
      status: .status,
      assignedToFieldUser: .assignedToFieldUser,
      assignedToId: .assignedTo
    }]
  }'

echo ""
echo "Expected: Only cases assigned to field_agent_test user (ID: bffea46e-57ab-4be8-b058-7557993af553)"
