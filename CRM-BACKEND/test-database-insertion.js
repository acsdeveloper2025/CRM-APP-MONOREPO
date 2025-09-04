/**
 * Test Database Insertion Script
 * 
 * This script tests the actual database insertion with comprehensive form data
 */

const { Pool } = require('pg');
const { mapFormDataToDatabase, validateRequiredFields, detectResidenceFormType } = require('./dist/utils/residenceFormFieldMapping');
const { detectResidenceFormType: detectFormType } = require('./dist/utils/formTypeDetection');

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testDatabaseInsertion() {
  console.log('🧪 Testing Database Insertion with Comprehensive Form Data\n');

  try {
    // Sample comprehensive form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Residence Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          houseStatus: 'Opened',
          metPersonName: 'John Doe',
          metPersonRelation: 'Self',
          totalFamilyMembers: 4,
          totalEarning: 50000,
          applicantDob: '1990-01-01',
          applicantAge: 34,
          workingStatus: 'Employed',
          companyName: 'ABC Corp',
          stayingPeriod: '5 years',
          stayingStatus: 'Owner',
          approxArea: 1200,
          documentShownStatus: 'Yes',
          documentType: 'Aadhar Card',
          tpcMetPerson1: 'Yes',
          tpcName1: 'Jane Smith',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          tpcName2: '',
          tpcConfirmation2: null,
          locality: 'Urban',
          addressStructure: 'Independent House',
          applicantStayingFloor: 'Ground Floor',
          addressStructureColor: 'White',
          doorColor: 'Brown',
          doorNamePlateStatus: 'Available',
          nameOnDoorPlate: 'John Doe',
          societyNamePlateStatus: 'Not Applicable',
          nameOnSocietyBoard: '',
          landmark1: 'Near Park',
          landmark2: 'Opposite School',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'All details verified successfully',
          finalStatus: 'Positive',
          remarks: 'Verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Residence Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          roomStatus: 'Closed',
          metPersonName: 'Security Guard',
          metPersonStatus: 'Neighbour',
          shiftedPeriod: '6 months ago',
          tpcMetPerson1: 'Yes',
          tpcName1: 'Local Resident',
          tpcMetPerson2: 'No',
          tpcName2: '',
          premisesStatus: 'Vacant',
          locality: 'Urban',
          addressStructure: 'Apartment',
          addressFloor: '2nd Floor',
          addressStructureColor: 'Blue',
          doorColor: 'White',
          doorNamePlateStatus: 'Available',
          nameOnDoorPlate: 'Old Name',
          societyNamePlateStatus: 'Available',
          nameOnSocietyBoard: 'ABC Society',
          landmark1: 'Near Mall',
          landmark2: 'Behind Hospital',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'Applicant has shifted to new location',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Residence Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Rural',
          landmark1: 'Near Temple',
          landmark2: 'Behind School',
          landmark3: 'Next to Petrol Pump',
          landmark4: 'Opposite Bus Stand',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the address',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type
      const { formType, verificationOutcome } = detectFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Address, Test City, Test State',

        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} residence verification completed`,

        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "residenceVerificationReports" (${columnNames})
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
                 address_locatable, total_family_members, political_connection,
                 other_observation, final_status
          FROM "residenceVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Family Members: ${verifiedRecord.total_family_members || 'NULL'}`);
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
    console.log('📊 Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN total_family_members IS NOT NULL THEN 1 END) as has_family_count
      FROM "residenceVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Family Count: ${row.has_family_count}/${row.count}`);
    });

    console.log('\n✅ Database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseInsertion().catch(console.error);
