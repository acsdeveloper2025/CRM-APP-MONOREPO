/**
 * Create Test Residence Verification Cases
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'acs_db',
  password: '',
  port: 5432,
});

async function createTestData() {
  console.log('🏗️ Creating 5 Test Residence Verification Cases\n');

  const testCases = [
    {
      type: 'POSITIVE',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91-9876543210',
      address: 'A-101, Sunrise Apartments, Bandra East, Mumbai, Maharashtra - 400051',
      outcome: 'Positive & Door Locked',
      finalStatus: 'Positive',
      geoLocation: { lat: 19.0596, lng: 72.8295, addr: 'Bandra East, Mumbai' }
    },
    {
      type: 'SHIFTED',
      customerName: 'Priya Sharma',
      customerPhone: '+91-8765432109',
      address: 'B-205, Green Valley Society, Andheri West, Mumbai, Maharashtra - 400058',
      outcome: 'Shifted & Door Lock',
      finalStatus: 'Negative',
      geoLocation: { lat: 19.1368, lng: 72.9344, addr: 'Andheri West, Mumbai' }
    },
    {
      type: 'NSP',
      customerName: 'Amit Singh',
      customerPhone: '+91-7654321098',
      address: 'C-301, Skyline Towers, Powai, Mumbai, Maharashtra - 400076',
      outcome: 'NSP & Door Lock',
      finalStatus: 'Negative',
      geoLocation: { lat: 19.1197, lng: 72.9073, addr: 'Powai, Mumbai' }
    },
    {
      type: 'ENTRY_RESTRICTED',
      customerName: 'Sunita Gupta',
      customerPhone: '+91-6543210987',
      address: 'D-402, Royal Heights, Malad West, Mumbai, Maharashtra - 400064',
      outcome: 'ERT',
      finalStatus: 'Negative',
      geoLocation: { lat: 19.1875, lng: 72.8362, addr: 'Malad West, Mumbai' }
    },
    {
      type: 'UNTRACEABLE',
      customerName: 'Vikram Malhotra',
      customerPhone: '+91-5432109876',
      address: 'E-501, Ocean View, Versova, Mumbai, Maharashtra - 400061',
      outcome: 'Untraceable',
      finalStatus: 'Negative',
      geoLocation: { lat: 19.1307, lng: 72.8067, addr: 'Versova, Mumbai' }
    }
  ];

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`📝 Creating ${testCase.type} case: ${testCase.customerName}`);

      // Create the case
      const caseResult = await pool.query(`
        INSERT INTO cases (
          "customerName", "customerPhone", address, "verificationType", 
          status, priority, "clientId", "productId", "verificationTypeId",
          "assignedTo", "createdByBackendUser", "applicantType", 
          "backendContactNumber", "trigger"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        `Test ${testCase.type} verification case`
      ]);

      const caseId = caseResult.rows[0].caseId;
      const caseUuid = caseResult.rows[0].id;
      
      console.log(`   ✅ Case created: #${caseId} (${caseUuid})`);

      // Create residence verification report
      await pool.query(`
        INSERT INTO "residenceVerificationReports" (
          case_id, "caseId", form_type, verification_outcome, customer_name,
          customer_phone, full_address, verified_by, verification_date,
          verification_time, remarks, total_images, total_selfies, final_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        caseUuid,
        caseId,
        testCase.type,
        testCase.outcome,
        testCase.customerName,
        testCase.customerPhone,
        testCase.address,
        '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9',
        new Date().toISOString().split('T')[0],
        new Date().toTimeString().split(' ')[0],
        `Test ${testCase.type} verification`,
        4,
        0,
        testCase.finalStatus
      ]);

      console.log(`   ✅ Verification report created: ${testCase.type}`);

      // Create 4 test images
      const submissionId = `residence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (let j = 1; j <= 4; j++) {
        await pool.query(`
          INSERT INTO verification_attachments (
            case_id, "caseId", verification_type, filename, "originalName",
            "mimeType", "fileSize", "filePath", "thumbnailPath", "uploadedBy", "geoLocation"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          caseUuid,
          caseId,
          'RESIDENCE',
          `verification_image_${j}.jpg`,
          `verification_image_${j}.jpg`,
          'image/jpeg',
          150000 + Math.floor(Math.random() * 50000),
          `/uploads/verification/residence/${caseUuid}/verification_image_${j}.jpg`,
          `/uploads/verification/residence/${caseUuid}/thumbnails/thumb_verification_image_${j}.jpg`,
          '66ed9c1b-e02e-4769-b7d5-903bcc0a3ba9',
          JSON.stringify({
            latitude: testCase.geoLocation.lat + (Math.random() - 0.5) * 0.001,
            longitude: testCase.geoLocation.lng + (Math.random() - 0.5) * 0.001,
            accuracy: 10 + Math.floor(Math.random() * 10),
            address: testCase.geoLocation.addr,
            timestamp: new Date().toISOString()
          })
        ]);
      }

      console.log(`   ✅ Created 4 verification images with GPS data`);
      console.log('');
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

createTestData().catch(console.error);
