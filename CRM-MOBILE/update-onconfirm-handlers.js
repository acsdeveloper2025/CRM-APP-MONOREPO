/**
 * Script to update onConfirm handlers in all verification forms
 * This replaces the simple updateCaseStatus calls with proper VerificationFormService calls
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

// Forms that are already fully updated (skip these)
const fullyUpdatedForms = [
  'components/forms/residence/PositiveResidenceForm.tsx',
  'components/forms/office/PositiveOfficeForm.tsx',
  'components/forms/business/PositiveBusinessForm.tsx'
];

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

// Generate the new onConfirm handler
function generateOnConfirmHandler(verificationType) {
  const methodName = verificationTypeMap[verificationType];
  const displayName = verificationType.charAt(0).toUpperCase() + verificationType.slice(1).replace('-', ' ');
  
  return `onConfirm={async () => {
                    setIsSubmitting(true);
                    setSubmissionError(null);
                    
                    try {
                        // Prepare form data for submission
                        const formData = {
                            outcome: report.finalStatus === FinalStatus.Positive ? 'VERIFIED' : 
                                    report.finalStatus === FinalStatus.Negative ? 'NOT_VERIFIED' : 'PARTIAL',
                            remarks: report.otherObservation || '',
                            ...report // Include all report data
                        };

                        // Combine all images (regular + selfie)
                        const allImages = [
                            ...(report.images || []),
                            ...(report.selfieImages || [])
                        ];

                        // Get current location if available
                        const geoLocation = report.images?.[0]?.geoLocation ? {
                            latitude: report.images[0].geoLocation.latitude,
                            longitude: report.images[0].geoLocation.longitude,
                            accuracy: report.images[0].geoLocation.accuracy
                        } : undefined;

                        // Submit verification form to backend
                        const result = await VerificationFormService.${methodName}(
                            caseData.id,
                            formData,
                            allImages,
                            geoLocation
                        );

                        if (result.success) {
                            // Update local case status
                            updateCaseStatus(caseData.id, CaseStatus.Completed);
                            
                            // Mark auto-save as completed
                            if ((window as any).markAutoSaveFormCompleted) {
                                (window as any).markAutoSaveFormCompleted();
                            }
                            
                            setIsConfirmModalOpen(false);
                            console.log('✅ ${displayName} verification submitted successfully');
                        } else {
                            setSubmissionError(result.error || 'Failed to submit verification form');
                        }
                    } catch (error) {
                        console.error('❌ Verification submission error:', error);
                        setSubmissionError(error instanceof Error ? error.message : 'Unknown error occurred');
                    } finally {
                        setIsSubmitting(false);
                    }
                }}`;
}

// Update onConfirm handler in a file
function updateOnConfirmHandler(filePath, verificationType) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the old onConfirm pattern
    const oldOnConfirmPattern = /onConfirm=\{\(\) => \{[\s\S]*?updateCaseStatus\(caseData\.id, CaseStatus\.Completed\);[\s\S]*?\}\}/;
    
    if (oldOnConfirmPattern.test(content)) {
      const newOnConfirmHandler = generateOnConfirmHandler(verificationType);
      const updatedContent = content.replace(oldOnConfirmPattern, newOnConfirmHandler);
      
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated onConfirm handler in ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  No matching onConfirm pattern found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating onConfirm in ${filePath}:`, error.message);
    return false;
  }
}

// Update modal close handler
function updateModalCloseHandler(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace the onClose handler
    const oldClosePattern = /onClose=\{\(\) => setIsConfirmModalOpen\(false\)\}/;
    const newCloseHandler = `onClose={() => {
                    setIsConfirmModalOpen(false);
                    setSubmissionError(null);
                }}`;
    
    if (oldClosePattern.test(content)) {
      const updatedContent = content.replace(oldClosePattern, newCloseHandler);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated modal close handler in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating modal close in ${filePath}:`, error.message);
    return false;
  }
}

// Update confirmText to show loading state
function updateConfirmText(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace confirmText
    const oldConfirmTextPattern = /confirmText="Submit Case"/;
    const newConfirmText = `confirmText={isSubmitting ? "Submitting..." : "Submit Case"}`;
    
    if (oldConfirmTextPattern.test(content)) {
      const updatedContent = content.replace(oldConfirmTextPattern, newConfirmText);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated confirmText in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating confirmText in ${filePath}:`, error.message);
    return false;
  }
}

// Update modal content to show errors
function updateModalContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the modal content and replace it
    const oldContentPattern = /<p className="text-medium-text">\s*You can submit the case[\s\S]*?<\/p>/;
    const newContent = `<div className="text-medium-text">
                    <p>You can submit the case to mark it as complete, or save it for offline access if you have a poor internet connection.</p>
                    {submissionError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm font-medium">Submission Error:</p>
                            <p className="text-red-600 text-sm">{submissionError}</p>
                        </div>
                    )}
                </div>`;
    
    if (oldContentPattern.test(content)) {
      const updatedContent = content.replace(oldContentPattern, newContent);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated modal content in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating modal content in ${filePath}:`, error.message);
    return false;
  }
}

// Get all form files that need onConfirm updates
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
        if (!fullyUpdatedForms.includes(fullPath)) {
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

// Main update function
function updateAllOnConfirmHandlers() {
  console.log('🚀 Starting onConfirm handler updates...\n');
  
  const formFiles = getAllFormFiles();
  console.log(`📋 Found ${formFiles.length} forms to update:\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  formFiles.forEach((formFile, index) => {
    console.log(`${index + 1}. Processing ${formFile.path}...`);
    
    try {
      const verificationType = getVerificationType(formFile.dir);
      let updated = false;
      
      // Update onConfirm handler
      if (updateOnConfirmHandler(formFile.path, verificationType)) {
        updated = true;
      }
      
      // Update modal close handler
      if (updateModalCloseHandler(formFile.path)) {
        updated = true;
      }
      
      // Update confirmText
      if (updateConfirmText(formFile.path)) {
        updated = true;
      }
      
      // Update modal content
      if (updateModalContent(formFile.path)) {
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
  
  console.log('📊 OnConfirm Update Summary:');
  console.log(`✅ Successfully processed: ${successCount}/${formFiles.length}`);
  console.log(`❌ Failed: ${failureCount}/${formFiles.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All onConfirm handlers have been updated successfully!');
  } else {
    console.log('\n⚠️ Some forms need manual attention.');
  }
}

// Run the update
updateAllOnConfirmHandlers();
