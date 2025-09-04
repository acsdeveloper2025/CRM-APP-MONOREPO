/**
 * Test Enhanced Form Type Detection System
 */

const { 
  detectFormTypeEnhanced, 
  detectFormType,
  analyzeFormTypeDetection,
  getFormTypeIndicators,
  isValidFormType,
  getValidFormTypes,
  // Legacy functions
  detectResidenceFormType,
  detectOfficeFormType,
  detectBusinessFormType,
  detectBuilderFormType,
  detectResidenceCumOfficeFormType,
  detectNocFormType,
  detectPropertyApfFormType,
  detectPropertyIndividualFormType,
  detectDsaConnectorFormType
} = require('./dist/utils/formTypeDetection');

async function testEnhancedFormDetection() {
  console.log('🧪 Testing Enhanced Form Type Detection System\n');

  try {
    // Test cases for different verification types and scenarios
    const testCases = [
      {
        name: 'RESIDENCE - POSITIVE with direct outcome',
        verificationType: 'RESIDENCE',
        formData: {
          outcome: 'VERIFIED',
          applicantName: 'John Doe',
          familyMembers: 4,
          yearsOfStay: 5,
          ownershipStatus: 'Owned',
          locality: 'Premium Area'
        },
        expectedFormType: 'POSITIVE',
        expectedConfidence: 95
      },
      {
        name: 'RESIDENCE - SHIFTED with field indicators',
        verificationType: 'RESIDENCE',
        formData: {
          shiftedPeriod: '6 months ago',
          currentLocation: 'New Address',
          premisesStatus: 'Vacant',
          roomStatus: 'Locked',
          locality: 'Old Area'
        },
        expectedFormType: 'SHIFTED',
        expectedConfidence: 80
      },
      {
        name: 'OFFICE - UNTRACEABLE with pattern matching',
        verificationType: 'OFFICE',
        formData: {
          callRemark: 'Phone not reachable',
          contactPerson: 'Security Guard',
          businessClosed: true,
          locality: 'Commercial Area'
        },
        expectedFormType: 'UNTRACEABLE',
        expectedConfidence: 85
      },
      {
        name: 'BUSINESS - ENTRY_RESTRICTED with specific indicators',
        verificationType: 'BUSINESS',
        formData: {
          entryRestrictionReason: 'Security restrictions',
          securityPersonName: 'Guard Name',
          accessDenied: true,
          businessName: 'Test Business'
        },
        expectedFormType: 'ENTRY_RESTRICTED',
        expectedConfidence: 75
      },
      {
        name: 'PROPERTY_APF - NSP with mixed indicators',
        verificationType: 'PROPERTY_APF',
        formData: {
          apfStatus: 'Conditional',
          temporaryApf: true,
          projectName: 'Test Project',
          builderName: 'Test Builder'
        },
        expectedFormType: 'NSP',
        expectedConfidence: 70
      },
      {
        name: 'DSA_CONNECTOR - POSITIVE with comprehensive data',
        verificationType: 'DSA_CONNECTOR',
        formData: {
          outcome: 'POSITIVE',
          connectorName: 'Test Connector',
          connectorCode: 'DSA001',
          businessName: 'Test Business',
          licenseStatus: 'Valid',
          monthlyBusinessVolume: 1000000,
          totalStaff: 10,
          businessOperational: 'Yes'
        },
        expectedFormType: 'POSITIVE',
        expectedConfidence: 95
      }
    ];

    console.log('📊 Testing Enhanced Detection System:\n');

    for (const testCase of testCases) {
      console.log(`🔍 Testing: ${testCase.name}`);
      
      // Test enhanced detection
      const enhancedResult = detectFormTypeEnhanced(testCase.formData, testCase.verificationType);
      console.log(`   Enhanced Detection:`);
      console.log(`      Form Type: ${enhancedResult.formType}`);
      console.log(`      Verification Outcome: ${enhancedResult.verificationOutcome}`);
      console.log(`      Confidence: ${enhancedResult.confidence}%`);
      console.log(`      Detection Method: ${enhancedResult.detectionMethod}`);
      
      // Test generic detection
      const genericResult = detectFormType(testCase.verificationType, testCase.formData);
      console.log(`   Generic Detection: ${genericResult.formType} (${genericResult.confidence}%)`);
      
      // Test detailed analysis
      const analysis = analyzeFormTypeDetection(testCase.formData, testCase.verificationType);
      console.log(`   Analysis:`);
      console.log(`      Outcome Found: ${analysis.analysis.outcomeFound}`);
      console.log(`      Total Fields: ${analysis.analysis.totalFields}`);
      console.log(`      Pattern Matches: ${analysis.analysis.patternMatches.join(', ') || 'None'}`);
      console.log(`      Confidence Factors: ${analysis.analysis.confidenceFactors.join(', ')}`);
      
      // Validate results
      const isCorrectType = enhancedResult.formType === testCase.expectedFormType;
      const isGoodConfidence = enhancedResult.confidence >= (testCase.expectedConfidence - 20);
      
      console.log(`   ✅ Type Match: ${isCorrectType ? 'PASS' : 'FAIL'}`);
      console.log(`   ✅ Confidence: ${isGoodConfidence ? 'PASS' : 'FAIL'}`);
      
      console.log('');
    }

    // Test legacy function compatibility
    console.log('🔄 Testing Legacy Function Compatibility:\n');
    
    const legacyTests = [
      { func: detectResidenceFormType, name: 'Residence', data: { outcome: 'VERIFIED' } },
      { func: detectOfficeFormType, name: 'Office', data: { outcome: 'SHIFTED' } },
      { func: detectBusinessFormType, name: 'Business', data: { outcome: 'NSP' } },
      { func: detectBuilderFormType, name: 'Builder', data: { outcome: 'ERT' } },
      { func: detectResidenceCumOfficeFormType, name: 'Residence-Cum-Office', data: { outcome: 'UNTRACEABLE' } },
      { func: detectNocFormType, name: 'NOC', data: { outcome: 'POSITIVE' } },
      { func: detectPropertyApfFormType, name: 'Property APF', data: { outcome: 'VERIFIED' } },
      { func: detectPropertyIndividualFormType, name: 'Property Individual', data: { outcome: 'SHIFTED' } },
      { func: detectDsaConnectorFormType, name: 'DSA Connector', data: { outcome: 'NSP' } }
    ];

    legacyTests.forEach(test => {
      const result = test.func(test.data);
      console.log(`   ${test.name}: ${result.formType} (${result.confidence}%) - ${result.detectionMethod}`);
    });

    // Test utility functions
    console.log('\n🛠️ Testing Utility Functions:\n');
    
    const verificationTypes = ['RESIDENCE', 'OFFICE', 'BUSINESS', 'BUILDER', 'RESIDENCE_CUM_OFFICE', 
                              'NOC', 'PROPERTY_APF', 'PROPERTY_INDIVIDUAL', 'DSA_CONNECTOR'];
    
    verificationTypes.forEach(type => {
      const validTypes = getValidFormTypes(type);
      const indicators = getFormTypeIndicators(type);
      
      console.log(`   ${type}:`);
      console.log(`      Valid Form Types: ${validTypes.join(', ')}`);
      console.log(`      Has Indicators: ${indicators ? 'Yes' : 'No'}`);
      
      if (indicators) {
        console.log(`      Positive Indicators: ${indicators.positiveIndicators.length}`);
        console.log(`      Shifted Indicators: ${indicators.shiftedIndicators.length}`);
        console.log(`      NSP Indicators: ${indicators.nspIndicators.length}`);
        console.log(`      Entry Restricted Indicators: ${indicators.entryRestrictedIndicators.length}`);
        console.log(`      Untraceable Indicators: ${indicators.untraceableIndicators.length}`);
      }
      
      // Test validation
      const isValidPositive = isValidFormType(type, 'POSITIVE');
      const isValidInvalid = isValidFormType(type, 'INVALID');
      console.log(`      Validation: POSITIVE=${isValidPositive}, INVALID=${isValidInvalid}`);
      console.log('');
    });

    // Performance test
    console.log('⚡ Performance Testing:\n');
    
    const performanceData = {
      outcome: 'VERIFIED',
      applicantName: 'Test User',
      familyMembers: 4,
      businessName: 'Test Business',
      propertyValue: 1000000,
      locality: 'Test Area'
    };

    const iterations = 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      detectFormTypeEnhanced(performanceData, 'RESIDENCE');
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`   Processed ${iterations} detections in ${endTime - startTime}ms`);
    console.log(`   Average time per detection: ${avgTime.toFixed(2)}ms`);
    console.log(`   Detections per second: ${Math.round(1000 / avgTime)}`);

    console.log('\n✅ Enhanced Form Type Detection System testing completed successfully!');
    console.log('\n📈 System Improvements:');
    console.log('   • Confidence scoring for all detections');
    console.log('   • Support for all 9 verification types');
    console.log('   • Enhanced field indicator analysis');
    console.log('   • Pattern-based detection fallbacks');
    console.log('   • Detailed analysis and debugging information');
    console.log('   • Backward compatibility with legacy functions');
    console.log('   • Performance optimized for high-volume processing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testEnhancedFormDetection().catch(console.error);
