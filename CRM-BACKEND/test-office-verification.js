/**
 * Test Office Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapOfficeFormDataToDatabase, validateOfficeRequiredFields, getOfficeAvailableDbColumns } = require('./dist/utils/officeFormFieldMapping');
const { detectOfficeFormType } = require('./dist/utils/formTypeDetection');

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testOfficeVerification() {
  console.log('🧪 Testing Office Verification Database Insertion\n');

  try {
    // Sample comprehensive office form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Office Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          officeStatus: 'Opened',
          metPerson: 'HR Manager',
          designation: 'HR Manager',
          applicantDesignation: 'Software Engineer',
          workingPeriod: '2 years',
          workingStatus: 'Employed',
          officeType: 'Corporate',
          companyNatureOfBusiness: 'Software Development',
          businessPeriod: '10 years',
          establishmentPeriod: '2014',
          staffStrength: 50,
          staffSeen: 25,
          currentCompanyName: 'Tech Solutions Pvt Ltd',
          documentShown: 'Employee ID, Salary Slip',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'John Smith',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          locality: 'Urban',
          addressStructure: 'Commercial Building',
          addressFloor: '3rd Floor',
          addressStructureColor: 'Blue',
          doorColor: 'Glass',
          companyNamePlateStatus: 'Available',
          nameOnCompanyBoard: 'Tech Solutions Pvt Ltd',
          landmark1: 'Near Metro Station',
          landmark2: 'Opposite Shopping Mall',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'All details verified successfully',
          finalStatus: 'Positive',
          remarks: 'Office verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Office Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          officeStatus: 'Closed',
          metPerson: 'Security Guard',
          designation: 'Security',
          currentCompanyName: 'New Tech Corp',
          oldOfficeShiftedPeriod: '8 months ago',
          currentCompanyPeriod: '6 months',
          premisesStatus: 'Vacant',
          locality: 'Urban',
          addressStructure: 'Office Complex',
          addressFloor: '2nd Floor',
          addressStructureColor: 'White',
          doorColor: 'Brown',
          companyNamePlateStatus: 'Removed',
          nameOnCompanyBoard: 'Old Company Name',
          landmark1: 'Near Bank',
          landmark2: 'Behind Restaurant',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          otherObservation: 'Office has been shifted to new location',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Office Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Receptionist',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Commercial Area',
          landmark1: 'Near IT Park',
          landmark2: 'Behind Coffee Shop',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the office',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type
      const { formType, verificationOutcome } = detectOfficeFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapOfficeFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validateOfficeRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Office Address, Business District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} office verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "officeVerificationReports" (${columnNames})
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
                 other_observation, final_status, office_status
          FROM "officeVerificationReports" 
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
    console.log('📊 Office Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN staff_strength IS NOT NULL THEN 1 END) as has_staff_count,
        COUNT(CASE WHEN office_status IS NOT NULL THEN 1 END) as has_office_status
      FROM "officeVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Office Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Staff Count: ${row.has_staff_count}/${row.count}`);
      console.log(`      Has Office Status: ${row.has_office_status}/${row.count}`);
    });

    console.log('\n✅ Office verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testOfficeVerification().catch(console.error);
