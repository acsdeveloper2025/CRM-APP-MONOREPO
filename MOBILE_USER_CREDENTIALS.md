# 🔐 Mobile User Credentials - field_agent_test

## User Authentication Details

### **Primary Credentials**
| Field | Value |
|-------|-------|
| **Username** | `field_agent_test` |
| **Password** | `password123` |
| **Email** | `field.agent@test.com` |
| **Role** | `FIELD_AGENT` |

### **User Information**
| Field | Value |
|-------|-------|
| **User ID** | `bffea46e-57ab-4be8-b058-7557993af553` |
| **Name** | `Field Agent Test` |
| **Status** | Active |

## 📱 Mobile App Login

### **Mobile API Endpoints**

#### **Mobile Login**
```http
POST http://localhost:3000/api/mobile/auth/login
Content-Type: application/json

{
  "username": "field_agent_test",
  "password": "password123"
}
```

#### **Expected Response**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "bffea46e-57ab-4be8-b058-7557993af553",
      "name": "Field Agent Test",
      "username": "field_agent_test",
      "email": "field.agent@test.com",
      "role": "FIELD_AGENT",
      "employeeId": null,
      "designation": null,
      "department": null,
      "profilePhotoUrl": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

## 📋 Assigned Case Details

### **Case Information**
| Field | Value |
|-------|-------|
| **Case ID** | 7 |
| **Case Number** | CASE-TEST-1755785343.475872 |
| **Customer Name** | John Doe |
| **Client** | ABC Bank Ltd. |
| **Product** | Personal Loan |
| **Verification Type** | Residence Verification |
| **Status** | ASSIGNED |
| **Priority** | MEDIUM |

### **Mobile Case API Access**

#### **Get Assigned Cases**
```http
GET http://localhost:3000/api/mobile/cases
Authorization: Bearer {accessToken}
```

#### **Get Specific Case**
```http
GET http://localhost:3000/api/mobile/cases/7
Authorization: Bearer {accessToken}
```

## 🧪 Testing Instructions

### **Step 1: Mobile Login**
1. Use the mobile app or API client
2. Send POST request to `/api/mobile/auth/login`
3. Use credentials: `field_agent_test` / `password123`
4. Save the returned `accessToken`

### **Step 2: Access Cases**
1. Use the `accessToken` in Authorization header
2. Call `/api/mobile/cases` to see assigned cases
3. Should see Case ID 7 assigned to this user

### **Step 3: Case Details**
1. Call `/api/mobile/cases/7` for full case details
2. Verify all 12 assignment fields are present:
   - Customer Name: John Doe
   - CaseID: 7
   - Client: ABC Bank Ltd.
   - Product: Personal Loan
   - Verification Type: Residence Verification
   - Applicant Type: APPLICANT
   - Created By Backend User: Field Agent Test
   - Backend Contact Number: +91-9876543210
   - Assign to Field User: Field Agent Test
   - Priority: MEDIUM
   - TRIGGER: Test case assignment for field_agent_test user - TRIGGER field
   - Customer Calling Code: (Auto-generated)

## 🔧 Alternative Authentication Methods

### **Web Dashboard Login**
If you want to access the web dashboard:
```
URL: http://localhost:5173
Username: field_agent_test
Password: password123
```

### **Direct Database Access**
For debugging purposes:
```sql
-- Check user details
SELECT * FROM users WHERE username = 'field_agent_test';

-- Check assigned cases
SELECT * FROM cases WHERE "assignedTo" = 'bffea46e-57ab-4be8-b058-7557993af553';
```

## 📝 Notes

- **Password Updated**: The password has been reset to `password123` for testing
- **Case Assigned**: Case ID 7 is already assigned to this user
- **Mobile Ready**: All mobile API endpoints are configured and working
- **Role Permissions**: FIELD_AGENT role has appropriate permissions for mobile app
- **Token Expiry**: Access tokens expire in 24 hours, refresh tokens in 7 days

## 🚨 Security Notes

- This is a test user with a simple password
- In production, use strong passwords and proper authentication
- Consider implementing additional security measures for mobile apps
- The current setup is for development/testing purposes only

## ✅ Quick Test Commands

### **cURL Login Test**
```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "field_agent_test",
    "password": "password123"
  }'
```

### **cURL Cases Test** (after getting token)
```bash
curl -X GET http://localhost:3000/api/mobile/cases \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ready for mobile app testing!** 🎉
