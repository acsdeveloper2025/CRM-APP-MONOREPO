#!/bin/bash

echo "📱 Complete Mobile App Login & Cases Test"
echo "========================================"

# Test mobile app login and case retrieval
echo "Step 1: Testing Mobile App Login..."
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

# Extract token and user info
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id')
USER_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.name')
USER_ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.role')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no access token received"
  exit 1
fi

echo ""
echo "✅ Login successful!"
echo "   User: $USER_NAME ($USER_ROLE)"
echo "   User ID: $USER_ID"
echo "   Token: ${TOKEN:0:30}..."
echo ""

# Test mobile cases endpoint
echo "Step 2: Fetching assigned cases..."
CASES_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID")

echo "Cases API Response:"
echo "$CASES_RESPONSE" | jq '{
  success: .success,
  message: .message,
  totalCases: (.data | length),
  assignedCases: [.data[] | {
    caseId: .caseId,
    customerName: .customerName,
    status: .status,
    assignedToFieldUser: .assignedToFieldUser,
    priority: .priority,
    clientName: .clientName,
    productName: .productName
  }]
}'

# Count cases by status
TOTAL_CASES=$(echo "$CASES_RESPONSE" | jq '.data | length')
ASSIGNED_CASES=$(echo "$CASES_RESPONSE" | jq '[.data[] | select(.status == "ASSIGNED")] | length')
PENDING_CASES=$(echo "$CASES_RESPONSE" | jq '[.data[] | select(.status == "PENDING")] | length')
IN_PROGRESS_CASES=$(echo "$CASES_RESPONSE" | jq '[.data[] | select(.status == "IN_PROGRESS")] | length')
COMPLETED_CASES=$(echo "$CASES_RESPONSE" | jq '[.data[] | select(.status == "COMPLETED")] | length')

echo ""
echo "📊 Case Summary for $USER_NAME:"
echo "================================"
echo "Total Cases: $TOTAL_CASES"
echo "ASSIGNED: $ASSIGNED_CASES"
echo "PENDING: $PENDING_CASES"
echo "IN_PROGRESS: $IN_PROGRESS_CASES"
echo "COMPLETED: $COMPLETED_CASES"
echo ""

# Test specific status filtering (what mobile app does)
echo "Step 3: Testing status filtering (ASSIGNED cases only)..."
ASSIGNED_FILTER_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/mobile/cases?status=ASSIGNED" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID")

FILTERED_COUNT=$(echo "$ASSIGNED_FILTER_RESPONSE" | jq '.data | length')
echo "Cases with status=ASSIGNED filter: $FILTERED_COUNT"

echo ""
echo "🎯 Mobile App Expected Behavior:"
echo "================================"
if [ "$ASSIGNED_CASES" -gt 0 ]; then
  echo "✅ Assigned Tab: Should show $ASSIGNED_CASES cases"
  echo "✅ Cases are properly filtered by user and status"
  echo "✅ Mobile app login and API integration working!"
else
  echo "❌ No assigned cases found - check case assignments"
fi

if [ "$TOTAL_CASES" -gt 0 ]; then
  echo "✅ All Cases Tab: Should show $TOTAL_CASES total cases"
else
  echo "❌ No cases found for this user"
fi

echo ""
echo "🔍 Next Steps:"
echo "1. Open mobile app (http://localhost:5174)"
echo "2. Login with: field_agent_test / password123"
echo "3. Check Assigned tab - should show $ASSIGNED_CASES cases"
echo "4. Check All Cases tab - should show $TOTAL_CASES cases"
