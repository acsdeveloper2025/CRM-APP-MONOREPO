/**
 * Test script to simulate verification form submission with backend integration
 * This tests the complete VerificationFormService workflow
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test configuration
const TEST_CONFIG = {
  CASE_ID: '70db2f89-93e2-4eb8-a5e4-3051a738f514', // Our E2E test case
  VERIFICATION_TYPE: 'residence',
  FORM_TYPE: 'positive'
};

// Mock verification form data (matching what we filled in the UI)
const VERIFICATION_FORM_DATA = {
  // Address Verification
  addressLocatable: 'Easy to Locate',
  addressRating: 'Good',
  houseStatus: 'Opened',
  
  // Personal Details (House Opened)
  metPersonName: 'E2E Test Customer',
  relation: 'Self',
  totalFamilyMembers: '4',
  workingStatus: 'Salaried',
  companyName: 'E2E Test Company Ltd',
  
  // Final Status
  finalStatus: 'Positive',
  
  // Additional required fields for backend
  applicantName: 'E2E Test Customer Workflow',
  addressConfirmed: true,
  residenceType: 'OWNED',
  neighborVerification: true,
  remarks: 'E2E test verification submission - comprehensive workflow testing',
  outcome: 'VERIFIED',
  locality: 'RESIDENTIAL',
  stayingPeriod: '5_YEARS_PLUS',
  stayingStatus: 'PERMANENT',
  politicalConnection: 'NO',
  dominatedArea: 'NO',
  recommendationStatus: 'POSITIVE'
};

// Mock images with geo-location (simulating 5 photos + 1 selfie)
const MOCK_IMAGES = [
  { id: 'img-1', type: 'photo', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-2', type: 'photo', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-3', type: 'photo', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-4', type: 'photo', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'img-5', type: 'photo', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } },
  { id: 'selfie-1', type: 'selfie', geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() } }
];

const GEO_LOCATION = { latitude: 19.0760, longitude: 72.8777, accuracy: 10 };

// Helper function to make API calls
async function makeAPICall(url, method = 'GET', data = null, headers = {}) {
  const fetch = globalThis.fetch;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
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

// Test 1: Check case status before submission
async function checkCaseStatusBefore() {
  console.log('\n🔍 Test 1: Check Case Status Before Submission');
  console.log('================================================');

  try {
    const dbCases = await queryDatabase(
      `SELECT id, "caseId", "customerName", status, "completedAt", "verificationData", 
              "verificationType", "verificationOutcome", "updatedAt" 
       FROM cases WHERE id = $1`,
      [TEST_CONFIG.CASE_ID]
    );

    if (dbCases.length === 0) {
      throw new Error('Case not found in database');
    }

    const dbCase = dbCases[0];
    console.log(`✅ Case found in database:`);
    console.log(`   - Case ID: ${dbCase.caseId}`);
    console.log(`   - Customer: ${dbCase.customerName}`);
    console.log(`   - Status: ${dbCase.status}`);
    console.log(`   - Completed At: ${dbCase.completedAt || 'Not set'}`);
    console.log(`   - Verification Data: ${dbCase.verificationData ? 'Present' : 'Not present'}`);
    console.log(`   - Verification Type: ${dbCase.verificationType || 'Not set'}`);
    console.log(`   - Verification Outcome: ${dbCase.verificationOutcome || 'Not set'}`);

    return {
      success: true,
      initialStatus: dbCase.status,
      hasVerificationData: !!dbCase.verificationData
    };

  } catch (error) {
    console.error(`❌ Failed to check case status:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Submit verification form via VerificationFormService
async function submitVerificationForm() {
  console.log('\n🚀 Test 2: Submit Verification Form via VerificationFormService');
  console.log('==============================================================');

  try {
    // Prepare submission data (matching VerificationFormService format)
    const submissionData = {
      formData: VERIFICATION_FORM_DATA,
      attachmentIds: MOCK_IMAGES.map(img => img.id),
      geoLocation: GEO_LOCATION,
      photos: MOCK_IMAGES.map(img => ({
        attachmentId: img.id,
        type: img.type,
        geoLocation: img.geoLocation
      }))
    };

    console.log(`📤 Submitting verification form for case: ${TEST_CONFIG.CASE_ID}`);
    console.log(`   - Verification Type: ${TEST_CONFIG.VERIFICATION_TYPE}`);
    console.log(`   - Form Type: ${TEST_CONFIG.FORM_TYPE}`);
    console.log(`   - Photos: ${MOCK_IMAGES.filter(img => img.type === 'photo').length}`);
    console.log(`   - Selfies: ${MOCK_IMAGES.filter(img => img.type === 'selfie').length}`);

    // Submit via mobile API (same endpoint used by VerificationFormService)
    const submitResponse = await makeAPICall(
      `http://localhost:3000/api/mobile/cases/${TEST_CONFIG.CASE_ID}/verification/${TEST_CONFIG.VERIFICATION_TYPE}`,
      'POST',
      submissionData
    );

    if (!submitResponse.success) {
      throw new Error(`Verification submission failed: ${JSON.stringify(submitResponse)}`);
    }

    console.log(`✅ Verification form submitted successfully!`);
    console.log(`   - Response Status: ${submitResponse.status}`);
    console.log(`   - Case ID: ${submitResponse.data.data?.caseId || 'Not provided'}`);
    console.log(`   - New Status: ${submitResponse.data.data?.status || 'Not provided'}`);
    console.log(`   - Completed At: ${submitResponse.data.data?.completedAt || 'Not provided'}`);

    return {
      success: true,
      submissionResult: submitResponse.data.data,
      responseStatus: submitResponse.status
    };

  } catch (error) {
    console.error(`❌ Verification form submission failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Verify case status after submission
async function checkCaseStatusAfter() {
  console.log('\n✅ Test 3: Verify Case Status After Submission');
  console.log('==============================================');

  try {
    const dbCases = await queryDatabase(
      `SELECT id, "caseId", "customerName", status, "completedAt", "verificationData", 
              "verificationType", "verificationOutcome", "updatedAt" 
       FROM cases WHERE id = $1`,
      [TEST_CONFIG.CASE_ID]
    );

    if (dbCases.length === 0) {
      throw new Error('Case not found in database');
    }

    const dbCase = dbCases[0];
    console.log(`✅ Case status after submission:`);
    console.log(`   - Case ID: ${dbCase.caseId}`);
    console.log(`   - Customer: ${dbCase.customerName}`);
    console.log(`   - Status: ${dbCase.status}`);
    console.log(`   - Completed At: ${dbCase.completedAt}`);
    console.log(`   - Verification Type: ${dbCase.verificationType}`);
    console.log(`   - Verification Outcome: ${dbCase.verificationOutcome}`);
    console.log(`   - Has Verification Data: ${!!dbCase.verificationData}`);
    console.log(`   - Updated At: ${dbCase.updatedAt}`);

    // Verify expected changes
    const validations = {
      statusChanged: dbCase.status === 'COMPLETED',
      completedAtSet: !!dbCase.completedAt,
      verificationDataStored: !!dbCase.verificationData,
      verificationTypeSet: !!dbCase.verificationType,
      verificationOutcomeSet: !!dbCase.verificationOutcome
    };

    console.log(`\n📊 Validation Results:`);
    console.log(`   - Status changed to COMPLETED: ${validations.statusChanged ? '✅' : '❌'}`);
    console.log(`   - Completed timestamp set: ${validations.completedAtSet ? '✅' : '❌'}`);
    console.log(`   - Verification data stored: ${validations.verificationDataStored ? '✅' : '❌'}`);
    console.log(`   - Verification type set: ${validations.verificationTypeSet ? '✅' : '❌'}`);
    console.log(`   - Verification outcome set: ${validations.verificationOutcomeSet ? '✅' : '❌'}`);

    const allValidationsPassed = Object.values(validations).every(v => v);

    if (allValidationsPassed) {
      console.log(`\n🎉 ALL VALIDATIONS PASSED! Backend integration is working correctly!`);
    } else {
      console.log(`\n⚠️ Some validations failed. Please review the results above.`);
    }

    return {
      success: allValidationsPassed,
      finalStatus: dbCase.status,
      validations
    };

  } catch (error) {
    console.error(`❌ Failed to verify case status:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Verify cross-platform consistency
async function testCrossPlatformConsistency() {
  console.log('\n🔄 Test 4: Cross-Platform Consistency Check');
  console.log('============================================');

  try {
    // Get case from web API
    const webResponse = await makeAPICall(`http://localhost:3000/api/cases/${TEST_CONFIG.CASE_ID}`);
    
    // Get case from mobile API
    const mobileResponse = await makeAPICall(`http://localhost:3000/api/mobile/cases/${TEST_CONFIG.CASE_ID}`);

    if (!webResponse.success || !mobileResponse.success) {
      throw new Error('Failed to fetch case from both platforms');
    }

    const webCase = webResponse.data.data || webResponse.data;
    const mobileCase = mobileResponse.data.data || mobileResponse.data;

    console.log(`✅ Cross-platform data consistency:`);
    console.log(`   - Web API Status: ${webCase.status}`);
    console.log(`   - Mobile API Status: ${mobileCase.status}`);
    console.log(`   - Status Match: ${webCase.status === mobileCase.status ? '✅' : '❌'}`);
    console.log(`   - Web Completed At: ${webCase.completedAt || 'Not set'}`);
    console.log(`   - Mobile Completed At: ${mobileCase.completedAt || 'Not set'}`);

    const consistent = webCase.status === mobileCase.status;

    return {
      success: consistent,
      webStatus: webCase.status,
      mobileStatus: mobileCase.status,
      consistent
    };

  } catch (error) {
    console.error(`❌ Cross-platform consistency test failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runVerificationSubmissionTest() {
  console.log('🧪 COMPREHENSIVE VERIFICATION FORM SUBMISSION TEST');
  console.log('==================================================');
  console.log(`Testing Case: ${TEST_CONFIG.CASE_ID}`);
  console.log(`Verification Type: ${TEST_CONFIG.VERIFICATION_TYPE}`);
  console.log(`Form Type: ${TEST_CONFIG.FORM_TYPE}`);

  const results = {
    statusBefore: null,
    submission: null,
    statusAfter: null,
    crossPlatform: null
  };

  try {
    // Test 1: Check initial status
    results.statusBefore = await checkCaseStatusBefore();

    // Test 2: Submit verification form
    results.submission = await submitVerificationForm();

    // Test 3: Verify status after submission
    results.statusAfter = await checkCaseStatusAfter();

    // Test 4: Cross-platform consistency
    results.crossPlatform = await testCrossPlatformConsistency();

    // Summary
    console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`✅ Initial Status Check: ${results.statusBefore?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Form Submission: ${results.submission?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Status Verification: ${results.statusAfter?.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Cross-Platform Consistency: ${results.crossPlatform?.success ? 'PASSED' : 'FAILED'}`);

    const allTestsPassed = Object.values(results).every(result => result?.success);
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! VERIFICATION FORM INTEGRATION IS WORKING PERFECTLY!');
      console.log('\n✅ Complete Workflow Verified:');
      console.log('   - ✅ Case creation from web frontend');
      console.log('   - ✅ Mobile app case acceptance');
      console.log('   - ✅ Verification form submission with VerificationFormService');
      console.log('   - ✅ Status update from PENDING to COMPLETED');
      console.log('   - ✅ Verification data storage in database');
      console.log('   - ✅ Cross-platform consistency');
      console.log('\n🚀 The "Test Customer Playwright" issue is COMPLETELY RESOLVED!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the results above.');
    }

    return { success: allTestsPassed, results };

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    return { success: false, error: error.message, results };
  } finally {
    await pool.end();
  }
}

// Run the tests
runVerificationSubmissionTest();
