#!/usr/bin/env node

/**
 * Complete End-to-End API Submission Test
 * This script tests the complete form submission flow via API
 */

const https = require('https');
const http = require('http');

// Create a simple base64 test image (1x1 pixel PNG)
const createTestImage = (name, isSelfie = false) => {
  // This is a 1x1 transparent PNG in base64
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return {
    id: `test-image-${name}-${Date.now()}`,
    dataUrl: base64Image,
    timestamp: new Date().toISOString(),
    latitude: 19.0760 + (Math.random() - 0.5) * 0.01, // Mumbai coordinates with small variation
    longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
    accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 meters accuracy
    altitude: Math.floor(Math.random() * 100) + 10,
    altitudeAccuracy: Math.floor(Math.random() * 5) + 2,
    heading: Math.floor(Math.random() * 360),
    speed: 0,
    isSelfie: isSelfie
  };
};

// Create mock form data for Case #36 (Untraceable)
const createMockFormData = () => {
  return {
    // Customer Information (pre-filled)
    customerName: "status check new",
    bankName: "N/A",
    product: "Business Loan",
    trigger: "status",
    visitAddress: "status",
    systemContact: "8787876767",
    customerCode: "CC-1756897291552-683",
    applicantStatus: "APPLICANT",
    
    // Investigation Details
    metPerson: "Security Guard",
    callRemark: "Did Not Pick Up Call",
    locality: "Independent House",
    
    // Location Details
    landmark1: "Near Main Road",
    landmark2: "Opposite School",
    landmark3: "",
    landmark4: "",
    
    // Area Assessment
    dominatedArea: "Not a Community Dominated",
    otherObservation: "Area appears to be residential but customer was not traceable",
    
    // Final Status
    finalStatus: "Negative",
    outcome: "UNTRACEABLE"
  };
};

// Create mock images (5 verification photos + 1 selfie)
const createMockImages = () => {
  const images = [];
  
  // Create 5 verification photos
  for (let i = 1; i <= 5; i++) {
    images.push(createTestImage(`verification-${i}`, false));
  }
  
  // Create 1 selfie
  images.push(createTestImage('selfie', true));
  
  return images;
};

// Make HTTP request
const makeRequest = (options, data) => {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Test the complete submission flow
const testCompleteSubmission = async () => {
  console.log('🚀 Starting Complete End-to-End API Submission Test...\n');
  
  const caseId = "beaf39a8-9179-466f-b544-c5ba773eb30e"; // Case #36 UUID
  const formData = createMockFormData();
  const images = createMockImages();
  
  console.log('📋 Test Data Summary:');
  console.log(`   - Case ID: ${caseId}`);
  console.log(`   - Customer: ${formData.customerName}`);
  console.log(`   - Met Person: ${formData.metPerson}`);
  console.log(`   - Call Remark: ${formData.callRemark}`);
  console.log(`   - Locality: ${formData.locality}`);
  console.log(`   - Final Status: ${formData.finalStatus}`);
  console.log(`   - Images: ${images.length} (${images.filter(img => img.isSelfie).length} selfies, ${images.filter(img => !img.isSelfie).length} photos)`);
  
  // Step 1: Test case status update
  console.log('\n📱 Step 1: Testing case status update...');
  try {
    const statusResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/mobile/cases/${caseId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to get a real token
      }
    }, {
      status: 'IN_PROGRESS',
      notes: 'Starting form submission test'
    });
    
    console.log(`   Status: ${statusResponse.status}`);
    console.log(`   Response: ${JSON.stringify(statusResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Step 2: Test form submission
  console.log('\n📝 Step 2: Testing residence verification submission...');
  try {
    const submissionPayload = {
      formData,
      images,
      geoLocation: {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracy: 8,
        altitude: 15,
        altitudeAccuracy: 3,
        heading: 45,
        speed: 0,
        timestamp: new Date().toISOString()
      },
      metadata: {
        deviceInfo: {
          platform: "web",
          userAgent: "Test Environment",
          timestamp: new Date().toISOString()
        },
        submissionSource: "API_TEST",
        testMode: true
      }
    };
    
    const submissionResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/mobile/forms/residence-verification/${caseId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to get a real token
      }
    }, submissionPayload);
    
    console.log(`   Status: ${submissionResponse.status}`);
    console.log(`   Response: ${JSON.stringify(submissionResponse.data, null, 2)}`);
    
    if (submissionResponse.status === 200 || submissionResponse.status === 201) {
      console.log('\n✅ Form submission successful!');
      
      // Step 3: Verify the case was updated
      console.log('\n🔍 Step 3: Verifying case completion...');
      const verifyResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/cases/${caseId}`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`   Status: ${verifyResponse.status}`);
      console.log(`   Case Status: ${verifyResponse.data?.status}`);
      console.log(`   Completed At: ${verifyResponse.data?.completedAt}`);
      console.log(`   Verification Type: ${verifyResponse.data?.verificationType}`);
      console.log(`   Verification Outcome: ${verifyResponse.data?.verificationOutcome}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🎯 Test completed! Check the web interface to see the form submission in the Form Submissions tab.');
};

// Run the test
if (require.main === module) {
  testCompleteSubmission().catch(console.error);
}

module.exports = { testCompleteSubmission, createMockFormData, createMockImages };
