/**
 * Comprehensive End-to-End Case Workflow Testing
 * Tests the complete case lifecycle from creation to completion
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  MOBILE_API_BASE_URL: 'http://localhost:3000/api/mobile',
  TEST_USER_ID: '70dcf247-759c-405d-a8fb-4c78b7b77747', // Backend user
  FIELD_AGENT_ID: 'bffea46e-57ab-4be8-b058-7557993af553', // Field agent
  AUTH_TOKEN: 'test-token' // Mock token for testing
};

// Mock case data for testing
const TEST_CASE_DATA = {
  customerName: 'E2E Test Customer',
  customerCallingCode: 'CC-' + Date.now(),
  customerPhone: '9876543999',
  createdByBackendUser: TEST_CONFIG.TEST_USER_ID,
  clientId: 1,
  productId: 4,
  verificationTypeId: 1,
  address: '123 E2E Test Street, Test City',
  pincode: '400001',
  applicantType: 'APPLICANT',
  backendContactNumber: '9876543210',
  trigger: 'End-to-end workflow testing',
  priority: 'HIGH'
};

// Mock verification form data
const VERIFICATION_FORM_DATA = {
  applicantName: 'E2E Test Customer',
  addressConfirmed: true,
  residenceType: 'OWNED',
  familyMembers: 4,
  neighborVerification: true,
  remarks: 'E2E test verification submission',
  outcome: 'VERIFIED',
  addressRating: 'EXCELLENT',
  locality: 'RESIDENTIAL',
  stayingPeriod: '5_YEARS_PLUS',
  stayingStatus: 'PERMANENT',
  politicalConnection: 'NO',
  dominatedArea: 'NO',
  recommendationStatus: 'POSITIVE'
};

// Mock images with geo-location
const MOCK_IMAGES = [
  { id: 'img-1', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-2', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-3', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-4', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-5', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } }
];

const GEO_LOCATION = { latitude: 19.0760, longitude: 72.8777, accuracy: 10 };

// Helper function to make API calls
async function makeAPICall(url, method = 'GET', data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_CONFIG.AUTH_TOKEN}`,
      ...headers
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to query database
async function queryDatabase(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Test 1: Case Creation from Web Frontend
async function testCaseCreation() {
  console.log('\n🧪 Test 1: Case Creation from Web Frontend');
  console.log('===========================================');

  try {
    // Create case via API (simulating web frontend)
    const createResponse = await makeAPICall(
      `${TEST_CONFIG.API_BASE_URL}/cases`,
      'POST',
      TEST_CASE_DATA
    );

    if (!createResponse.success) {
      throw new Error(`Case creation failed: ${JSON.stringify(createResponse)}`);
    }

    const caseId = createResponse.data.data?.id || createResponse.data.id;
    console.log(`✅ Case created successfully with ID: ${caseId}`);

    // Verify case in database
    const dbCases = await queryDatabase(
      'SELECT id, "caseId", "customerName", status, "assignedTo", "createdAt" FROM cases WHERE id = $1',
      [caseId]
    );

    if (dbCases.length === 0) {
      throw new Error('Case not found in database');
    }

    const dbCase = dbCases[0];
    console.log(`✅ Case verified in database:`);
    console.log(`   - Database ID: ${dbCase.id}`);
    console.log(`   - Case ID: ${dbCase.caseId}`);
    console.log(`   - Customer: ${dbCase.customerName}`);
    console.log(`   - Status: ${dbCase.status}`);
    console.log(`   - Assigned To: ${dbCase.assignedTo}`);

    // Verify initial status
    if (dbCase.status !== 'PENDING') {
      console.log(`⚠️  Expected status 'PENDING', got '${dbCase.status}'`);
    } else {
      console.log(`✅ Initial status is correct: ${dbCase.status}`);
    }

    return {
      success: true,
      caseId: caseId,
      dbCaseId: dbCase.caseId,
      initialStatus: dbCase.status
    };

  } catch (error) {
    console.error(`❌ Case creation test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Mobile App Case Access and Status Updates
async function testMobileCaseAccess(caseId) {
  console.log('\n🧪 Test 2: Mobile App Case Access');
  console.log('==================================');

  try {
    // Get case from mobile API (simulating field agent access)
    const mobileResponse = await makeAPICall(
      `${TEST_CONFIG.MOBILE_API_BASE_URL}/cases/${caseId}`,
      'GET'
    );

    if (!mobileResponse.success) {
      throw new Error(`Mobile case access failed: ${JSON.stringify(mobileResponse)}`);
    }

    console.log(`✅ Case accessible from mobile app`);
    console.log(`   - Case ID: ${mobileResponse.data.data.id}`);
    console.log(`   - Customer: ${mobileResponse.data.data.customerName}`);
    console.log(`   - Status: ${mobileResponse.data.data.status}`);

    return {
      success: true,
      mobileCase: mobileResponse.data.data
    };

  } catch (error) {
    console.error(`❌ Mobile case access test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Verification Form Submission
async function testVerificationFormSubmission(caseId) {
  console.log('\n🧪 Test 3: Verification Form Submission');
  console.log('=======================================');

  try {
    // Prepare verification submission data
    const submissionData = {
      formData: VERIFICATION_FORM_DATA,
      attachmentIds: MOCK_IMAGES.map(img => img.id),
      geoLocation: GEO_LOCATION,
      photos: MOCK_IMAGES.map(img => ({
        attachmentId: img.id,
        geoLocation: img.geoLocation
      }))
    };

    // Submit residence verification form
    const submitResponse = await makeAPICall(
      `${TEST_CONFIG.MOBILE_API_BASE_URL}/cases/${caseId}/verification/residence`,
      'POST',
      submissionData
    );

    if (!submitResponse.success) {
      throw new Error(`Verification submission failed: ${JSON.stringify(submitResponse)}`);
    }

    console.log(`✅ Verification form submitted successfully`);
    console.log(`   - Case ID: ${submitResponse.data.data.caseId}`);
    console.log(`   - New Status: ${submitResponse.data.data.status}`);
    console.log(`   - Completed At: ${submitResponse.data.data.completedAt}`);

    return {
      success: true,
      submissionResult: submitResponse.data.data
    };

  } catch (error) {
    console.error(`❌ Verification form submission test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Status Update Verification
async function testStatusUpdateVerification(caseId) {
  console.log('\n🧪 Test 4: Status Update Verification');
  console.log('=====================================');

  try {
    // Check database for updated status
    const dbCases = await queryDatabase(
      `SELECT id, "caseId", "customerName", status, "completedAt", "verificationData", 
              "verificationType", "verificationOutcome", "updatedAt" 
       FROM cases WHERE id = $1`,
      [caseId]
    );

    if (dbCases.length === 0) {
      throw new Error('Case not found in database');
    }

    const dbCase = dbCases[0];
    console.log(`✅ Case status verification:`);
    console.log(`   - Status: ${dbCase.status}`);
    console.log(`   - Completed At: ${dbCase.completedAt}`);
    console.log(`   - Verification Type: ${dbCase.verificationType}`);
    console.log(`   - Verification Outcome: ${dbCase.verificationOutcome}`);
    console.log(`   - Has Verification Data: ${!!dbCase.verificationData}`);

    // Verify status changed to COMPLETED
    if (dbCase.status !== 'COMPLETED') {
      throw new Error(`Expected status 'COMPLETED', got '${dbCase.status}'`);
    }

    // Verify completedAt is set
    if (!dbCase.completedAt) {
      throw new Error('completedAt timestamp not set');
    }

    // Verify verification data is stored
    if (!dbCase.verificationData) {
      throw new Error('Verification data not stored');
    }

    console.log(`✅ All status updates verified successfully`);

    return {
      success: true,
      finalStatus: dbCase.status,
      completedAt: dbCase.completedAt,
      hasVerificationData: !!dbCase.verificationData
    };

  } catch (error) {
    console.error(`❌ Status update verification failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 5: Cross-Platform Consistency
async function testCrossPlatformConsistency(caseId) {
  console.log('\n🧪 Test 5: Cross-Platform Consistency');
  console.log('======================================');

  try {
    // Get case from web API
    const webResponse = await makeAPICall(`${TEST_CONFIG.API_BASE_URL}/cases/${caseId}`);
    
    // Get case from mobile API
    const mobileResponse = await makeAPICall(`${TEST_CONFIG.MOBILE_API_BASE_URL}/cases/${caseId}`);

    if (!webResponse.success || !mobileResponse.success) {
      throw new Error('Failed to fetch case from both platforms');
    }

    const webCase = webResponse.data.data || webResponse.data;
    const mobileCase = mobileResponse.data.data || mobileResponse.data;

    console.log(`✅ Cross-platform data consistency:`);
    console.log(`   - Web Status: ${webCase.status}`);
    console.log(`   - Mobile Status: ${mobileCase.status}`);
    console.log(`   - Status Match: ${webCase.status === mobileCase.status ? '✅' : '❌'}`);

    if (webCase.status !== mobileCase.status) {
      throw new Error(`Status mismatch: Web=${webCase.status}, Mobile=${mobileCase.status}`);
    }

    return {
      success: true,
      webStatus: webCase.status,
      mobileStatus: mobileCase.status,
      consistent: webCase.status === mobileCase.status
    };

  } catch (error) {
    console.error(`❌ Cross-platform consistency test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runCompleteWorkflowTest() {
  console.log('🚀 Starting Comprehensive End-to-End Case Workflow Testing');
  console.log('===========================================================');

  const results = {
    caseCreation: null,
    mobileAccess: null,
    verificationSubmission: null,
    statusVerification: null,
    crossPlatformConsistency: null
  };

  try {
    // Test 1: Case Creation
    results.caseCreation = await testCaseCreation();
    if (!results.caseCreation.success) {
      throw new Error('Case creation failed - stopping tests');
    }

    const caseId = results.caseCreation.caseId;

    // Test 2: Mobile Access
    results.mobileAccess = await testMobileCaseAccess(caseId);

    // Test 3: Verification Form Submission
    results.verificationSubmission = await testVerificationFormSubmission(caseId);

    // Test 4: Status Update Verification
    results.statusVerification = await testStatusUpdateVerification(caseId);

    // Test 5: Cross-Platform Consistency
    results.crossPlatformConsistency = await testCrossPlatformConsistency(caseId);

    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Case Creation: ${results.caseCreation.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Mobile Access: ${results.mobileAccess?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Verification Submission: ${results.verificationSubmission?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Status Verification: ${results.statusVerification?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Cross-Platform Consistency: ${results.crossPlatformConsistency?.success ? 'PASSED' : 'FAILED'}`);

    const allPassed = Object.values(results).every(result => result?.success);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! End-to-end workflow is working correctly!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the results above.');
    }

    return { success: allPassed, results };

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    return { success: false, error: error.message, results };
  } finally {
    await pool.end();
  }
}

// Run the tests
runCompleteWorkflowTest();
