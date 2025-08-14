// Test script to verify department creation and refresh functionality
// Run this in the browser console on the role-management page

async function testDepartmentRefresh() {
  console.log('🧪 Testing Department Creation and Refresh...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // First, get current department count
    console.log('📊 Getting current department count...');
    const currentResponse = await fetch('http://localhost:3000/api/departments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const currentData = await currentResponse.json();
    const currentCount = currentData.data?.length || 0;
    console.log(`📊 Current department count: ${currentCount}`);

    // Create a new department with unique name
    const uniqueName = `Test Dept ${Date.now()}`;
    const testDepartment = {
      name: uniqueName,
      description: 'Test department for refresh testing'
    };

    console.log('📤 Creating new department:', testDepartment);

    const createResponse = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testDepartment)
    });

    const createData = await createResponse.json();
    console.log('📥 Create response:', createData);

    if (createResponse.ok && createData.success) {
      console.log('✅ Department created successfully!');
      
      // Wait a moment for the frontend to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the department appears in the API
      const verifyResponse = await fetch('http://localhost:3000/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const verifyData = await verifyResponse.json();
      const newCount = verifyData.data?.length || 0;
      
      console.log(`📊 New department count: ${newCount}`);
      
      if (newCount > currentCount) {
        console.log('✅ Department count increased - API is working correctly');
        
        // Check if the specific department exists
        const foundDept = verifyData.data.find(dept => dept.name === uniqueName);
        if (foundDept) {
          console.log('✅ New department found in API response:', foundDept);
        } else {
          console.log('❌ New department not found in API response');
        }
      } else {
        console.log('❌ Department count did not increase');
      }
      
      // Check if React Query cache is being updated
      console.log('🔍 Checking React Query cache...');
      
      // Try to access the query client if available
      if (window.queryClient) {
        const cacheData = window.queryClient.getQueryData(['departments']);
        console.log('📦 React Query cache data:', cacheData);
      } else {
        console.log('⚠️ Query client not available in window object');
      }
      
    } else {
      console.error('❌ Department creation failed:', createData);
      
      // Test duplicate name error
      if (createData.error?.code === 'DUPLICATE_DEPARTMENT_NAME') {
        console.log('🧪 Testing duplicate name error...');
        
        const duplicateResponse = await fetch('http://localhost:3000/api/departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testDepartment)
        });
        
        const duplicateData = await duplicateResponse.json();
        console.log('📥 Duplicate response:', duplicateData);
        
        if (duplicateResponse.status === 400 && duplicateData.error?.code === 'DUPLICATE_DEPARTMENT_NAME') {
          console.log('✅ Duplicate name validation working correctly');
        } else {
          console.log('❌ Duplicate name validation not working as expected');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Check if we're on the right page
if (window.location.pathname.includes('/role-management')) {
  console.log('🎯 Running department refresh test...');
  testDepartmentRefresh();
} else {
  console.log('⚠️ Please navigate to the role-management page first, then run this script');
}

// Also provide a manual test function
window.testDepartmentRefresh = testDepartmentRefresh;
