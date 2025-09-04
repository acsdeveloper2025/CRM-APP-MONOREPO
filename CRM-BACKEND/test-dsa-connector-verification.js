/**
 * Test DSA/DST Connector Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapDsaConnectorFormDataToDatabase, validateDsaConnectorRequiredFields, getDsaConnectorAvailableDbColumns } = require('./dist/utils/dsaConnectorFormFieldMapping');
const { detectBusinessFormType } = require('./dist/utils/formTypeDetection'); // Use business detection for DSA/DST Connector

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testDsaConnectorVerification() {
  console.log('🧪 Testing DSA/DST Connector Verification Database Insertion\n');

  try {
    // Sample comprehensive DSA/DST Connector form data for different form types
    const testCases = [
      {
        name: 'POSITIVE DSA/DST Connector Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          connectorType: 'DSA',
          connectorCode: 'DSA001234',
          connectorName: 'Rajesh Financial Services',
          connectorDesignation: 'Senior DSA',
          connectorExperience: 8,
          connectorStatus: 'Active',
          businessName: 'Rajesh Financial Services Pvt Ltd',
          businessType: 'Company',
          businessRegistrationNumber: 'CIN123456789',
          businessEstablishmentYear: 2015,
          officeType: 'Rented',
          officeArea: 800.50,
          officeRent: 25000.00,
          totalStaff: 12,
          salesStaff: 8,
          supportStaff: 4,
          teamSize: 12,
          monthlyBusinessVolume: 5000000.00,
          averageMonthlySales: 4500000.00,
          annualTurnover: 55000000.00,
          monthlyIncome: 350000.00,
          commissionStructure: '2.5% on loan amount',
          paymentTerms: 'Monthly payout',
          bankAccountDetails: 'HDFC Bank - 123456789',
          computerSystems: 6,
          internetConnection: 'Broadband',
          softwareSystems: 'CRM, LMS, Banking Software',
          posTerminals: 2,
          printerScanner: 'Available',
          licenseStatus: 'Valid',
          licenseNumber: 'DSA/2023/001234',
          licenseExpiryDate: '2025-12-31',
          complianceStatus: 'Compliant',
          auditStatus: 'Passed',
          trainingStatus: 'Completed',
          metPersonName: 'Rajesh Kumar',
          metPersonDesignation: 'Business Owner',
          metPersonRelation: 'Self',
          metPersonContact: '+91-9876543210',
          businessOperational: 'Yes',
          customerFootfall: 'High',
          businessHours: '9 AM to 6 PM',
          weekendOperations: 'Saturday Only',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Neighboring Business Owner',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          marketPresence: 'Strong',
          competitorAnalysis: '3 competitors in 2km radius',
          marketReputation: 'Excellent',
          customerFeedback: 'Positive',
          locality: 'Commercial Business District',
          addressStructure: 'Commercial Complex',
          addressFloor: '2nd Floor',
          addressStructureColor: 'Blue Glass',
          doorColor: 'Silver',
          landmark1: 'Near Bank Branch',
          landmark2: 'Opposite Shopping Mall',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Excellent',
          commercialViability: 'High',
          otherObservation: 'All DSA/DST Connector documents verified successfully. Business is well-established with strong market presence.',
          businessConcerns: 'None',
          operationalChallenges: 'None',
          growthPotential: 'High',
          finalStatus: 'Positive',
          remarks: 'DSA/DST Connector verification completed successfully'
        }
      },
      {
        name: 'SHIFTED DSA/DST Connector Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Poor',
          metPersonName: 'Security Guard',
          metPersonDesignation: 'Security',
          shiftedPeriod: '3 months ago',
          currentLocation: 'Moved to new commercial complex',
          premisesStatus: 'Vacant',
          previousBusinessName: 'Rajesh Financial Services',
          locality: 'Old Commercial Area',
          addressStructure: 'Old Commercial Building',
          addressFloor: '1st Floor',
          addressStructureColor: 'White',
          doorColor: 'Brown',
          landmark1: 'Near Old Market',
          landmark2: 'Behind Closed Shop',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Poor',
          commercialViability: 'Low',
          otherObservation: 'DSA business has shifted to new location. Old office is vacant.',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE DSA/DST Connector Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Building Manager',
          callRemark: 'Phone Switched Off',
          locality: 'Remote Commercial Area',
          landmark1: 'Near Highway',
          landmark2: 'Behind Petrol Pump',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the DSA connector or any business representative',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type (using business detection for DSA/DST Connector)
      const { formType, verificationOutcome } = detectBusinessFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapDsaConnectorFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateDsaConnectorRequiredFields(testCase.formData, formType);
      console.log(`   Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!validation.isValid) {
        console.log(`   Missing Fields: ${validation.missingFields.join(', ')}`);
      }

      // Get real case and user IDs from database
      const caseResult = await pool.query('SELECT id, "caseId", "customerName", "assignedTo" FROM cases LIMIT 1');
      const userResult = await pool.query('SELECT id FROM users WHERE role = \'FIELD_AGENT\' LIMIT 1');
      
      if (caseResult.rows.length === 0 || userResult.rows.length === 0) {
        console.log('   ⚠️ Skipping test - no cases or users found in database');
        continue;
      }
      
      const testCase_data = caseResult.rows[0];
      const testUser = userResult.rows[0];

      // Prepare complete database record
      const dbInsertData = {
        // Core case information (using real case data)
        case_id: testCase_data.id,
        caseId: testCase_data.caseId,
        form_type: formType,
        verification_outcome: verificationOutcome,
        customer_name: testCase_data.customerName,
        customer_phone: '+1234567890',
        customer_email: null,
        full_address: 'Test DSA/DST Connector Address, Commercial District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} DSA/DST Connector verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "dsaConnectorVerificationReports" (${columnNames})
        VALUES (${placeholders})
        RETURNING id, form_type, verification_outcome, customer_name, total_images
      `;

      console.log(`   INSERT Query: ${columns.length} columns`);

      try {
        // Execute the insertion
        const result = await pool.query(insertQuery, values);
        const insertedRecord = result.rows[0];
        
        console.log(`   ✅ Successfully inserted record:`);
        console.log(`      ID: ${insertedRecord.id}`);
        console.log(`      Form Type: ${insertedRecord.form_type}`);
        console.log(`      Outcome: ${insertedRecord.verification_outcome}`);
        console.log(`      Customer: ${insertedRecord.customer_name}`);
        console.log(`      Images: ${insertedRecord.total_images}`);

        // Verify the data was inserted correctly
        const verifyQuery = `
          SELECT form_type, verification_outcome, met_person_name, locality, 
                 address_locatable, connector_type, connector_name, business_name,
                 political_connection, other_observation, final_status, monthly_business_volume
          FROM "dsaConnectorVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Connector Type: ${verifiedRecord.connector_type || 'NULL'}`);
        console.log(`      Connector Name: ${verifiedRecord.connector_name || 'NULL'}`);
        console.log(`      Business Name: ${verifiedRecord.business_name || 'NULL'}`);
        console.log(`      Monthly Business Volume: ${verifiedRecord.monthly_business_volume || 'NULL'}`);
        console.log(`      Political Connection: ${verifiedRecord.political_connection || 'NULL'}`);
        console.log(`      Final Status: ${verifiedRecord.final_status || 'NULL'}`);

      } catch (insertError) {
        console.log(`   ❌ Insertion failed: ${insertError.message}`);
        
        // Log the problematic query for debugging
        console.log(`   🔍 Debug Info:`);
        console.log(`      Columns: ${columns.slice(0, 10).join(', ')}...`);
        console.log(`      Values: ${values.slice(0, 10).map(v => typeof v).join(', ')}...`);
      }

      console.log('');
    }

    // Get summary statistics
    console.log('📊 DSA/DST Connector Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN connector_type IS NOT NULL THEN 1 END) as has_connector_type,
        COUNT(CASE WHEN connector_name IS NOT NULL THEN 1 END) as has_connector_name,
        COUNT(CASE WHEN business_name IS NOT NULL THEN 1 END) as has_business_name,
        AVG(monthly_business_volume) as avg_monthly_volume,
        AVG(total_staff) as avg_total_staff
      FROM "dsaConnectorVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('DSA/DST Connector Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Connector Type: ${row.has_connector_type}/${row.count}`);
      console.log(`      Has Connector Name: ${row.has_connector_name}/${row.count}`);
      console.log(`      Has Business Name: ${row.has_business_name}/${row.count}`);
      console.log(`      Avg Monthly Volume: ₹${parseFloat(row.avg_monthly_volume || 0).toLocaleString()}`);
      console.log(`      Avg Total Staff: ${parseFloat(row.avg_total_staff || 0).toFixed(1)}`);
    });

    console.log('\n✅ DSA/DST Connector verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testDsaConnectorVerification().catch(console.error);
