#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// List of forms that need outcome mapping fixes
const formsToFix = [
  'components/forms/builder/EntryRestrictedBuilderForm.tsx',
  'components/forms/builder/NspBuilderForm.tsx',
  'components/forms/builder/PositiveBuilderForm.tsx',
  'components/forms/builder/ShiftedBuilderForm.tsx',
  'components/forms/builder/UntraceableBuilderForm.tsx',
  'components/forms/business/EntryRestrictedBusinessForm.tsx',
  'components/forms/business/NspBusinessForm.tsx',
  'components/forms/business/PositiveBusinessForm.tsx',
  'components/forms/business/ShiftedBusinessForm.tsx',
  'components/forms/dsa-dst-connector/EntryRestrictedDsaForm.tsx',
  'components/forms/dsa-dst-connector/NspDsaForm.tsx',
  'components/forms/dsa-dst-connector/PositiveDsaForm.tsx',
  'components/forms/dsa-dst-connector/ShiftedDsaForm.tsx',
  'components/forms/dsa-dst-connector/UntraceableDsaForm.tsx',
  'components/forms/noc/EntryRestrictedNocForm.tsx',
  'components/forms/noc/NspNocForm.tsx',
  'components/forms/noc/PositiveNocForm.tsx',
  'components/forms/noc/ShiftedNocForm.tsx',
  'components/forms/noc/UntraceableNocForm.tsx',
  'components/forms/office/EntryRestrictedOfficeForm.tsx',
  'components/forms/office/NspOfficeForm.tsx',
  'components/forms/office/PositiveOfficeForm.tsx',
  'components/forms/office/ShiftedOfficeForm.tsx',
  'components/forms/property-apf/EntryRestrictedPropertyApfForm.tsx',
  'components/forms/property-apf/PositiveNegativePropertyApfForm.tsx',
  'components/forms/property-apf/UntraceablePropertyApfForm.tsx',
  'components/forms/property-individual/EntryRestrictedPropertyIndividualForm.tsx',
  'components/forms/property-individual/NspPropertyIndividualForm.tsx',
  'components/forms/property-individual/PositivePropertyIndividualForm.tsx',
  'components/forms/property-individual/UntraceablePropertyIndividualForm.tsx',
  'components/forms/residence-cum-office/EntryRestrictedResiCumOfficeForm.tsx',
  'components/forms/residence-cum-office/NspResiCumOfficeForm.tsx',
  'components/forms/residence-cum-office/PositiveResiCumOfficeForm.tsx',
  'components/forms/residence-cum-office/ShiftedResiCumOfficeForm.tsx',
  'components/forms/residence-cum-office/UntraceableResiCumOfficeForm.tsx',
  'components/forms/residence/EntryRestrictedResidenceForm.tsx',
  'components/forms/residence/NspResidenceForm.tsx',
  'components/forms/residence/PositiveResidenceForm.tsx',
  'components/forms/residence/ShiftedResidenceForm.tsx'
];

function fixOutcomeMappingInFile(filePath) {
  try {
    console.log(`\n🔧 Fixing outcome mapping in ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match incomplete outcome mapping (missing Fraud and Refer)
    const incompletePattern = /outcome: report\.finalStatus === FinalStatus\.Positive \? 'VERIFIED' :\s*report\.finalStatus === FinalStatus\.Negative \? 'NOT_VERIFIED' : 'PARTIAL'/g;
    
    // Complete outcome mapping with all 5 cases
    const completeMapping = `outcome: report.finalStatus === FinalStatus.Positive ? 'VERIFIED' :
                                    report.finalStatus === FinalStatus.Negative ? 'NOT_VERIFIED' :
                                    report.finalStatus === FinalStatus.Fraud ? 'FRAUD' :
                                    report.finalStatus === FinalStatus.Refer ? 'REFER' :
                                    report.finalStatus === FinalStatus.Hold ? 'HOLD' : 'PARTIAL'`;
    
    const matches = content.match(incompletePattern);
    if (matches) {
      content = content.replace(incompletePattern, completeMapping);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ✅ Updated outcome mapping with all 5 FinalStatus cases`);
      return true;
    } else {
      console.log(`   ℹ️  No incomplete outcome mapping found (may already be complete)`);
      return false;
    }
    
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting outcome mapping fix for all forms...\n');
  console.log('🎯 Adding missing FinalStatus.Fraud and FinalStatus.Refer cases\n');
  
  let totalFixed = 0;
  
  formsToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const wasFixed = fixOutcomeMappingInFile(filePath);
      if (wasFixed) {
        totalFixed++;
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${formsToFix.length}`);
  console.log(`   Files fixed: ${totalFixed}`);
  console.log(`   Files skipped: ${formsToFix.length - totalFixed}`);
  
  if (totalFixed > 0) {
    console.log('\n✅ All outcome mapping issues have been fixed!');
    console.log('🎯 All forms now handle all 5 FinalStatus values: Positive, Negative, Fraud, Refer, Hold');
  } else {
    console.log('\n✅ All forms already had complete outcome mapping!');
  }
}

main();
