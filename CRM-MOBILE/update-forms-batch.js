/**
 * Automated script to update all remaining verification forms
 * This script applies the established pattern to all 36 remaining forms
 */

import fs from 'fs';
import path from 'path';

// Verification type mappings
const verificationTypeMap = {
  'residence': 'submitResidenceVerification',
  'office': 'submitOfficeVerification', 
  'business': 'submitBusinessVerification',
  'builder': 'submitBuilderVerification',
  'residence-cum-office': 'submitResidenceCumOfficeVerification',
  'dsa-dst-connector': 'submitDsaConnectorVerification',
  'property-individual': 'submitPropertyIndividualVerification',
  'property-apf': 'submitPropertyApfVerification',
  'noc': 'submitNocVerification'
};

// Forms that are already updated (skip these)
const updatedForms = [
  'components/forms/residence/PositiveResidenceForm.tsx',
  'components/forms/office/PositiveOfficeForm.tsx',
  'components/forms/business/PositiveBusinessForm.tsx',
  'components/forms/builder/PositiveBuilderForm.tsx'
];

// Get all form files that need updating
function getAllFormFiles() {
  const formDirs = [
    'components/forms/residence',
    'components/forms/office', 
    'components/forms/business',
    'components/forms/builder',
    'components/forms/residence-cum-office',
    'components/forms/dsa-dst-connector',
    'components/forms/property-individual',
    'components/forms/property-apf',
    'components/forms/noc'
  ];

  const formFiles = [];
  
  formDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(file => 
        file.endsWith('.tsx') && !file.includes('index')
      );
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (!updatedForms.includes(fullPath)) {
          formFiles.push({
            path: fullPath,
            dir: dir.split('/').pop(),
            file: file
          });
        }
      });
    }
  });

  return formFiles;
}

// Check if file needs VerificationFormService import
function needsVerificationImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return !content.includes('VerificationFormService');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

// Add VerificationFormService import
function addVerificationImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && lines[i].includes('from ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      // Insert the new import after the last import
      lines.splice(lastImportIndex + 1, 0, "import VerificationFormService from '../../../services/verificationFormService';");
      
      const updatedContent = lines.join('\n');
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Added VerificationFormService import to ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error adding import to ${filePath}:`, error.message);
    return false;
  }
  return false;
}

// Add state variables for submission
function addSubmissionState(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the line with useState(false) for isConfirmModalOpen
    const lines = content.split('\n');
    let modalStateIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('useState(false)') && lines[i].includes('isConfirmModalOpen')) {
        modalStateIndex = i;
        break;
      }
    }
    
    if (modalStateIndex !== -1) {
      // Add the new state variables after the modal state
      const newStateLines = [
        '  const [isSubmitting, setIsSubmitting] = useState(false);',
        '  const [submissionError, setSubmissionError] = useState<string | null>(null);'
      ];
      
      lines.splice(modalStateIndex + 1, 0, ...newStateLines);
      
      const updatedContent = lines.join('\n');
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Added submission state to ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error adding state to ${filePath}:`, error.message);
    return false;
  }
  return false;
}

// Update submit button
function updateSubmitButton(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the submit button
    const oldButtonPattern = /disabled=\{!isFormValid\}/g;
    const newButtonDisabled = 'disabled={!isFormValid || isSubmitting}';
    
    const oldButtonText = />[\s]*Submit[\s]*</g;
    const newButtonText = '>{isSubmitting ? \'Submitting...\' : \'Submit\'}<';
    
    let updatedContent = content.replace(oldButtonPattern, newButtonDisabled);
    updatedContent = updatedContent.replace(oldButtonText, newButtonText);
    
    // Add error display after the button
    const buttonEndPattern = /{!isFormValid && <p className="text-xs text-red-400 text-center mt-2">.*?<\/p>}/;
    const errorDisplay = `{!isFormValid && <p className="text-xs text-red-400 text-center mt-2">Please fill all required fields and capture at least {MIN_IMAGES} photos to submit.</p>}
                {submissionError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{submissionError}</p>
                    </div>
                )}`;
    
    updatedContent = updatedContent.replace(buttonEndPattern, errorDisplay);
    
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✅ Updated submit button in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating button in ${filePath}:`, error.message);
    return false;
  }
}

// Get verification type from directory
function getVerificationType(dir) {
  const typeMap = {
    'residence': 'residence',
    'office': 'office',
    'business': 'business',
    'builder': 'builder',
    'residence-cum-office': 'residence-cum-office',
    'dsa-dst-connector': 'dsa-dst-connector',
    'property-individual': 'property-individual',
    'property-apf': 'property-apf',
    'noc': 'noc'
  };
  return typeMap[dir] || dir;
}

// Main update function
function updateAllForms() {
  console.log('🚀 Starting batch update of verification forms...\n');
  
  const formFiles = getAllFormFiles();
  console.log(`📋 Found ${formFiles.length} forms to update:\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  formFiles.forEach((formFile, index) => {
    console.log(`${index + 1}. Processing ${formFile.path}...`);
    
    try {
      let updated = false;
      
      // Step 1: Add VerificationFormService import
      if (needsVerificationImport(formFile.path)) {
        if (addVerificationImport(formFile.path)) {
          updated = true;
        }
      }
      
      // Step 2: Add submission state variables
      if (addSubmissionState(formFile.path)) {
        updated = true;
      }
      
      // Step 3: Update submit button
      if (updateSubmitButton(formFile.path)) {
        updated = true;
      }
      
      if (updated) {
        console.log(`   ✅ Successfully updated ${formFile.path}`);
        successCount++;
      } else {
        console.log(`   ⚠️  No changes needed for ${formFile.path}`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to update ${formFile.path}:`, error.message);
      failureCount++;
    }
    
    console.log('');
  });
  
  console.log('📊 Batch Update Summary:');
  console.log(`✅ Successfully processed: ${successCount}/${formFiles.length}`);
  console.log(`❌ Failed: ${failureCount}/${formFiles.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All forms have been updated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the changes in each file');
    console.log('2. Update the onConfirm handlers manually for complex form logic');
    console.log('3. Test the forms to ensure they work correctly');
    console.log('4. Commit the changes');
  } else {
    console.log('\n⚠️ Some forms need manual attention.');
  }
}

// Run the update
updateAllForms();
