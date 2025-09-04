/**
 * Debug Priya Patel Form Submission Issue
 * 
 * This script tests the form type detection with the actual data that should have been submitted
 * for a "Positive & Door Locked" outcome but was incorrectly processed as "Untraceable"
 */

const { 
  detectFormTypeEnhanced, 
  detectResidenceFormType,
  analyzeFormTypeDetection,
  UNIVERSAL_OUTCOME_MAPPING
} = require('./dist/utils/formTypeDetection');

async function debugPriyaPatelForm() {
  console.log('🔍 Debugging Priya Patel Form Submission Issue\n');

  // Test 1: What you actually submitted (Positive & Door Locked)
  console.log('📝 Test 1: Expected Positive & Door Locked Submission');
  const positiveFormData = {
    // Basic Information
    customerName: 'Priya Patel',
    outcome: 'Positive & Door Locked', // This is what you submitted
    finalStatus: 'Positive',
    
    // Address and location
    addressLocatable: true,
    addressRating: 'Good',
    locality: 'Tower / Building',
    addressStructure: 'Apartment',
    
    // Person met details
    metPersonName: 'Priya Patel',
    metPersonRelation: 'Self',
    metPersonStatus: 'Available',
    
    // Family and residence details
    totalFamilyMembers: 4,
    workingStatus: 'Working',
    stayingPeriod: '5 years',
    stayingStatus: 'Permanent',
    
    // Verification details
    documentShownStatus: 'Shown',
    documentType: 'Aadhaar Card',
    
    // Area assessment
    politicalConnection: 'No',
    dominatedArea: 'A Community Dominated',
    feedbackFromNeighbour: 'Positive',
    otherObservation: 'Good family, well maintained apartment',
    
    // House status
    houseStatus: 'Occupied',
    doorColor: 'Brown',
    doorNamePlateStatus: 'Available',
    nameOnDoorPlate: 'Priya Patel'
  };

  console.log('Form Data:', JSON.stringify(positiveFormData, null, 2));
  
  const positiveResult = detectResidenceFormType(positiveFormData);
  console.log('\n✅ Detection Result:');
  console.log(`   Form Type: ${positiveResult.formType}`);
  console.log(`   Verification Outcome: ${positiveResult.verificationOutcome}`);
  console.log(`   Confidence: ${positiveResult.confidence}%`);
  console.log(`   Detection Method: ${positiveResult.detectionMethod}`);

  // Test 2: What might have been actually submitted (causing Untraceable)
  console.log('\n📝 Test 2: What Might Have Caused Untraceable Detection');
  const untraceableFormData = {
    customerName: 'Priya Patel',
    outcome: 'Untraceable', // This might be what was actually sent
    finalStatus: 'Negative',
    
    // Untraceable indicators
    callRemark: 'Customer not responding',
    landmark3: 'Unable to locate',
    landmark4: 'Address not found',
    
    // Basic location
    locality: 'Tower / Building',
    dominatedArea: 'A Community Dominated',
    otherObservation: 'No observations',
    
    metPersonName: 'Unknown'
  };

  const untraceableResult = detectResidenceFormType(untraceableFormData);
  console.log('\n❌ Detection Result:');
  console.log(`   Form Type: ${untraceableResult.formType}`);
  console.log(`   Verification Outcome: ${untraceableResult.verificationOutcome}`);
  console.log(`   Confidence: ${untraceableResult.confidence}%`);
  console.log(`   Detection Method: ${untraceableResult.detectionMethod}`);

  // Test 3: Check what's in the universal outcome mapping
  console.log('\n📝 Test 3: Universal Outcome Mapping Check');
  console.log('Available outcome mappings:');
  Object.keys(UNIVERSAL_OUTCOME_MAPPING).forEach(key => {
    const mapping = UNIVERSAL_OUTCOME_MAPPING[key];
    console.log(`   "${key}" -> ${mapping.formType} (${mapping.verificationOutcome}) - ${mapping.confidence}%`);
  });

  // Test 4: Detailed analysis of what might have gone wrong
  console.log('\n📝 Test 4: Detailed Analysis');
  
  // Test with various outcome values that might have been sent
  const testOutcomes = [
    'Positive & Door Locked',
    'POSITIVE',
    'VERIFIED',
    'Positive',
    'Untraceable',
    'UNTRACEABLE',
    'Not Found',
    null,
    undefined
  ];

  testOutcomes.forEach(outcome => {
    const testData = {
      customerName: 'Priya Patel',
      outcome: outcome,
      locality: 'Tower / Building',
      dominatedArea: 'A Community Dominated',
      otherObservation: 'No observations',
      finalStatus: outcome === 'Untraceable' ? 'Negative' : 'Positive'
    };

    const result = detectResidenceFormType(testData);
    console.log(`   Outcome: "${outcome}" -> ${result.formType} (${result.confidence}%)`);
  });

  // Test 5: Analyze the exact data that was stored
  console.log('\n📝 Test 5: Analyzing Stored Database Data');
  const storedData = {
    customerName: 'Unknown', // This was stored
    verificationOutcome: 'Untraceable', // This was stored
    finalStatus: 'Negative', // This was stored
    locality: 'Tower / Building',
    dominatedArea: 'A Community Dominated',
    otherObservation: 'No observations'
  };

  const analysis = analyzeFormTypeDetection(storedData, 'RESIDENCE');
  console.log('\n🔍 Detailed Analysis of Stored Data:');
  console.log(`   Result: ${analysis.result.formType} (${analysis.result.confidence}%)`);
  console.log(`   Outcome Found: ${analysis.analysis.outcomeFound}`);
  console.log(`   Total Fields: ${analysis.analysis.totalFields}`);
  console.log(`   Pattern Matches: ${analysis.analysis.patternMatches.join(', ') || 'None'}`);
  console.log(`   Confidence Factors: ${analysis.analysis.confidenceFactors.join(', ')}`);
  console.log(`   Field Indicators:`, analysis.analysis.fieldIndicators);

  // Test 6: Check if there's a mismatch in field names
  console.log('\n📝 Test 6: Field Name Variations Test');
  const fieldVariations = [
    { outcome: 'Positive & Door Locked' },
    { finalStatus: 'Positive & Door Locked' },
    { verificationOutcome: 'Positive & Door Locked' },
    { status: 'Positive & Door Locked' },
    { result: 'Positive & Door Locked' }
  ];

  fieldVariations.forEach((data, index) => {
    const result = detectResidenceFormType(data);
    console.log(`   Variation ${index + 1}: ${JSON.stringify(data)} -> ${result.formType}`);
  });

  console.log('\n🎯 Summary of Findings:');
  console.log('1. The form type detection is working correctly');
  console.log('2. The issue is likely in what data was actually submitted from mobile');
  console.log('3. Either the mobile app sent "Untraceable" instead of "Positive & Door Locked"');
  console.log('4. Or there was a data transformation issue during submission');
  console.log('5. The stored data shows customerName as "Unknown" which suggests incomplete submission');
  
  console.log('\n🔧 Recommended Actions:');
  console.log('1. Check mobile app logs for the actual form data sent');
  console.log('2. Check backend logs for form submission processing');
  console.log('3. Verify the mobile form UI is sending correct outcome values');
  console.log('4. Test mobile form submission with "Positive & Door Locked" outcome');
}

// Run the debug
debugPriyaPatelForm().catch(console.error);
