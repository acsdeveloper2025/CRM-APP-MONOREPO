#!/usr/bin/env node

/**
 * Complete End-to-End Case Submission Test
 * This script simulates a complete case submission with mock images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple base64 test image (1x1 pixel PNG)
const createTestImage = (name) => {
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
    speed: 0
  };
};

// Create mock form data for Case #33
const createMockFormData = () => {
  return {
    // Customer Information (pre-filled)
    customerName: "Test Customer With Attachment",
    bankName: "N/A",
    product: "Home Loan",
    trigger: "Test case with attachment for mobile app verification",
    visitAddress: "123 Test Street, Test City, Test State 123456",
    systemContact: "9876543210",
    customerCode: "CC-1756803338016-038",
    applicantStatus: "APPLICANT",
    
    // Address Verification
    addressLocatable: "Easy to Locate",
    addressRating: "Good",
    houseStatus: "Opened",
    
    // Personal Details (House Opened)
    metPersonName: "John Smith",
    relation: "Self",
    totalFamilyMembers: "4",
    totalEarning: "50000",
    applicantDOB: "1990-01-15",
    applicantAge: "34",
    workingStatus: "Salaried",
    companyName: "Tech Solutions Inc",
    approxArea: "1200",
    documentShownStatus: "Showed",
    
    // Additional Details
    stayingPeriod: "5 years",
    stayingStatus: "On a Owned Basis",
    
    // Third Party Confirmation
    tpcMetPerson1: "Neighbour",
    nameOfTPC1: "Rajesh Kumar",
    tpcConfirmation1: "Confirmed",
    tpcMetPerson2: "Security",
    nameOfTPC2: "Security Guard",
    tpcConfirmation2: "Confirmed",
    
    // Property Details
    locality: "Independent House",
    addressStructure: "2",
    applicantStayingFloor: "1",
    addressStructureColor: "White",
    doorColor: "Brown",
    doorNamePlate: "Sighted",
    societyNamePlate: "Sighted",
    landmark1: "Near City Mall",
    landmark2: "Opposite Bank",
    
    // Area Assessment
    politicalConnection: "Not Having Political Connection",
    dominatedArea: "Not a Community Dominated",
    feedbackFromNeighbour: "No Adverse",
    otherObservation: "Peaceful residential area with good infrastructure",
    
    // Final Status
    finalStatus: "Positive",
    outcome: "VERIFIED"
  };
};

// Create mock images (5 verification photos + 1 selfie)
const createMockImages = () => {
  const images = [];
  
  // Create 5 verification photos
  for (let i = 1; i <= 5; i++) {
    images.push(createTestImage(`verification-${i}`));
  }
  
  // Create 1 selfie
  const selfie = createTestImage('selfie');
  selfie.isSelfie = true;
  images.push(selfie);
  
  return images;
};

// Create the complete submission payload
const createSubmissionPayload = () => {
  const formData = createMockFormData();
  const images = createMockImages();
  
  return {
    caseId: "62cb776f-db6f-4e43-a5a9-04aaad802be4", // Case #33 UUID
    formType: "RESIDENCE",
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
        userAgent: navigator?.userAgent || "Test Environment",
        timestamp: new Date().toISOString()
      },
      submissionSource: "MOBILE_APP_TEST",
      testMode: true
    }
  };
};

// Save the test payload to a file for inspection
const saveTestPayload = () => {
  const payload = createSubmissionPayload();
  const outputPath = path.join(__dirname, 'test-submission-payload.json');
  
  // Remove the actual image data for file size, but keep structure
  const payloadForFile = {
    ...payload,
    images: payload.images.map(img => ({
      ...img,
      dataUrl: `[BASE64_IMAGE_DATA_${img.dataUrl.length}_BYTES]`
    }))
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(payloadForFile, null, 2));
  console.log(`✅ Test payload saved to: ${outputPath}`);
  console.log(`📊 Payload summary:`);
  console.log(`   - Case ID: ${payload.caseId}`);
  console.log(`   - Form Type: ${payload.formType}`);
  console.log(`   - Images: ${payload.images.length} (${payload.images.filter(img => img.isSelfie).length} selfies, ${payload.images.filter(img => !img.isSelfie).length} photos)`);
  console.log(`   - Form Fields: ${Object.keys(payload.formData).length}`);
  console.log(`   - Has Geo Location: ${!!payload.geoLocation}`);
  
  return payload;
};

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Creating complete case submission test payload...');
  const payload = saveTestPayload();
  
  console.log('\n📋 Form Data Summary:');
  console.log(`   - Customer: ${payload.formData.customerName}`);
  console.log(`   - Met Person: ${payload.formData.metPersonName} (${payload.formData.relation})`);
  console.log(`   - Family Members: ${payload.formData.totalFamilyMembers}`);
  console.log(`   - Earning: ₹${payload.formData.totalEarning}`);
  console.log(`   - Working Status: ${payload.formData.workingStatus}`);
  console.log(`   - Company: ${payload.formData.companyName}`);
  console.log(`   - Final Status: ${payload.formData.finalStatus}`);
  
  console.log('\n📷 Images Summary:');
  payload.images.forEach((img, index) => {
    console.log(`   ${index + 1}. ${img.isSelfie ? '🤳 Selfie' : '📷 Photo'} - ${img.id}`);
    console.log(`      📍 Location: ${img.latitude.toFixed(6)}, ${img.longitude.toFixed(6)} (±${img.accuracy}m)`);
    console.log(`      🕒 Timestamp: ${img.timestamp}`);
  });
  
  console.log('\n✅ Test payload ready for submission!');
  console.log('💡 Use this payload to test the complete form submission API.');
}

export {
  createTestImage,
  createMockFormData,
  createMockImages,
  createSubmissionPayload,
  saveTestPayload
};
