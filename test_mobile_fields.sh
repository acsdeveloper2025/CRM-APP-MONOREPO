#!/bin/bash

echo "📱 Testing Mobile App Assignment Fields"
echo "======================================"

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

# Test API response structure and fields
echo "Testing assignment fields in API response..."
curl -s -X GET "http://localhost:3000/api/mobile/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-App-Version: 4.0.0" \
  -H "X-Platform: ANDROID" | jq '{
    success: .success,
    totalCases: (.data.cases | length),
    firstCase: .data.cases[0] | {
      "1_customerName": .customerName,
      "2_caseId": .caseId,
      "3_clientName": .client.name,
      "4_productName": .product.name,
      "5_verificationType": .verificationType,
      "6_applicantType": .applicantType,
      "7_createdByBackendUser": .createdByBackendUser,
      "8_backendContactNumber": .backendContactNumber,
      "9_assignedToFieldUser": .assignedToFieldUser,
      "10_priority": .priority,
      "11_trigger": .notes,
      "12_customerCallingCode": .customerCallingCode
    }
  }'

echo ""
echo "✅ All 12 required assignment fields should be present in the API response"
echo ""
echo "Expected Mobile App Display:"
echo "1. Customer Name: ✅"
echo "2. Case ID: ✅"
echo "3. Client: ✅"
echo "4. Product: ✅"
echo "5. Verification Type: ✅"
echo "6. Applicant Type: ✅"
echo "7. Created By Backend User: ✅"
echo "8. Backend Contact Number: ✅"
echo "9. Assign to Field User: ✅"
echo "10. Priority: ✅"
echo "11. TRIGGER: ✅"
echo "12. Customer Calling Code: ✅"
echo ""
echo "🎯 Next: Test mobile app info modal to verify all fields display correctly"
