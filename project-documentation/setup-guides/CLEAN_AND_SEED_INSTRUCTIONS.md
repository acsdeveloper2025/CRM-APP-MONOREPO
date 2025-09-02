# 🧹 Clean and Seed Cases - Complete Guide

This guide will help you clean all case data from the database, frontend, mobile storage, cache, and queue, then create 9 fresh cases with different verification types.

## 🎯 What This Process Does

### Database Cleanup:
- ✅ Removes all cases from the database
- ✅ Removes all attachments
- ✅ Removes related audit logs
- ✅ Resets database sequences

### Cache & Storage Cleanup:
- ✅ Clears frontend browser storage (localStorage, sessionStorage)
- ✅ Clears React Query cache
- ✅ Clears Service Worker cache
- ✅ Clears mobile AsyncStorage and SecureStore
- ✅ Clears mobile file system cache
- ✅ Clears offline queues and form drafts

### Fresh Data Creation:
- ✅ Creates 9 new cases with different verification types
- ✅ Assigns all cases to a field agent
- ✅ Creates sample attachments for each case
- ✅ Covers all verification types: RESIDENCE, OFFICE, BUSINESS, BUILDER, etc.

## 📋 Prerequisites

1. **Database Access**: Ensure your PostgreSQL database is running
2. **Field Agent**: At least one active field agent must exist in the database
3. **Environment Variables**: Proper database connection settings

## 🚀 Step-by-Step Instructions

### Step 1: Backend Database Cleanup and Seeding

```bash
# Navigate to backend directory
cd CRM-BACKEND

# Install dependencies (if not already done)
npm install

# Set environment variables (if not in .env file)
export DB_USER=postgres
export DB_HOST=localhost
export DB_NAME=crm_db
export DB_PASSWORD=your_password
export DB_PORT=5432

# Run the cleanup and seeding script
npm run clean-and-seed
```

**Expected Output:**
```
🚀 Starting case data cleanup and seeding process...
================================================
🧹 Cleaning database...
✅ Database cleaned successfully
👤 Finding field agent...
✅ Found field agent: John Doe (john.doe)
📝 Creating sample cases...
✅ Created case: CASE00011234 - Rajesh Kumar (RESIDENCE)
✅ Created case: CASE00021234 - Priya Sharma (OFFICE)
... (7 more cases)
🗑️ Clearing caches and storage...
================================================
🎉 Process completed successfully!
```

### Step 2: Frontend Cache Clearing

#### Option A: Manual Browser Clearing
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear localStorage and sessionStorage
4. Clear all cookies for the domain
5. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

#### Option B: Programmatic Clearing (Recommended)
```typescript
// In your React app, you can use the utility function
import { clearAllFrontendCache } from '@/utils/clearCache';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
await clearAllFrontendCache(queryClient);
```

#### Option C: Add a Debug Button (Development)
```tsx
// Add this to your development environment
import { useCacheClearer } from '@/utils/clearCache';
import { useQueryClient } from '@tanstack/react-query';

const DebugPanel = () => {
  const queryClient = useQueryClient();
  const { clearCache } = useCacheClearer();
  
  return (
    <button onClick={() => clearCache(queryClient, 'all')}>
      🧹 Clear All Cache
    </button>
  );
};
```

### Step 3: Mobile App Cache Clearing

#### Option A: Manual App Reset
1. Close the mobile app completely
2. Clear app data from device settings:
   - **Android**: Settings > Apps > CRM App > Storage > Clear Data
   - **iOS**: Delete and reinstall the app
3. Restart the app

#### Option B: Programmatic Clearing (Recommended)
```typescript
// In your React Native app
import { clearAllMobileCache } from '@/utils/clearCache';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
await clearAllMobileCache(queryClient);
```

#### Option C: Add a Debug Screen (Development)
```tsx
// Add this to your development build
import { useMobileCacheClearer } from '@/utils/clearCache';
import { useQueryClient } from '@tanstack/react-query';

const DebugScreen = () => {
  const queryClient = useQueryClient();
  const { clearCache } = useMobileCacheClearer();
  
  return (
    <View>
      <Button 
        title="🧹 Clear All Cache" 
        onPress={() => clearCache(queryClient, 'all')} 
      />
      <Button 
        title="🔐 Clear Cache (Keep Auth)" 
        onPress={() => clearCache(queryClient, 'keepAuth')} 
      />
    </View>
  );
};
```

