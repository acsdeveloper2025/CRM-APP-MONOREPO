/**
 * Test Property Individual Verification Database Insertion
 */

const { Pool } = require('pg');
const { mapPropertyIndividualFormDataToDatabase, validatePropertyIndividualRequiredFields, getPropertyIndividualAvailableDbColumns } = require('./dist/utils/propertyIndividualFormFieldMapping');
const { detectResidenceFormType } = require('./dist/utils/formTypeDetection'); // Use residence detection for Property Individual

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function testPropertyIndividualVerification() {
  console.log('🧪 Testing Property Individual Verification Database Insertion\n');

  try {
    // Sample comprehensive Property Individual form data for different form types
    const testCases = [
      {
        name: 'POSITIVE Property Individual Verification',
        formData: {
          outcome: 'VERIFIED',
          addressLocatable: 'Easy',
          addressRating: 'Excellent',
          propertyType: 'Residential House',
          propertyStatus: 'Occupied',
          propertyOwnership: 'Self Owned',
          propertyAge: 15,
          propertyCondition: 'Good',
          propertyArea: 1800.75,
          propertyValue: 12500000.00,
          marketValue: 13000000.00,
          constructionType: 'RCC Structure',
          ownerName: 'Rajesh Kumar',
          ownerRelation: 'Self',
          ownerAge: 45,
          ownerOccupation: 'Software Engineer',
          ownerIncome: 125000.00,
          yearsOfResidence: 10,
          familyMembers: 4,
          earningMembers: 2,
          propertyDocuments: 'Sale Deed, Property Tax Receipt, Mutation Certificate',
          documentVerificationStatus: 'Verified',
          titleClearStatus: 'Clear',
          mutationStatus: 'Completed',
          taxPaymentStatus: 'Up to Date',
          metPersonName: 'Rajesh Kumar',
          metPersonDesignation: 'Property Owner',
          metPersonRelation: 'Self',
          metPersonContact: '+91-9876543210',
          neighbor1Name: 'Suresh Sharma',
          neighbor1Confirmation: 'Positive',
          neighbor2Name: 'Priya Patel',
          neighbor2Confirmation: 'Positive',
          localityReputation: 'Excellent',
          tpcMetPerson1: 'Yes',
          nameOfTpc1: 'Local Shopkeeper',
          tpcConfirmation1: 'Positive',
          tpcMetPerson2: 'No',
          nameOfTpc2: '',
          tpcConfirmation2: null,
          legalIssues: 'No',
          loanAgainstProperty: 'Yes',
          bankName: 'HDFC Bank',
          loanAmount: 8000000.00,
          emiAmount: 75000.00,
          electricityConnection: 'Available',
          waterConnection: 'Municipal Supply',
          gasConnection: 'LPG',
          internetConnection: 'Broadband',
          roadConnectivity: 'Excellent',
          publicTransport: 'Good',
          locality: 'Premium Residential Colony',
          addressStructure: 'Independent House',
          addressFloor: 'Ground + 2 Floors',
          addressStructureColor: 'Cream',
          doorColor: 'Brown',
          landmark1: 'Near City Mall',
          landmark2: 'Opposite Park',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Excellent',
          safetySecurity: 'Good',
          otherObservation: 'All Property Individual documents verified successfully. Family is well-settled and property is in excellent condition.',
          propertyConcerns: 'None',
          verificationChallenges: 'None',
          finalStatus: 'Positive',
          remarks: 'Property Individual verification completed successfully'
        }
      },
      {
        name: 'SHIFTED Property Individual Verification',
        formData: {
          outcome: 'SHIFTED',
          addressLocatable: 'Difficult',
          addressRating: 'Poor',
          metPersonName: 'Neighbor',
          metPersonRelation: 'Neighbor',
          shiftedPeriod: '6 months ago',
          currentLocation: 'Moved to Bangalore for job',
          premisesStatus: 'Locked',
          previousOwnerName: 'Rajesh Kumar',
          locality: 'Old Residential Area',
          addressStructure: 'Independent House',
          addressFloor: 'Ground Floor',
          addressStructureColor: 'White',
          doorColor: 'Blue',
          landmark1: 'Near Old Temple',
          landmark2: 'Behind School',
          politicalConnection: 'No',
          dominatedArea: 'No',
          feedbackFromNeighbour: 'NoAdverse',
          infrastructureStatus: 'Average',
          safetySecurity: 'Average',
          otherObservation: 'Property owner has shifted to another city. House is currently locked.',
          finalStatus: 'Negative'
        }
      },
      {
        name: 'UNTRACEABLE Property Individual Verification',
        formData: {
          outcome: 'UNTRACEABLE',
          contactPerson: 'Local Resident',
          callRemark: 'Number Not Reachable',
          locality: 'Remote Residential Area',
          landmark1: 'Near Highway',
          landmark2: 'Behind Petrol Pump',
          dominatedArea: 'No',
          otherObservation: 'Unable to locate the property owner or any family member',
          finalStatus: 'Negative'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}\n`);

      // Detect form type (using residence detection for Property Individual)
      const { formType, verificationOutcome } = detectResidenceFormType(testCase.formData);
      console.log(`   Detected Form Type: ${formType}`);
      console.log(`   Verification Outcome: ${verificationOutcome}`);

      // Map form data to database fields
      const mappedFormData = mapPropertyIndividualFormDataToDatabase(testCase.formData);
      console.log(`   Mapped Fields: ${Object.keys(mappedFormData).length}`);

      // Validate required fields
      const validation = validatePropertyIndividualRequiredFields(testCase.formData, formType);
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
        full_address: 'Test Property Individual Address, Residential District',
        
        // Verification metadata
        verification_date: new Date().toISOString().split('T')[0],
        verification_time: new Date().toTimeString().split(' ')[0],
        verified_by: testUser.id,
        total_images: 5,
        total_selfies: 1,
        remarks: testCase.formData.remarks || `${formType} Property Individual verification completed`,
        
        // Merge all mapped form data
        ...mappedFormData
      };

      // Build dynamic INSERT query
      const columns = Object.keys(dbInsertData).filter(key => dbInsertData[key] !== undefined);
      const values = columns.map(key => dbInsertData[key]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const columnNames = columns.map(col => `"${col}"`).join(', ');

      const insertQuery = `
        INSERT INTO "propertyIndividualVerificationReports" (${columnNames})
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
                 address_locatable, property_type, owner_name, property_ownership,
                 political_connection, other_observation, final_status, property_value
          FROM "propertyIndividualVerificationReports" 
          WHERE id = $1
        `;
        
        const verifyResult = await pool.query(verifyQuery, [insertedRecord.id]);
        const verifiedRecord = verifyResult.rows[0];
        
        console.log(`   📊 Verification Sample Fields:`);
        console.log(`      Met Person: ${verifiedRecord.met_person_name || 'NULL'}`);
        console.log(`      Locality: ${verifiedRecord.locality || 'NULL'}`);
        console.log(`      Address Locatable: ${verifiedRecord.address_locatable || 'NULL'}`);
        console.log(`      Property Type: ${verifiedRecord.property_type || 'NULL'}`);
        console.log(`      Owner Name: ${verifiedRecord.owner_name || 'NULL'}`);
        console.log(`      Property Ownership: ${verifiedRecord.property_ownership || 'NULL'}`);
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
    console.log('📊 Property Individual Verification Database Summary:\n');
    
    const statsQuery = `
      SELECT 
        form_type,
        verification_outcome,
        COUNT(*) as count,
        AVG(total_images) as avg_images,
        COUNT(CASE WHEN met_person_name IS NOT NULL THEN 1 END) as has_met_person,
        COUNT(CASE WHEN locality IS NOT NULL THEN 1 END) as has_locality,
        COUNT(CASE WHEN property_type IS NOT NULL THEN 1 END) as has_property_type,
        COUNT(CASE WHEN owner_name IS NOT NULL THEN 1 END) as has_owner_name,
        COUNT(CASE WHEN property_ownership IS NOT NULL THEN 1 END) as has_property_ownership,
        AVG(property_value) as avg_property_value,
        AVG(family_members) as avg_family_members
      FROM "propertyIndividualVerificationReports"
      GROUP BY form_type, verification_outcome
      ORDER BY form_type, verification_outcome
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    console.log('Property Individual Form Type Distribution:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.form_type} (${row.verification_outcome}): ${row.count} records`);
      console.log(`      Avg Images: ${parseFloat(row.avg_images || 0).toFixed(1)}`);
      console.log(`      Has Met Person: ${row.has_met_person}/${row.count}`);
      console.log(`      Has Locality: ${row.has_locality}/${row.count}`);
      console.log(`      Has Property Type: ${row.has_property_type}/${row.count}`);
      console.log(`      Has Owner Name: ${row.has_owner_name}/${row.count}`);
      console.log(`      Has Property Ownership: ${row.has_property_ownership}/${row.count}`);
      console.log(`      Avg Property Value: ₹${parseFloat(row.avg_property_value || 0).toLocaleString()}`);
      console.log(`      Avg Family Members: ${parseFloat(row.avg_family_members || 0).toFixed(1)}`);
    });

    console.log('\n✅ Property Individual verification database insertion testing completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testPropertyIndividualVerification().catch(console.error);
