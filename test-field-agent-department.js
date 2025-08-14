// Test script to check why "Field Agent" department is not showing
// Run this in the browser console on the role-management page

async function testFieldAgentDepartment() {
  console.log('🧪 Testing Field Agent Department Visibility...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // Test 1: Check all departments API
    console.log('📊 Test 1: Checking all departments API...');
    const allDepartmentsResponse = await fetch('http://localhost:3000/api/departments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const allDepartmentsData = await allDepartmentsResponse.json();
    console.log('📥 All departments API response:', allDepartmentsData);
    
    const fieldAgentInAll = allDepartmentsData.data?.find(dept => 
      dept.name.toLowerCase().includes('field') || dept.name.toLowerCase().includes('agent')
    );
    
    if (fieldAgentInAll) {
      console.log('✅ Field Agent found in all departments:', fieldAgentInAll);
    } else {
      console.log('❌ Field Agent NOT found in all departments');
      console.log('📋 Available departments:', allDepartmentsData.data?.map(d => d.name));
    }

    // Test 2: Check active departments API (used by dialog)
    console.log('📊 Test 2: Checking active departments API...');
    const activeDepartmentsResponse = await fetch('http://localhost:3000/api/departments?includeInactive=false&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const activeDepartmentsData = await activeDepartmentsResponse.json();
    console.log('📥 Active departments API response:', activeDepartmentsData);
    
    const fieldAgentInActive = activeDepartmentsData.data?.find(dept => 
      dept.name.toLowerCase().includes('field') || dept.name.toLowerCase().includes('agent')
    );
    
    if (fieldAgentInActive) {
      console.log('✅ Field Agent found in active departments:', fieldAgentInActive);
    } else {
      console.log('❌ Field Agent NOT found in active departments');
      console.log('📋 Available active departments:', activeDepartmentsData.data?.map(d => d.name));
    }

    // Test 3: Check with search filter
    console.log('📊 Test 3: Checking with search filter...');
    const searchResponse = await fetch('http://localhost:3000/api/departments?search=field', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const searchData = await searchResponse.json();
    console.log('📥 Search "field" API response:', searchData);
    
    if (searchData.data?.length > 0) {
      console.log('✅ Field Agent found with search:', searchData.data);
    } else {
      console.log('❌ Field Agent NOT found with search');
    }

    // Test 4: Check React Query cache
    console.log('📊 Test 4: Checking React Query cache...');
    
    if (window.queryClient) {
      const cacheData = window.queryClient.getQueryData(['departments', { search: '' }]);
      console.log('📦 React Query cache data:', cacheData);
      
      if (cacheData?.data) {
        const fieldAgentInCache = cacheData.data.find(dept => 
          dept.name.toLowerCase().includes('field') || dept.name.toLowerCase().includes('agent')
        );
        
        if (fieldAgentInCache) {
          console.log('✅ Field Agent found in React Query cache:', fieldAgentInCache);
        } else {
          console.log('❌ Field Agent NOT found in React Query cache');
          console.log('📋 Cached departments:', cacheData.data.map(d => d.name));
        }
      }
      
      // Check active departments cache
      const activeCacheData = window.queryClient.getQueryData(['departments', 'active']);
      console.log('📦 Active departments cache data:', activeCacheData);
      
      if (activeCacheData?.data) {
        const fieldAgentInActiveCache = activeCacheData.data.find(dept => 
          dept.name.toLowerCase().includes('field') || dept.name.toLowerCase().includes('agent')
        );
        
        if (fieldAgentInActiveCache) {
          console.log('✅ Field Agent found in active departments cache:', fieldAgentInActiveCache);
        } else {
          console.log('❌ Field Agent NOT found in active departments cache');
          console.log('📋 Cached active departments:', activeCacheData.data.map(d => d.name));
        }
      }
    } else {
      console.log('⚠️ Query client not available in window object');
    }

    // Test 5: Force refresh and check again
    console.log('📊 Test 5: Force refresh and check...');
    
    if (window.queryClient) {
      console.log('🔄 Invalidating all department queries...');
      window.queryClient.invalidateQueries({ queryKey: ['departments'] });
      
      // Wait a moment for the refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const refreshedCacheData = window.queryClient.getQueryData(['departments', { search: '' }]);
      console.log('📦 Refreshed cache data:', refreshedCacheData);
      
      if (refreshedCacheData?.data) {
        const fieldAgentAfterRefresh = refreshedCacheData.data.find(dept => 
          dept.name.toLowerCase().includes('field') || dept.name.toLowerCase().includes('agent')
        );
        
        if (fieldAgentAfterRefresh) {
          console.log('✅ Field Agent found after refresh:', fieldAgentAfterRefresh);
        } else {
          console.log('❌ Field Agent STILL NOT found after refresh');
          console.log('📋 Departments after refresh:', refreshedCacheData.data.map(d => d.name));
        }
      }
    }

    // Summary
    console.log('📋 Summary:');
    console.log(`  - All departments API: ${fieldAgentInAll ? '✅ Found' : '❌ Not found'}`);
    console.log(`  - Active departments API: ${fieldAgentInActive ? '✅ Found' : '❌ Not found'}`);
    console.log(`  - Search API: ${searchData.data?.length > 0 ? '✅ Found' : '❌ Not found'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Check if we're on the right page
if (window.location.pathname.includes('/role-management')) {
  console.log('🎯 Running Field Agent department test...');
  testFieldAgentDepartment();
} else {
  console.log('⚠️ Please navigate to the role-management page first, then run this script');
}

// Also provide a manual test function
window.testFieldAgentDepartment = testFieldAgentDepartment;
