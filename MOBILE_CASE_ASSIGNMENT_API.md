# Mobile Case Assignment API - Complete Field Mapping

## Overview
This document outlines the enhanced mobile API response structure that includes all 12 required fields for the mobile app assignment tab.

## Required Fields for Mobile App Assignment Tab

1. **Customer Name** ✅ - `customerName`
2. **CaseID** ✅ - `caseId` (auto-incrementing user-friendly ID)
3. **Client** ✅ - `client.name`
4. **Product** ✅ - `product.name`
5. **Verification Type** ✅ - `verificationTypeDetails.name`
6. **Applicant Type** ✅ - `applicantType`
7. **Created By Backend User** ✅ - `createdByBackendUser`
8. **Backend Contact Number** ✅ - `backendContactNumber`
9. **Assign to Field User** ✅ - `assignedToFieldUser`
10. **Priority** ✅ - `priority`
11. **TRIGGER** ✅ - `notes`
12. **Customer Calling Code** ✅ - `customerCallingCode`

## API Endpoints

### Get Cases for Mobile App
```http
GET /api/mobile/cases
Authorization: Bearer {token}
```

### Get Single Case
```http
GET /api/mobile/cases/{caseId}
Authorization: Bearer {token}
```

### Sync Download
```http
GET /api/mobile/sync/download
Authorization: Bearer {token}
```

## Enhanced Mobile Case Response Structure

```typescript
interface MobileCaseResponse {
  // Core identifiers
  id: string;                    // Database primary key
  caseId: number;               // User-friendly auto-incrementing case ID
  
  // Customer Information
  customerName: string;         // Customer Name *
  customerCallingCode?: string; // Customer Calling Code *
  customerPhone?: string;
  customerEmail?: string;
  
  // Case Details
  title: string;
  description: string;
  status: string;
  priority: number;             // Priority *
  notes?: string;               // TRIGGER field *
  
  // Assignment Information
  applicantType?: string;       // Applicant Type *
  backendContactNumber?: string; // Backend Contact Number *
  createdByBackendUser?: string; // Created By Backend User *
  assignedToFieldUser?: string;  // Assign to Field User *
  
  // Client Information
  client: {
    id: string;
    name: string;               // Client *
    code: string;
  };
  
  // Product Information
  product?: {
    id: string;
    name: string;               // Product *
    code?: string;
  };
  
  // Verification Type Information
  verificationTypeDetails?: {
    id: string;
    name: string;               // Verification Type *
    code?: string;
  };
  
  // Address Information
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  latitude?: number;
  longitude?: number;
  
  // Timestamps
  assignedAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Additional Data
  verificationType?: string;
  verificationOutcome?: string;
  attachments?: MobileAttachmentResponse[];
  formData?: any;
  syncStatus?: 'SYNCED' | 'PENDING' | 'CONFLICT';
}
```

## Sample API Response

```json
{
  "success": true,
  "message": "Cases retrieved successfully",
  "data": {
    "cases": [
      {
        "id": "uuid-case-id",
        "caseId": 1,
        "customerName": "John Doe",
        "customerCallingCode": "CC-1642567890123",
        "client": {
          "id": "client-uuid",
          "name": "ABC Bank",
          "code": "ABC001"
        },
        "product": {
          "id": "product-uuid",
          "name": "Personal Loan",
          "code": "PL001"
        },
        "verificationTypeDetails": {
          "id": "vt-uuid",
          "name": "Residence Verification",
          "code": "RV001"
        },
        "applicantType": "APPLICANT",
        "createdByBackendUser": "Backend User Name",
        "backendContactNumber": "+91-9876543210",
        "assignedToFieldUser": "Field Agent Name",
        "priority": 2,
        "notes": "Urgent verification required",
        "status": "ASSIGNED",
        "title": "Residence Verification - Mumbai",
        "description": "Verify residential address for loan application",
        "addressStreet": "123 Main Street",
        "addressCity": "Mumbai",
        "addressState": "Maharashtra",
        "addressPincode": "400001",
        "assignedAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "syncStatus": "SYNCED"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

## Database Schema Updates

The following database fields support the mobile assignment requirements:

- `cases.caseId` - SERIAL auto-incrementing user-friendly ID
- `cases.customerName` / `cases.applicantName` - Customer Name
- `cases.customerCallingCode` - Customer Calling Code
- `cases.clientId` → `clients.name` - Client Name
- `cases.productId` → `products.name` - Product Name
- `cases.verificationTypeId` → `verification_types.name` - Verification Type
- `cases.applicantType` - Applicant Type
- `cases.backendContactNumber` - Backend Contact Number
- `cases.createdBy` → `users.name` - Created By Backend User
- `cases.assignedTo` → `users.name` - Assign to Field User
- `cases.priority` - Priority
- `cases.notes` - TRIGGER field

## Implementation Status

✅ **COMPLETED**: All 12 required fields are now included in the mobile API response
✅ **COMPLETED**: Database schema supports all required fields
✅ **COMPLETED**: API endpoints updated with enhanced field mapping
✅ **COMPLETED**: Consistent response structure across all mobile endpoints

## Next Steps

1. **Mobile App Integration**: Update mobile app to consume the new field structure
2. **Testing**: Verify all fields are properly populated in mobile app
3. **Documentation**: Update mobile app documentation with new field mappings
