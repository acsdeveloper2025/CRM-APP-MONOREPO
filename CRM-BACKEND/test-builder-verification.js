/**
 * Test Builder Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapBuilderFormDataToDatabase, validateBuilderRequiredFields, getBuilderAvailableDbColumns } = require('./dist/utils/builderFormFieldMapping');
const { detectBusinessFormType } = require('./dist/utils/formTypeDetection'); // Use business detection for builder

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testBuilderVerification() {
  console.log('🧪 Testing Builder Verification Database Insertion\n');

  try {
    // Sample comprehensive builder form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Builder Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          officeStatus: 'Opened',
          metPerson: 'Site Manager',
          designation: 'Site Manager',
          builderType: 'Construction Company',
          builderName: 'ABC Builders Pvt Ltd',
          builderOwnerName: 'John Smith',
          workingPeriod: '3 years',
          workingStatus: 'Active',
          companyNatureOfBusiness: 'Residential Construction',
          businessPeriod: '10 years',
          establishmentPeriod: '2014',
          officeApproxArea: 1200,
          staffStrength: 25,
          staffSeen: 15,
          documentShown: 'Builder License, GST Certificate, Project Approval',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Local Contractor',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          locality: 'Industrial Area',
          addressStructure: 'Office Building',
          addressFloor: '2nd Floor',
          addressStructureColor: 'Grey',
          doorColor: 'Blue',
          companyNamePlateStatus: 'Available',
          nameOnCompanyBoard: 'ABC Builders Pvt Ltd',
          landmark1: 'Near Construction Site',
          landmark2: 'Opposite Hardware Store',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'All builder details verified successfully',
          finalStatus: 'Positive',
          remarks: 'Builder verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Builder Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          officeStatus: 'Closed',
          metPerson: 'Security Guard',
          designation: 'Security',
          currentCompanyName: 'New Builder Company',
          oldOfficeShiftedPeriod: '1.5 years ago',
          currentCompanyPeriod: '1 year',
          premisesStatus: 'Vacant',
          locality: 'Industrial Area',
          addressStructure: 'Office Complex',
          addressFloor: '1st Floor',
          addressStructureColor: 'White',
          doorColor: 'Red',
          companyNamePlateStatus: 'Removed',
          nameOnCompanyBoard: 'Old Builder Name',
          landmark1: 'Near Industrial Gate',
          landmark2: 'Behind Warehouse',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'Builder office has been shifted to new location',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Builder Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Local Worker',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Construction Area',
          landmark1: 'Near Building Site',
          landmark2: 'Behind Material Store',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the builder office',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type (using business detection for builder)
      const { formType, verificationOutcome } = detectBusinessFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapBuilderFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateBuilderRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Builder Office Address, Industrial District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} builder verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "builderVerificationReports" (${columnNames})
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
                 other_observation, final_status, office_status, builder_name
          FROM "builderVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Staff Strength: ${verifiedRecord.staff_strength || 'NULL'}`);
        console.log(`      Office Status: ${verifiedRecord.office_status || 'NULL'}`);
        console.log(`      Builder Name: ${verifiedRecord.builder_name || 'NULL'}`);
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
    console.log('📊 Builder Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN staff_strength IS NOT NULL THEN 1 END) as has_staff_count,
        COUNT(CASE WHEN office_status IS NOT NULL THEN 1 END) as has_office_status,
        COUNT(CASE WHEN builder_name IS NOT NULL THEN 1 END) as has_builder_name
      FROM "builderVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Builder Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Staff Count: ${row.has_staff_count}/${row.count}`);
      console.log(`      Has Office Status: ${row.has_office_status}/${row.count}`);
      console.log(`      Has Builder Name: ${row.has_builder_name}/${row.count}`);
    });

    console.log('\n✅ Builder verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testBuilderVerification().catch(console.error);
