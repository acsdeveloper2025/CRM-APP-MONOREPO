/**
 * Test Residence-cum-Office Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapResidenceCumOfficeFormDataToDatabase, validateResidenceCumOfficeRequiredFields, getResidenceCumOfficeAvailableDbColumns } = require('./dist/utils/residenceCumOfficeFormFieldMapping');
const { detectResidenceFormType } = require('./dist/utils/formTypeDetection'); // Use residence detection for hybrid form

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testResidenceCumOfficeVerification() {
  console.log('🧪 Testing Residence-cum-Office Verification Database Insertion\n');

  try {
    // Sample comprehensive residence-cum-office form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Residence-cum-Office Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          houseStatus: 'Opened',
          officeStatus: 'Opened',
          metPersonName: 'John Smith',
          metPersonRelation: 'Self',
          designation: 'Business Owner',
          applicantDesignation: 'Proprietor',
          totalFamilyMembers: 4,
          totalEarning: 75000,
          applicantDob: '1985-05-15',
          applicantAge: 39,
          workingPeriod: '8 years',
          workingStatus: 'Self Employed',
          officeType: 'Home Office',
          companyNatureOfBusiness: 'Consulting Services',
          businessPeriod: '8 years',
          establishmentPeriod: '2016',
          staffStrength: 3,
          staffSeen: 2,
          stayingPeriod: '10 years',
          stayingStatus: 'Owner',
          approxArea: 1500,
          documentShownStatus: 'Yes',
          documentType: 'Aadhar Card, Business License',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Neighbor',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          locality: 'Residential-Commercial Area',
          addressStructure: 'Independent House',
          addressFloor: 'Ground Floor',
          addressStructureColor: 'White',
          doorColor: 'Brown',
          companyNamePlateStatus: 'Available',
          nameOnCompanyBoard: 'Smith Consulting',
          doorNamePlateStatus: 'Available',
          nameOnDoorPlate: 'John Smith',
          landmark1: 'Near Community Center',
          landmark2: 'Opposite School',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'All residence and office details verified successfully',
          finalStatus: 'Positive',
          remarks: 'Residence-cum-office verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Residence-cum-Office Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          houseStatus: 'Closed',
          officeStatus: 'Closed',
          metPersonName: 'Caretaker',
          designation: 'Caretaker',
          currentCompanyName: 'New Business Location',
          oldOfficeShiftedPeriod: '2 years ago',
          currentCompanyPeriod: '1.5 years',
          premisesStatus: 'Vacant',
          locality: 'Residential Area',
          addressStructure: 'Apartment',
          addressFloor: '2nd Floor',
          addressStructureColor: 'Blue',
          doorColor: 'White',
          companyNamePlateStatus: 'Removed',
          nameOnCompanyBoard: 'Old Business Name',
          doorNamePlateStatus: 'Available',
          nameOnDoorPlate: 'Previous Owner',
          landmark1: 'Near Park',
          landmark2: 'Behind Shopping Complex',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'Residence and office have been shifted to new location',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Residence-cum-Office Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Local Resident',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Mixed Use Area',
          landmark1: 'Near Market',
          landmark2: 'Behind Temple',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the residence-cum-office',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type (using residence detection for hybrid form)
      const { formType, verificationOutcome } = detectResidenceFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapResidenceCumOfficeFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateResidenceCumOfficeRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Residence-cum-Office Address, Mixed Use District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} residence-cum-office verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "residenceCumOfficeVerificationReports" (${columnNames})
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
                 address_locatable, total_family_members, staff_strength, political_connection,
                 other_observation, final_status, house_status, office_status
          FROM "residenceCumOfficeVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Family Members: ${verifiedRecord.total_family_members || 'NULL'}`);
        console.log(`      Staff Strength: ${verifiedRecord.staff_strength || 'NULL'}`);
        console.log(`      House Status: ${verifiedRecord.house_status || 'NULL'}`);
        console.log(`      Office Status: ${verifiedRecord.office_status || 'NULL'}`);
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
    console.log('📊 Residence-cum-Office Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN total_family_members IS NOT NULL THEN 1 END) as has_family_count,
        COUNT(CASE WHEN staff_strength IS NOT NULL THEN 1 END) as has_staff_count,
        COUNT(CASE WHEN house_status IS NOT NULL THEN 1 END) as has_house_status,
        COUNT(CASE WHEN office_status IS NOT NULL THEN 1 END) as has_office_status
      FROM "residenceCumOfficeVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Residence-cum-Office Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Family Count: ${row.has_family_count}/${row.count}`);
      console.log(`      Has Staff Count: ${row.has_staff_count}/${row.count}`);
      console.log(`      Has House Status: ${row.has_house_status}/${row.count}`);
      console.log(`      Has Office Status: ${row.has_office_status}/${row.count}`);
    });

    console.log('\n✅ Residence-cum-office verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testResidenceCumOfficeVerification().catch(console.error);
