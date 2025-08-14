// Test script to verify department creation functionality
// Run this in the browser console on the users page

async function testDepartmentCreation() {
  console.log('🧪 Testing Department Creation Functionality...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // Test API endpoint directly
    const testDepartment = {
      name: `Test Dept ${Date.now()}`,
      description: 'Test department created via console'
    };

    console.log('📤 Sending POST request to create department:', testDepartment);

    const response = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testDepartment)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📥 Response data:', data);

    if (response.ok && data.success) {
      console.log('✅ Department creation successful!');
      console.log('🆔 Created department ID:', data.data.id);
      
      // Test the departments service
      console.log('🧪 Testing departmentsService...');
      
      // Check if departmentsService is available
      if (typeof window.departmentsService !== 'undefined') {
        console.log('✅ departmentsService is available');
        try {
          const serviceResult = await window.departmentsService.createDepartment({
            name: `Service Test ${Date.now()}`,
            description: 'Test via service'
          });
          console.log('✅ Service test successful:', serviceResult);
        } catch (serviceError) {
          console.error('❌ Service test failed:', serviceError);
        }
      } else {
        console.log('⚠️ departmentsService not available in window object');
      }
      
    } else {
      console.error('❌ Department creation failed:', data);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Check if we're on the right page
if (window.location.pathname.includes('/users')) {
  console.log('🎯 Running department creation test...');
  testDepartmentCreation();
} else {
  console.log('⚠️ Please navigate to the users page first, then run this script');
}
