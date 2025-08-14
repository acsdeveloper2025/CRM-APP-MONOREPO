// Test script to verify search functionality across all Role Management tabs
// Run this in the browser console on the role-management page

async function testSearchFunctionality() {
  console.log('🧪 Testing Search Functionality Across All Tabs...');
  
  try {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('❌ No auth token found. Please log in first.');
      return;
    }
    console.log('✅ Auth token found');

    // Test 1: Departments Search
    console.log('\n📊 Test 1: Testing Departments Search API...');
    const deptSearchResponse = await fetch('http://localhost:3000/api/departments?search=sales&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const deptSearchData = await deptSearchResponse.json();
    console.log('📥 Departments search API response:', deptSearchData);
    
    if (deptSearchData.success && deptSearchData.data) {
      console.log(`✅ Departments search working: Found ${deptSearchData.data.length} results for "sales"`);
      console.log('📋 Department search results:', deptSearchData.data.map(d => d.name));
    } else {
      console.log('❌ Departments search API failed');
    }

    // Test 2: Roles Search
    console.log('\n📊 Test 2: Testing Roles Search API...');
    const rolesSearchResponse = await fetch('http://localhost:3000/api/roles?search=admin&limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const rolesSearchData = await rolesSearchResponse.json();
    console.log('📥 Roles search API response:', rolesSearchData);
    
    if (rolesSearchData.success && rolesSearchData.data) {
      console.log(`✅ Roles search working: Found ${rolesSearchData.data.length} results for "admin"`);
      console.log('📋 Roles search results:', rolesSearchData.data.map(r => r.name));
    } else {
      console.log('❌ Roles search API failed');
    }

    // Test 3: Designations Search
    console.log('\n📊 Test 3: Testing Designations Search API...');
    const designationsSearchResponse = await fetch('http://localhost:3000/api/designations?search=manager&limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const designationsSearchData = await designationsSearchResponse.json();
    console.log('📥 Designations search API response:', designationsSearchData);
    
    if (designationsSearchData.success && designationsSearchData.data) {
      console.log(`✅ Designations search working: Found ${designationsSearchData.data.length} results for "manager"`);
      console.log('📋 Designations search results:', designationsSearchData.data.map(d => d.name));
    } else {
      console.log('❌ Designations search API failed');
    }

    // Test 4: UI Search Functionality
    console.log('\n🎨 Test 4: Testing UI Search Functionality...');
    
    // Test Departments tab
    console.log('🔍 Testing Departments tab search...');
    const departmentsTab = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.toLowerCase().includes('departments')
    );
    
    if (departmentsTab) {
      departmentsTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const deptSearchInput = document.querySelector('input[placeholder*="departments"]');
      if (deptSearchInput) {
        console.log('✅ Departments search input found');
        
        // Test typing in search
        deptSearchInput.value = 'test';
        deptSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Departments search input test completed');
      } else {
        console.log('❌ Departments search input not found');
      }
    }

    // Test Roles tab
    console.log('🔍 Testing Roles tab search...');
    const rolesTab = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.toLowerCase().includes('roles')
    );
    
    if (rolesTab) {
      rolesTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rolesSearchInput = document.querySelector('input[placeholder*="roles"]');
      if (rolesSearchInput) {
        console.log('✅ Roles search input found');
        
        // Test typing in search
        rolesSearchInput.value = 'admin';
        rolesSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Roles search input test completed');
      } else {
        console.log('❌ Roles search input not found');
      }
    }

    // Test Designations tab
    console.log('🔍 Testing Designations tab search...');
    const designationsTab = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.toLowerCase().includes('designations')
    );
    
    if (designationsTab) {
      designationsTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const designationsSearchInput = document.querySelector('input[placeholder*="designations"]');
      if (designationsSearchInput) {
        console.log('✅ Designations search input found');
        
        // Test typing in search
        designationsSearchInput.value = 'manager';
        designationsSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('✅ Designations search input test completed');
      } else {
        console.log('❌ Designations search input not found');
      }
    }

    // Test 5: Debouncing Functionality
    console.log('\n⏱️ Test 5: Testing Debouncing Functionality...');
    console.log('ℹ️ Debouncing is working if you see a spinning icon when typing and API calls are delayed by 300ms');
    
    // Summary
    console.log('\n📋 Search Functionality Test Summary:');
    console.log(`  - Departments API: ${deptSearchData.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`  - Roles API: ${rolesSearchData.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`  - Designations API: ${designationsSearchData.success ? '✅ Working' : '❌ Failed'}`);
    console.log('  - UI Search Inputs: Check console messages above');
    console.log('  - Debouncing: Visual feedback with spinning icons');
    
    console.log('\n🎉 Search functionality test completed!');
    console.log('💡 Expected behavior:');
    console.log('  - Type in search boxes to see real-time filtering');
    console.log('  - 300ms debounce delay prevents excessive API calls');
    console.log('  - Spinning icon shows when search is being processed');
    console.log('  - Results update automatically without pressing Enter');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Test debouncing specifically
async function testDebouncing() {
  console.log('⏱️ Testing Debouncing Behavior...');
  
  // Find any search input
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (!searchInput) {
    console.log('❌ No search input found. Please navigate to a tab with search functionality.');
    return;
  }
  
  console.log('✅ Search input found, testing debouncing...');
  
  // Simulate rapid typing
  const testQueries = ['a', 'ad', 'adm', 'admi', 'admin'];
  
  for (let i = 0; i < testQueries.length; i++) {
    searchInput.value = testQueries[i];
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log(`⌨️ Typed: "${testQueries[i]}"`);
    
    // Check for spinning icon
    const spinningIcon = document.querySelector('.animate-spin');
    if (spinningIcon) {
      console.log('🔄 Spinning icon visible - debouncing working!');
    }
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Fast typing simulation
  }
  
  console.log('⏱️ Waiting for debounce to complete...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('✅ Debouncing test completed!');
}

// Check if we're on the right page
if (window.location.pathname.includes('/role-management')) {
  console.log('🎯 Running search functionality tests...');
  testSearchFunctionality();
} else {
  console.log('⚠️ Please navigate to the role-management page first, then run this script');
}

// Also provide manual test functions
window.testSearchFunctionality = testSearchFunctionality;
window.testDebouncing = testDebouncing;
