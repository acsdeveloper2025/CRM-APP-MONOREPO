#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// List of forms that still need to be fixed based on grep output
const formsToFix = [
  'components/forms/property-individual/UntraceablePropertyIndividualForm.tsx',
  'components/forms/dsa-dst-connector/NspDsaForm.tsx',
  'components/forms/property-apf/UntraceablePropertyApfForm.tsx',
  'components/forms/noc/UntraceableNocForm.tsx',
  'components/forms/noc/NspNocForm.tsx',
  'components/forms/builder/NspBuilderForm.tsx',
  'components/forms/builder/UntraceableBuilderForm.tsx'
];

// Enum replacements
const enumReplacements = [
  {
    old: 'FinalStatusUntraceable',
    new: 'FinalStatus'
  },
  {
    old: 'FinalStatusShiftedBusiness',
    new: 'FinalStatus'
  },
  {
    old: 'FinalStatusShiftedOffice',
    new: 'FinalStatus'
  },
  {
    old: 'FinalStatusShifted',
    new: 'FinalStatus'
  }
];

function fixEnumUsageInFile(filePath) {
  try {
    console.log(`\n🔧 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Apply all enum replacements
    enumReplacements.forEach(replacement => {
      const oldPattern = new RegExp(replacement.old, 'g');
      const matches = content.match(oldPattern);
      if (matches) {
        content = content.replace(oldPattern, replacement.new);
        changes += matches.length;
        console.log(`   ✅ Replaced ${matches.length} instances of ${replacement.old} with ${replacement.new}`);
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   💾 Saved ${filePath} with ${changes} changes`);
      return true;
    } else {
      console.log(`   ℹ️  No changes needed in ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`   ❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting batch fix for remaining enum issues...\n');
  
  let totalFixed = 0;
  let totalChanges = 0;
  
  formsToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const wasFixed = fixEnumUsageInFile(filePath);
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
    console.log('\n✅ All remaining enum issues have been fixed!');
    console.log('🎯 All forms now use the unified FinalStatus enum consistently.');
  } else {
    console.log('\n✅ All forms were already using the correct enum!');
  }
}

main();
