#!/bin/bash

echo "🔐 Testing Mobile API for field_agent_test"
echo "=========================================="

# Step 1: Login and get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
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

# Step 2: Get assigned cases
echo "Step 2: Getting assigned cases..."
CASES_RESPONSE=$(curl -s -X GET http://localhost:3000/api/mobile/cases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID")

echo "Cases Response:"
echo "$CASES_RESPONSE" | jq '.'

# Count cases
CASE_COUNT=$(echo "$CASES_RESPONSE" | jq '.data | length')
echo ""
echo "📊 Total assigned cases: $CASE_COUNT"

# Show case details
if [ "$CASE_COUNT" -gt 0 ]; then
  echo ""
  echo "📋 Case Details:"
  echo "$CASES_RESPONSE" | jq '.data[] | {
    caseId: .caseId,
    customerName: .customerName,
    client: .client.name,
    product: .product.name,
    verificationTypeDetails: .verificationTypeDetails.name,
    applicantType: .applicantType,
    priority: .priority,
    status: .status,
    createdByBackendUser: .createdByBackendUser,
    assignedToFieldUser: .assignedToFieldUser
  }'
else
  echo "❌ No cases found for field_agent_test"
fi

echo ""
echo "🎯 Test completed!"