## 📊 Created Cases Overview

The script creates 9 cases covering all verification types:

| Case ID | Applicant Name | Verification Type | Client | Location |
|---------|---------------|------------------|--------|----------|
| CASE0001xxxx | Rajesh Kumar | RESIDENCE | HDFC Bank | Bangalore |
| CASE0002xxxx | Priya Sharma | OFFICE | ICICI Bank | Bangalore |
| CASE0003xxxx | Amit Patel | BUSINESS | SBI Bank | Mumbai |
| CASE0004xxxx | Sunita Reddy | RESIDENCE_CUM_OFFICE | Axis Bank | Hyderabad |
| CASE0005xxxx | Vikram Singh | BUILDER | PNB Bank | Gurgaon |
| CASE0006xxxx | Meera Joshi | DSA_CONNECTOR | Kotak Bank | Pune |
| CASE0007xxxx | Ravi Gupta | PROPERTY_INDIVIDUAL | Yes Bank | Kolkata |
| CASE0008xxxx | Kavita Nair | PROPERTY_APF | HDFC Bank | Mumbai |
| CASE0009xxxx | Deepak Agarwal | NOC | Bank of Baroda | Delhi |

### Each Case Includes:
- ✅ Complete applicant information
- ✅ Valid address and contact details
- ✅ 3 sample attachments (ID proof, address proof, photo)
- ✅ Assigned to field agent
- ✅ Status: ASSIGNED (ready for verification)

## 🔍 Verification Steps

After running the cleanup and seeding:

### Backend Verification:
```bash
# Check if cases were created
psql -d crm_db -c "SELECT \"caseId\", \"applicantName\", \"verificationType\", status FROM cases ORDER BY \"createdAt\" DESC LIMIT 10;"

# Check attachments
psql -d crm_db -c "SELECT COUNT(*) as attachment_count FROM attachments;"
```

### Frontend Verification:
1. Login to the web application
2. Navigate to Cases page
3. Verify 9 new cases are visible
4. Check that each case has different verification types
5. Verify attachments are present

### Mobile App Verification:
1. Login to the mobile app
2. Check assigned cases list
3. Verify 9 cases are assigned to the field agent
4. Try opening a case to ensure data loads correctly

## 🚨 Troubleshooting

### Database Issues:
```bash
# If field agent not found
psql -d crm_db -c "INSERT INTO users (name, username, email, password, role, is_active, created_at, updated_at) VALUES ('Test Agent', 'test.agent', 'test@agent.com', 'hashed_password', 'FIELD', true, NOW(), NOW());"

# If clients not found, they will be auto-created
```

### Cache Issues:
```bash
# Force clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E

# Force clear mobile cache
# Restart the app or reinstall
```

### API Issues:
```bash
# Restart backend server
cd CRM-BACKEND
npm run dev

# Check API endpoints
curl http://localhost:3000/api/cases
```

## 🔄 Regular Maintenance

For ongoing development, you can run specific cleanup commands:

```bash
# Backend: Clean only cases (keep users, clients)
npm run clean-and-seed

# Frontend: Clear only case cache
clearCaseCache(queryClient);

# Mobile: Clear only case cache (keep auth)
clearCache(queryClient, 'keepAuth');
```

## ⚠️ Important Notes

1. **Production Warning**: Never run this in production! This will delete all case data.
2. **Backup**: Always backup your database before running cleanup scripts.
3. **Field Agent**: Ensure at least one field agent exists before running the script.
4. **Environment**: This is designed for development and testing environments only.
5. **Auth Tokens**: Mobile cache clearing may require re-authentication.

## 🎉 Success Indicators

You'll know the process worked when:
- ✅ Backend script completes without errors
- ✅ 9 new cases appear in the web application
- ✅ Mobile app shows 9 assigned cases
- ✅ Each case has 3 attachments
- ✅ All verification types are represented
- ✅ No old case data remains

Happy testing! 🚀
