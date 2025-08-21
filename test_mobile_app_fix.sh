#!/bin/bash

echo "🔐 Testing Mobile App Fix for field_agent_test"
echo "=============================================="

# Login and get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" \
  -d '{
    "username": "field_agent_test",
    "password": "password123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Access token obtained"
echo ""

# Test mobile cases endpoint (what mobile app now uses)
echo "Step 2: Testing /api/mobile/cases endpoint..."
MOBILE_CASES_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID")

echo "Mobile Cases Response:"
echo "$MOBILE_CASES_RESPONSE" | jq '{
  success: .success,
  message: .message,
  caseCount: (.data | length),
  assignedCases: [.data[] | select(.status == "ASSIGNED") | {
    caseId: .caseId,
    customerName: .customerName,
    status: .status,
    assignedToFieldUser: .assignedToFieldUser
  }],
  allStatuses: [.data[].status] | unique
}'

echo ""
echo "🎯 Test completed!"

# Count assigned cases
ASSIGNED_COUNT=$(echo "$MOBILE_CASES_RESPONSE" | jq '[.data[] | select(.status == "ASSIGNED")] | length')
echo ""
echo "📊 Summary:"
echo "- Total cases returned: $(echo "$MOBILE_CASES_RESPONSE" | jq '.data | length')"
echo "- Cases with ASSIGNED status: $ASSIGNED_COUNT"
echo ""

if [ "$ASSIGNED_COUNT" -gt 0 ]; then
  echo "✅ SUCCESS: Mobile app should now show $ASSIGNED_COUNT assigned cases!"
else
  echo "❌ ISSUE: No cases with ASSIGNED status found"
fi
