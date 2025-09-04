/**
 * Test script to verify form type detection logic
 */

// Import the form type detection functions
const { detectResidenceFormType } = require('./dist/utils/formTypeDetection');

console.log('🧪 Testing Form Type Detection Logic\n');

// Test cases for different form types
const testCases = [
  {
    name: 'Positive & Door Locked',
    formData: { outcome: 'VERIFIED' },
    expected: { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' }
  },
  {
    name: 'Shifted & Door Lock',
    formData: { outcome: 'SHIFTED' },
    expected: { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' }
  },
  {
    name: 'NSP & Door Lock',
    formData: { outcome: 'NSP' },
    expected: { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' }
  },
  {
    name: 'Entry Restricted (ERT)',
    formData: { outcome: 'ERT' },
    expected: { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' }
  },
  {
    name: 'Untraceable',
    formData: { outcome: 'UNTRACEABLE' },
    expected: { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' }
  },
  {
    name: 'Untraceable (field indicators)',
    formData: { 
      callRemark: 'Did Not Pick Up Call',
      landmark3: 'Near temple',
      landmark4: 'Behind school'
    },
    expected: { formType: 'UNTRACEABLE', verificationOutcome: 'Untraceable' }
  },
  {
    name: 'Shifted (field indicators)',
    formData: { 
      shiftedPeriod: '6 months ago',
      roomStatus: 'Closed'
    },
    expected: { formType: 'SHIFTED', verificationOutcome: 'Shifted & Door Lock' }
  },
  {
    name: 'Entry Restricted (field indicators)',
    formData: { 
      nameOfMetPerson: 'Security Guard',
      metPersonType: 'Security'
    },
    expected: { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' }
  },
  {
    name: 'NSP (field indicators)',
    formData: { 
      stayingPersonName: 'John Doe',
      houseStatus: 'Closed',
      metPersonStatus: 'Neighbour'
    },
    expected: { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' }
  },
  {
    name: 'Default to Positive',
    formData: { 
      someOtherField: 'value'
    },
    expected: { formType: 'POSITIVE', verificationOutcome: 'Positive & Door Locked' }
  },
  {
    name: 'Legacy NOT_VERIFIED',
    formData: { outcome: 'NOT_VERIFIED' },
    expected: { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' }
  },
  {
    name: 'Legacy NEGATIVE',
    formData: { outcome: 'NEGATIVE' },
    expected: { formType: 'NSP', verificationOutcome: 'NSP & Door Lock' }
  },
  {
    name: 'Legacy REFER',
    formData: { outcome: 'REFER' },
    expected: { formType: 'ENTRY_RESTRICTED', verificationOutcome: 'ERT' }
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = detectResidenceFormType(testCase.formData);
    
    const isCorrect = result.formType === testCase.expected.formType && 
                     result.verificationOutcome === testCase.expected.verificationOutcome;
    
    if (isCorrect) {
      console.log(`✅ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Result: ${result.formType} -> ${result.verificationOutcome}`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.name}`);
      console.log(`   Expected: ${testCase.expected.formType} -> ${testCase.expected.verificationOutcome}`);
      console.log(`   Got: ${result.formType} -> ${result.verificationOutcome}`);
      failed++;
    }
    console.log('');
  } catch (error) {
    console.log(`💥 Test ${index + 1}: ${testCase.name} - ERROR`);
    console.log(`   Error: ${error.message}`);
    failed++;
    console.log('');
  }
});

console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Form type detection is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please check the implementation.');
  process.exit(1);
}
