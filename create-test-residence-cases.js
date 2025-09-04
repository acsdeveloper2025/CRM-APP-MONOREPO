/**
 * Create Test Residence Verification Cases
 * 
 * This script creates 5 new residence verification cases with complete form submissions,
 * images, and GPS data for each verification type to test the frontend display.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'acs_db',
  password: '',
  port: 5432,
});

// Test cases data for each verification type
const testCases = [
  {
    type: 'POSITIVE',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91-9876543210',
    address: 'A-101, Sunrise Apartments, Bandra East, Mumbai, Maharashtra - 400051',
    outcome: 'Positive & Door Locked',
    finalStatus: 'Positive',
    formData: {
      customerName: 'Rajesh Kumar',
      outcome: 'Positive & Door Locked',
      finalStatus: 'Positive',
      addressLocatable: true,
      addressRating: 'Excellent',
      locality: 'Residential Complex',
      addressStructure: 'Apartment',
      metPersonName: 'Rajesh Kumar',
      metPersonRelation: 'Self',
      metPersonStatus: 'Available',
      totalFamilyMembers: 4,
      workingStatus: 'Working',
      stayingPeriod: '3 years',
      stayingStatus: 'On a Owned Basis',
      documentShownStatus: 'Shown',
      documentType: 'Aadhaar Card',
      politicalConnection: 'No',
      dominatedArea: 'Mixed Community',
      feedbackFromNeighbour: 'Positive',
      otherObservation: 'Well-maintained apartment, cooperative family',
      houseStatus: 'Occupied',
      doorColor: 'Brown',
      doorNamePlateStatus: 'Available',
      nameOnDoorPlate: 'Rajesh Kumar'
    },
    geoLocation: { latitude: 19.0596, longitude: 72.8295, accuracy: 10 },
    address_gps: 'Bandra East, Mumbai, Maharashtra, India'
  },
  {
    type: 'SHIFTED',
    customerName: 'Priya Sharma',
    customerPhone: '+91-8765432109',
    address: 'B-205, Green Valley Society, Andheri West, Mumbai, Maharashtra - 400058',
    outcome: 'Shifted & Door Lock',
    finalStatus: 'Shifted',
    formData: {
      customerName: 'Priya Sharma',
      outcome: 'Shifted & Door Lock',
      finalStatus: 'Shifted',
      addressLocatable: true,
      addressRating: 'Good',
      locality: 'Tower / Building',
      addressStructure: 'Apartment',
      shiftedPeriod: '6 months ago',
      currentLocation: 'Moved to Pune',
      premisesStatus: 'Vacant',
      roomStatus: 'Locked',
      metPersonName: 'Security Guard',
      metPersonStatus: 'Available',
      politicalConnection: 'No',
      dominatedArea: 'A Community Dominated',
      feedbackFromNeighbour: 'Family shifted to Pune',
      otherObservation: 'Apartment is locked, neighbors confirmed shifting'
    },
    geoLocation: { latitude: 19.1368, longitude: 72.9344, accuracy: 15 },
    address_gps: 'Andheri West, Mumbai, Maharashtra, India'
  },
  {
    type: 'NSP',
    customerName: 'Amit Singh',
    customerPhone: '+91-7654321098',
    address: 'C-301, Skyline Towers, Powai, Mumbai, Maharashtra - 400076',
    outcome: 'NSP & Door Lock',
    finalStatus: 'NSP',
    formData: {
      customerName: 'Amit Singh',
      outcome: 'NSP & Door Lock',
      finalStatus: 'NSP',
      addressLocatable: true,
      addressRating: 'Good',
      locality: 'Tower / Building',
      addressStructure: 'Apartment',
      stayingPersonName: 'Tenant - Rohit Gupta',
      houseStatus: 'Occupied by others',
      metPersonStatus: 'Available',
      metPersonName: 'Rohit Gupta',
      metPersonRelation: 'Tenant',
      temporaryStay: true,
      politicalConnection: 'No',
      dominatedArea: 'Mixed Community',
      feedbackFromNeighbour: 'Original owner not staying, rented out',
      otherObservation: 'Property is rented to different person'
    },
    geoLocation: { latitude: 19.1197, longitude: 72.9073, accuracy: 12 },
    address_gps: 'Powai, Mumbai, Maharashtra, India'
  },
  {
    type: 'ENTRY_RESTRICTED',
    customerName: 'Sunita Gupta',
    customerPhone: '+91-6543210987',
    address: 'D-402, Royal Heights, Malad West, Mumbai, Maharashtra - 400064',
    outcome: 'ERT',
    finalStatus: 'Entry Restricted',
    formData: {
      customerName: 'Sunita Gupta',
      outcome: 'ERT',
      finalStatus: 'Entry Restricted',
      addressLocatable: true,
      addressRating: 'Good',
      locality: 'Tower / Building',
      addressStructure: 'Apartment',
      entryRestrictionReason: 'Security restrictions in building',
      securityPersonName: 'Building Security',
      accessDenied: true,
      nameOfMetPerson: 'Security Guard',
      metPersonType: 'Security Personnel',
      applicantStayingStatus: 'Unknown due to access restriction',
      politicalConnection: 'No',
      dominatedArea: 'Mixed Community',
      feedbackFromNeighbour: 'Unable to verify due to security restrictions',
      otherObservation: 'High security building, entry not allowed without prior permission'
    },
    geoLocation: { latitude: 19.1875, longitude: 72.8362, accuracy: 20 },
    address_gps: 'Malad West, Mumbai, Maharashtra, India'
  },
  {
    type: 'UNTRACEABLE',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91-5432109876',
    address: 'E-501, Ocean View, Versova, Mumbai, Maharashtra - 400061',
    outcome: 'Untraceable',
    finalStatus: 'Untraceable',
    formData: {
      customerName: 'Vikram Malhotra',
      outcome: 'Untraceable',
      finalStatus: 'Untraceable',
      addressLocatable: false,
      addressRating: 'Poor',
      locality: 'Tower / Building',
      callRemark: 'Phone not reachable, number switched off',
      landmark3: 'Building not found at given address',
      landmark4: 'Local inquiry shows no such person',
      contactPerson: 'Local shopkeeper',
      alternateContact: 'No alternate contact available',
      politicalConnection: 'No',
      dominatedArea: 'Mixed Community',
      feedbackFromNeighbour: 'No one knows about this person',
      otherObservation: 'Address seems incorrect, person untraceable'
    },
    geoLocation: { latitude: 19.1307, longitude: 72.8067, accuracy: 25 },
    address_gps: 'Versova, Mumbai, Maharashtra, India'
  }
];

async function createTestCases() {
  console.log('🏗️ Creating 5 Test Residence Verification Cases\n');

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`📝 Creating ${testCase.type} case: ${testCase.customerName}`);

      // 1. Create the case
      const caseResult = await pool.query(`
        INSERT INTO cases (
          "customerName", "customerPhone", address, "verificationType",
          status, priority, "clientId", "productId", "verificationTypeId",
          "assignedTo", "createdByBackendUser", "applicantType",
          "backendContactNumber", "trigger", "verificationOutcome", "verificationData"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, "caseId"
      `, [
        testCase.customerName,
        testCase.customerPhone,
        testCase.address,
        'RESIDENCE',
        'COMPLETED',
        'MEDIUM',
        1, // XYZ Finance Corp
        1, // Default product
        1, // Residence verification type
        '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9', // Nikhil Parab
        '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9', // Nikhil Parab
        'APPLICANT',
        testCase.customerPhone,
        `Test ${testCase.type} verification case`,
        testCase.outcome,
        JSON.stringify({
          formData: testCase.formData,
          formType: 'RESIDENCE',
          geoLocation: testCase.geoLocation,
          submittedAt: new Date().toISOString(),
          submittedBy: '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9',
          submissionId: `residence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          verification: {
            ...testCase.formData,
            imageCount: 4,
            geoTaggedImages: 4,
            submissionLocation: testCase.geoLocation
          }
        })
      ]);

      const caseId = caseResult.rows[0].caseId;
      const caseUuid = caseResult.rows[0].id;
      
      console.log(`   ✅ Case created: #${caseId} (${caseUuid})`);

      // 2. Create residence verification report
      await createResidenceVerificationReport(caseId, caseUuid, testCase);
      
      // 3. Create verification images
      await createVerificationImages(caseId, caseUuid, testCase);
      
      console.log(`   ✅ ${testCase.type} case completed\n`);
    }

    console.log('🎉 All 5 test cases created successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ POSITIVE: Rajesh Kumar - Well-maintained apartment');
    console.log('   ✅ SHIFTED: Priya Sharma - Moved to Pune 6 months ago');
    console.log('   ✅ NSP: Amit Singh - Property rented to different person');
    console.log('   ✅ ENTRY_RESTRICTED: Sunita Gupta - High security building');
    console.log('   ✅ UNTRACEABLE: Vikram Malhotra - Phone unreachable, address incorrect');

  } catch (error) {
    console.error('❌ Error creating test cases:', error);
  } finally {
    await pool.end();
  }
}

async function createResidenceVerificationReport(caseId, caseUuid, testCase) {
  const { detectFormTypeEnhanced } = require('./dist/utils/formTypeDetection');
  const { mapFormDataToDatabase } = require('./dist/utils/residenceFormFieldMapping');
  
  // Detect form type
  const { formType, verificationOutcome } = detectFormTypeEnhanced(testCase.formData, 'RESIDENCE');
  
  // Map form data to database fields
  const mappedData = mapFormDataToDatabase(testCase.formData);
  
  // Create verification report
  const reportData = {
    case_id: caseUuid,
    caseId: caseId,
    form_type: formType,
    verification_outcome: verificationOutcome,
    customer_name: testCase.customerName,
    customer_phone: testCase.customerPhone,
    full_address: testCase.address,
    verified_by: '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9',
    verification_date: new Date().toISOString().split('T')[0],
    verification_time: new Date().toTimeString().split(' ')[0],
    remarks: testCase.formData.otherObservation || 'Test case verification',
    total_images: 4,
    total_selfies: 0,
    ...mappedData
  };

  const columns = Object.keys(reportData).map(key => `"${key}"`).join(', ');
  const values = Object.values(reportData);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

  await pool.query(
    `INSERT INTO "residenceVerificationReports" (${columns}) VALUES (${placeholders})`,
    values
  );
  
  console.log(`   ✅ Verification report created: ${formType} (${verificationOutcome})`);
}

async function createVerificationImages(caseId, caseUuid, testCase) {
  const submissionId = `residence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create 4 verification images for each case
  for (let i = 1; i <= 4; i++) {
    const imageData = {
      case_id: caseUuid,
      case_number: caseId,
      submission_id: submissionId,
      file_name: `verification_image_${i}.jpg`,
      file_path: `/uploads/verification/residence/${caseUuid}/verification_image_${i}.jpg`,
      thumbnail_path: `/uploads/verification/residence/${caseUuid}/thumbnails/thumb_verification_image_${i}.jpg`,
      file_size: 150000 + Math.floor(Math.random() * 50000),
      mime_type: 'image/jpeg',
      photo_type: 'verification',
      uploaded_by: '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9',
      geo_location: JSON.stringify({
        latitude: testCase.geoLocation.latitude + (Math.random() - 0.5) * 0.001,
        longitude: testCase.geoLocation.longitude + (Math.random() - 0.5) * 0.001,
        accuracy: testCase.geoLocation.accuracy + Math.floor(Math.random() * 10),
        address: testCase.address_gps,
        timestamp: new Date().toISOString()
      }),
      capture_timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      verification_type: 'RESIDENCE'
    };

    await pool.query(`
      INSERT INTO verification_attachments (
        case_id, case_number, submission_id, file_name, file_path, thumbnail_path,
        file_size, mime_type, photo_type, uploaded_by, geo_location, 
        capture_timestamp, verification_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, Object.values(imageData));
  }
  
  console.log(`   ✅ Created 4 verification images with GPS data`);
}

// Run the script
createTestCases().catch(console.error);
