/**
 * Test Business Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapBusinessFormDataToDatabase, validateBusinessRequiredFields, getBusinessAvailableDbColumns } = require('./dist/utils/businessFormFieldMapping');
const { detectBusinessFormType } = require('./dist/utils/formTypeDetection');

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testBusinessVerification() {
  console.log('🧪 Testing Business Verification Database Insertion\n');

  try {
    // Sample comprehensive business form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Business Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          businessStatus: 'Opened',
          metPerson: 'Business Owner',
          designation: 'Owner',
          businessType: 'Retail',
          nameOfCompanyOwners: 'John Smith',
          ownershipType: 'Individual',
          addressStatus: 'Confirmed',
          companyNatureOfBusiness: 'Electronics Store',
          businessPeriod: '5 years',
          establishmentPeriod: '2019',
          businessApproxArea: 800,
          staffStrength: 8,
          staffSeen: 6,
          documentShown: 'Business License, GST Certificate',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Neighbor Shop Owner',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          locality: 'Commercial Area',
          addressStructure: 'Shop',
          addressFloor: 'Ground Floor',
          addressStructureColor: 'White',
          doorColor: 'Blue',
          companyNamePlateStatus: 'Available',
          nameOnCompanyBoard: 'Smith Electronics',
          landmark1: 'Near Main Market',
          landmark2: 'Opposite Bank',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'All business details verified successfully',
          finalStatus: 'Positive',
          remarks: 'Business verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Business Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          businessStatus: 'Closed',
          metPerson: 'Caretaker',
          designation: 'Caretaker',
          currentCompanyName: 'New Business Name',
          oldBusinessShiftedPeriod: '1 year ago',
          currentCompanyPeriod: '8 months',
          premisesStatus: 'Vacant',
          locality: 'Commercial Area',
          addressStructure: 'Shop',
          addressFloor: 'Ground Floor',
          addressStructureColor: 'Yellow',
          doorColor: 'Red',
          companyNamePlateStatus: 'Removed',
          nameOnCompanyBoard: 'Old Business Name',
          landmark1: 'Near Shopping Center',
          landmark2: 'Behind Restaurant',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'Business has been shifted to new location',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Business Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Local Vendor',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Industrial Area',
          landmark1: 'Near Factory',
          landmark2: 'Behind Warehouse',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the business',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type
      const { formType, verificationOutcome } = detectBusinessFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapBusinessFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateBusinessRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Business Address, Commercial District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} business verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "businessVerificationReports" (${columnNames})
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
                 address_locatable, staff_strength, political_connection,
                 other_observation, final_status, business_status, business_type
          FROM "businessVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Staff Strength: ${verifiedRecord.staff_strength || 'NULL'}`);
        console.log(`      Business Status: ${verifiedRecord.business_status || 'NULL'}`);
        console.log(`      Business Type: ${verifiedRecord.business_type || 'NULL'}`);
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
    console.log('📊 Business Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN staff_strength IS NOT NULL THEN 1 END) as has_staff_count,
        COUNT(CASE WHEN business_status IS NOT NULL THEN 1 END) as has_business_status,
        COUNT(CASE WHEN business_type IS NOT NULL THEN 1 END) as has_business_type
      FROM "businessVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Business Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Staff Count: ${row.has_staff_count}/${row.count}`);
      console.log(`      Has Business Status: ${row.has_business_status}/${row.count}`);
      console.log(`      Has Business Type: ${row.has_business_type}/${row.count}`);
    });

    console.log('\n✅ Business verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testBusinessVerification().catch(console.error);
