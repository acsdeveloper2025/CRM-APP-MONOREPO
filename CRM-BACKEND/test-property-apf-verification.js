/**
 * Test Property APF Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapPropertyApfFormDataToDatabase, validatePropertyApfRequiredFields, getPropertyApfAvailableDbColumns } = require('./dist/utils/propertyApfFormFieldMapping');
const { detectBusinessFormType } = require('./dist/utils/formTypeDetection'); // Use business detection for Property APF

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testPropertyApfVerification() {
  console.log('🧪 Testing Property APF Verification Database Insertion\n');

  try {
    // Sample comprehensive Property APF form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Property APF Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          propertyType: 'Residential Apartment',
          propertyStatus: 'Under Construction',
          propertyOwnership: 'Freehold',
          propertyAge: 2,
          propertyCondition: 'Excellent',
          propertyArea: 1200.50,
          propertyValue: 8500000.00,
          marketValue: 9000000.00,
          apfStatus: 'Available',
          apfNumber: 'APF/2024/001234',
          apfIssueDate: '2024-01-15',
          apfExpiryDate: '2026-01-15',
          apfIssuingAuthority: 'Housing Finance Authority',
          apfValidityStatus: 'Valid',
          apfAmount: 7000000.00,
          apfUtilizedAmount: 5000000.00,
          apfBalanceAmount: 2000000.00,
          metPersonName: 'Property Manager',
          metPersonDesignation: 'Site Manager',
          metPersonRelation: 'Employee',
          metPersonContact: '+91-9876543210',
          projectName: 'Skyline Towers',
          projectStatus: 'Under Construction',
          projectApprovalStatus: 'Approved',
          projectCompletionPercentage: 75,
          totalUnits: 200,
          completedUnits: 150,
          soldUnits: 180,
          availableUnits: 20,
          possessionStatus: 'Partial',
          builderName: 'Premium Builders Pvt Ltd',
          builderContact: '+91-9876543211',
          developerName: 'Elite Developers',
          developerContact: '+91-9876543212',
          builderRegistrationNumber: 'RERA/2023/PB001',
          reraRegistrationNumber: 'RERA/2023/ST001',
          loanAmount: 6000000.00,
          loanPurpose: 'Home Purchase',
          loanStatus: 'Approved',
          bankName: 'State Bank of India',
          loanAccountNumber: 'SBI123456789',
          emiAmount: 55000.00,
          documentShownStatus: 'Yes',
          documentType: 'APF Certificate, Sale Agreement, Building Plan, RERA Certificate',
          documentVerificationStatus: 'Verified',
          legalClearance: 'Available',
          titleClearance: 'Clear',
          encumbranceStatus: 'Clear',
          litigationStatus: 'No Litigation',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Neighbor',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          locality: 'Premium Residential Area',
          addressStructure: 'High-rise Building',
          addressFloor: '15th Floor',
          addressStructureColor: 'Glass & Steel',
          doorColor: 'Brown',
          landmark1: 'Near Metro Station',
          landmark2: 'Opposite Shopping Complex',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Excellent',
          roadConnectivity: 'Excellent',
          otherObservation: 'All Property APF documents verified successfully. Property construction is progressing as per schedule.',
          propertyConcerns: 'None',
          financialConcerns: 'None',
          finalStatus: 'Positive',
          remarks: 'Property APF verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Property APF Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Average',
          metPersonName: 'Security Guard',
          metPersonDesignation: 'Security',
          metPersonRelation: 'Employee',
          shiftedPeriod: '1 year ago',
          currentLocation: 'New Development Site, Phase 2',
          premisesStatus: 'Vacant',
          locality: 'Old Residential Area',
          addressStructure: 'Abandoned Building',
          addressFloor: '5th Floor',
          addressStructureColor: 'Faded White',
          doorColor: 'Rusted',
          landmark1: 'Near Old Market',
          landmark2: 'Behind Closed School',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Poor',
          roadConnectivity: 'Average',
          otherObservation: 'Property has been shifted to new location. Old site is abandoned.',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Property APF Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Local Resident',
          callRemark: 'Did Not Pick Up Call',
          locality: 'Remote Property Area',
          landmark1: 'Near Highway',
          landmark2: 'Behind Gas Station',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the property or any responsible person',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type (using business detection for Property APF)
      const { formType, verificationOutcome } = detectBusinessFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapPropertyApfFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validatePropertyApfRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Property APF Address, Premium District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} Property APF verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "propertyApfVerificationReports" (${columnNames})
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
                 address_locatable, property_type, apf_status, project_name, builder_name,
                 political_connection, other_observation, final_status, property_value
          FROM "propertyApfVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Property Type: ${verifiedRecord.property_type || 'NULL'}`);
        console.log(`      APF Status: ${verifiedRecord.apf_status || 'NULL'}`);
        console.log(`      Project Name: ${verifiedRecord.project_name || 'NULL'}`);
        console.log(`      Builder Name: ${verifiedRecord.builder_name || 'NULL'}`);
        console.log(`      Property Value: ${verifiedRecord.property_value || 'NULL'}`);
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
    console.log('📊 Property APF Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN property_type IS NOT NULL THEN 1 END) as has_property_type,
        COUNT(CASE WHEN apf_status IS NOT NULL THEN 1 END) as has_apf_status,
        COUNT(CASE WHEN project_name IS NOT NULL THEN 1 END) as has_project_name,
        COUNT(CASE WHEN builder_name IS NOT NULL THEN 1 END) as has_builder_name,
        AVG(property_value) as avg_property_value
      FROM "propertyApfVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Property APF Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Property Type: ${row.has_property_type}/${row.count}`);
      console.log(`      Has APF Status: ${row.has_apf_status}/${row.count}`);
      console.log(`      Has Project Name: ${row.has_project_name}/${row.count}`);
      console.log(`      Has Builder Name: ${row.has_builder_name}/${row.count}`);
      console.log(`      Avg Property Value: ₹${parseFloat(row.avg_property_value || 0).toLocaleString()}`);
    });

    console.log('\n✅ Property APF verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testPropertyApfVerification().catch(console.error);
