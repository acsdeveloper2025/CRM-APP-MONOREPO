/**
 * Test script to verify residence form field mapping
 */

const { mapFormDataToDatabase, validateRequiredFields, getAvailableDbColumns, getMappedMobileFields } = require('./dist/utils/residenceFormFieldMapping');

console.log('🧪 Testing Residence Form Field Mapping\n');

// Sample form data for different form types
const sampleFormData = {
  // Positive residence form data
  positive: {
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
  },
  
  // Shifted residence form data
  shifted: {
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
  },
  
  // Untraceable form data
  untraceable: {
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
};

// Test field mapping for each form type
console.log('📊 Testing Field Mapping:\n');

Object.entries(sampleFormData).forEach(([formType, formData]) => {
  console.log(`🔍 Testing ${formType.toUpperCase()} form:`);
  
  const mappedData = mapFormDataToDatabase(formData);
  const fieldCount = Object.keys(mappedData).length;
  const originalCount = Object.keys(formData).length;
  
  console.log(`   Original fields: ${originalCount}`);
  console.log(`   Mapped fields: ${fieldCount}`);
  console.log(`   Sample mapped fields:`, Object.keys(mappedData).slice(0, 10).join(', '));
  
  // Test validation
  const validation = validateRequiredFields(formData, formType.toUpperCase());
  console.log(`   Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (!validation.isValid) {
    console.log(`   Missing fields: ${validation.missingFields.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.log(`   Warnings: ${validation.warnings.join(', ')}`);
  }
  console.log('');
});

// Test utility functions
console.log('🔧 Testing Utility Functions:\n');

const availableColumns = getAvailableDbColumns();
console.log(`📋 Available DB Columns (${availableColumns.length}):`, availableColumns.slice(0, 15).join(', '), '...');

const mappedFields = getMappedMobileFields();
console.log(`📱 Mapped Mobile Fields (${mappedFields.length}):`, mappedFields.slice(0, 15).join(', '), '...');

// Test edge cases
console.log('\n🧪 Testing Edge Cases:\n');

// Empty form data
const emptyMapped = mapFormDataToDatabase({});
console.log(`Empty form data: ${Object.keys(emptyMapped).length} fields mapped`);

// Null values
const nullData = { metPersonName: null, totalFamilyMembers: null, addressLocatable: '' };
const nullMapped = mapFormDataToDatabase(nullData);
console.log(`Null values: ${Object.keys(nullMapped).length} fields mapped, values:`, nullMapped);

// Invalid numeric values
const invalidNumeric = { totalFamilyMembers: 'invalid', applicantAge: 'not a number' };
const invalidMapped = mapFormDataToDatabase(invalidNumeric);
console.log(`Invalid numeric: ${Object.keys(invalidMapped).length} fields mapped, values:`, invalidMapped);

// Test enum values
const enumData = { addressLocatable: { toString: () => 'Easy' }, houseStatus: { toString: () => 'Opened' } };
const enumMapped = mapFormDataToDatabase(enumData);
console.log(`Enum values: ${Object.keys(enumMapped).length} fields mapped, values:`, enumMapped);

console.log('\n✅ Field mapping tests completed successfully!');

// Generate SQL for testing
console.log('\n📝 Sample SQL Generation:\n');

const testData = sampleFormData.positive;
const mappedTestData = mapFormDataToDatabase(testData);

// Add required system fields
const dbInsertData = {
  case_id: 'test-case-id',
  caseId: 12345,
  form_type: 'POSITIVE',
  verification_outcome: 'Positive & Door Locked',
  customer_name: 'Test Customer',
  customer_phone: '+1234567890',
  full_address: 'Test Address',
  verification_date: '2025-09-04',
  verification_time: '10:30:00',
  verified_by: 'test-user-id',
  total_images: 5,
  total_selfies: 1,
  remarks: 'Test verification',
  ...mappedTestData
};

const columns = Object.keys(dbInsertData);
const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
const columnNames = columns.map(col => `"${col}"`).join(', ');

const insertQuery = `
INSERT INTO "residenceVerificationReports" (${columnNames})
VALUES (${placeholders})
`;

console.log(`Generated SQL with ${columns.length} columns:`);
console.log(insertQuery);
console.log(`\nColumn list: ${columns.join(', ')}`);
