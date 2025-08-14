// Test script to check department dialog functionality
// Run this in the browser console on the role-management page

async function testDialogDepartments() {
  console.log('🧪 Testing Department Dialog Functionality...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // Test the getActiveDepartments API endpoint directly
    console.log('📊 Testing getActiveDepartments API...');
    const activeDepartmentsResponse = await fetch('http://localhost:3000/api/departments?includeInactive=false&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const activeDepartmentsData = await activeDepartmentsResponse.json();
    console.log('📥 Active departments API response:', activeDepartmentsData);
    console.log(`📊 Active departments count: ${activeDepartmentsData.data?.length || 0}`);

    // Test the regular getDepartments API endpoint
    console.log('📊 Testing getDepartments API...');
    const allDepartmentsResponse = await fetch('http://localhost:3000/api/departments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const allDepartmentsData = await allDepartmentsResponse.json();
    console.log('📥 All departments API response:', allDepartmentsData);
    console.log(`📊 All departments count: ${allDepartmentsData.data?.length || 0}`);

    // Check if there's a difference
    if (activeDepartmentsData.data?.length !== allDepartmentsData.data?.length) {
      console.log('⚠️ Different counts between active and all departments');
      console.log('🔍 Checking for inactive departments...');
      
      const inactiveDepartments = allDepartmentsData.data?.filter(dept => !dept.is_active);
      console.log('📊 Inactive departments:', inactiveDepartments);
    } else {
      console.log('✅ Active and all departments have same count');
    }

    // List all department names for reference
    console.log('📋 All department names:');
    allDepartmentsData.data?.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.name} (${dept.is_active ? 'Active' : 'Inactive'})`);
    });

    // Test creating a department with a unique name
    const uniqueName = `Unique Dept ${Date.now()}`;
    console.log(`🧪 Testing creation of unique department: "${uniqueName}"`);
    
    const createResponse = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: uniqueName,
        description: 'Test department with unique name'
      })
    });

    const createData = await createResponse.json();
    console.log('📥 Create response:', createData);

    if (createResponse.ok && createData.success) {
      console.log('✅ Unique department created successfully!');
      
      // Wait a moment and check if it appears in the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await fetch('http://localhost:3000/api/departments?includeInactive=false&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const verifyData = await verifyResponse.json();
      const foundDept = verifyData.data?.find(dept => dept.name === uniqueName);
      
      if (foundDept) {
        console.log('✅ New department found in active departments API:', foundDept);
      } else {
        console.log('❌ New department not found in active departments API');
      }
    } else {
      console.error('❌ Failed to create unique department:', createData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Check if we're on the right page
if (window.location.pathname.includes('/role-management')) {
  console.log('🎯 Running department dialog test...');
  testDialogDepartments();
} else {
  console.log('⚠️ Please navigate to the role-management page first, then run this script');
}

// Also provide a manual test function
window.testDialogDepartments = testDialogDepartments;
