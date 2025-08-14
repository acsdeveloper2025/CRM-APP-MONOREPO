// Test script to verify simplified department creation works
// Run this in the browser console on the role-management page

async function testSimplifiedDepartmentCreation() {
  console.log('🧪 Testing Simplified Department Creation...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // Test creating a department with simplified data (no parent_department_id)
    const uniqueName = `Simple Dept ${Date.now()}`;
    console.log(`🧪 Testing creation of simplified department: "${uniqueName}"`);
    
    const createResponse = await fetch('http://localhost:3000/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: uniqueName,
        description: 'Test department with simplified structure (no parent)'
      })
    });

    const createData = await createResponse.json();
    console.log('📥 Create response:', createData);

    if (createResponse.ok && createData.success) {
      console.log('✅ Simplified department created successfully!');
      console.log('📊 Created department data:', {
        id: createData.data.id,
        name: createData.data.name,
        description: createData.data.description,
        parent_department_id: createData.data.parent_department_id, // Should be null
        department_head_id: createData.data.department_head_id,
        is_active: createData.data.is_active
      });
      
      // Verify parent_department_id is null
      if (createData.data.parent_department_id === null) {
        console.log('✅ Confirmed: parent_department_id is null (as expected)');
      } else {
        console.log('⚠️ Warning: parent_department_id is not null:', createData.data.parent_department_id);
      }
      
      // Wait a moment and check if it appears in the departments list
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const verifyResponse = await fetch('http://localhost:3000/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const verifyData = await verifyResponse.json();
      const foundDept = verifyData.data?.find(dept => dept.name === uniqueName);
      
      if (foundDept) {
        console.log('✅ New simplified department found in departments list:', foundDept);
      } else {
        console.log('❌ New simplified department not found in departments list');
      }
      
      return createData.data;
    } else {
      console.error('❌ Failed to create simplified department:', createData);
      return null;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return null;
  }
}

// Test the UI functionality
async function testUIFunctionality() {
  console.log('🎨 Testing UI Functionality...');
  
  // Check if Create Department dialog opens without errors
  try {
    // Look for the Create Department button
    const createButton = document.querySelector('button:contains("Create Department")') || 
                        Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent.includes('Create Department') || 
                          btn.textContent.includes('Create')
                        );
    
    if (createButton) {
      console.log('✅ Create Department button found');
      
      // Check if clicking it opens the dialog without errors
      console.log('🖱️ Simulating click on Create Department button...');
      createButton.click();
      
      // Wait a moment for dialog to open
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if dialog opened
      const dialog = document.querySelector('[role="dialog"]') || 
                    document.querySelector('.dialog') ||
                    document.querySelector('[data-state="open"]');
      
      if (dialog) {
        console.log('✅ Create Department dialog opened successfully');
        
        // Check if parent department field is NOT present
        const parentField = Array.from(document.querySelectorAll('label')).find(label => 
          label.textContent.toLowerCase().includes('parent')
        );
        
        if (!parentField) {
          console.log('✅ Confirmed: Parent Department field is not present in dialog');
        } else {
          console.log('❌ Warning: Parent Department field still exists in dialog');
        }
        
        // Check if department head field is present
        const headField = Array.from(document.querySelectorAll('label')).find(label => 
          label.textContent.toLowerCase().includes('head')
        );
        
        if (headField) {
          console.log('✅ Confirmed: Department Head field is present in dialog');
        } else {
          console.log('⚠️ Warning: Department Head field not found in dialog');
        }
        
        // Close dialog by pressing Escape or clicking close
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        
      } else {
        console.log('❌ Create Department dialog did not open');
      }
    } else {
      console.log('❌ Create Department button not found');
    }
  } catch (error) {
    console.error('❌ UI test failed:', error);
  }
}

// Check if we're on the right page
if (window.location.pathname.includes('/role-management')) {
  console.log('🎯 Running simplified department creation tests...');
  
  // Run API test
  testSimplifiedDepartmentCreation().then(result => {
    if (result) {
      console.log('🎉 API test completed successfully!');
    }
    
    // Run UI test
    return testUIFunctionality();
  }).then(() => {
    console.log('🎉 All tests completed!');
  });
} else {
  console.log('⚠️ Please navigate to the role-management page first, then run this script');
}

// Also provide manual test functions
window.testSimplifiedDepartmentCreation = testSimplifiedDepartmentCreation;
window.testUIFunctionality = testUIFunctionality;
