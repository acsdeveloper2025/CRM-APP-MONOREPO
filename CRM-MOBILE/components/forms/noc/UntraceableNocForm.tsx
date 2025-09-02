import React, { useMemo, useState } from 'react';
import {
  Case, UntraceableNocReportData, CallRemarkUntraceable, LocalityTypeResiCumOffice, DominatedArea, FinalStatus, CaseStatus, CapturedImage
} from '../../../types';
import { useCases } from '../../../context/CaseContext';
import { FormField, SelectField, TextAreaField } from '../../FormControls';
import ConfirmationModal from '../../ConfirmationModal';
import ImageCapture from '../../ImageCapture';
import SelfieCapture from '../../SelfieCapture';
import PermissionStatus from '../../PermissionStatus';
import AutoSaveFormWrapper from '../../AutoSaveFormWrapper';
import { FORM_TYPES } from '../../../constants/formTypes';
import VerificationFormService from '../../../services/verificationFormService';
import {
  createImageChangeHandler,
  createSelfieImageChangeHandler,
  createAutoSaveImagesChangeHandler,
  combineImagesForAutoSave,
  createFormDataChangeHandler,
  createDataRestoredHandler
} from '../../../utils/imageAutoSaveHelpers';

interface UntraceableNocFormProps {
  caseData: Case;
}

const getEnumOptions = (enumObject: object) => Object.values(enumObject).map(value => (
  <option key={value} value={value}>{value}</option>
));

const UntraceableNocForm: React.FC<UntraceableNocFormProps> = ({ caseData }) => {
  const { updateUntraceableNocReport, updateCaseStatus, toggleSaveCase } = useCases();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const report = caseData.untraceableNocReport;
  const isReadOnly = caseData.status === CaseStatus.Completed || caseData.isSaved;
  const MIN_IMAGES = 5;

  // Auto-save handlers
  const handleFormDataChange = (formData: any) => {
    if (!isReadOnly) {
      updateUntraceableNocReport(caseData.id, formData);
    }
  };

  const handleAutoSaveImagesChange = (images: CapturedImage[]) => {
    if (!isReadOnly && report) {
      updateUntraceableNocReport(caseData.id, { ...report, images });
    }
  };

  const handleDataRestored = (data: any) => {
    if (!isReadOnly && data.formData) {
      updateUntraceableNocReport(caseData.id, data.formData);
    }
  };

  if (!report) {
    return <p className="text-medium-text">No Untraceable NOC report data available.</p>;
  }

  const isFormValid = useMemo(() => {
    if (!report) return false;

    if (report.images.length < MIN_IMAGES) return false;

    // Require at least one selfie image
    if (!report.selfieImages || report.selfieImages.length === 0) return false;

    const checkFields = (fields: (keyof UntraceableNocReportData)[]) => fields.every(field => {
        const value = report[field];
        return value !== null && value !== undefined && value !== '';
    });

    const baseFields: (keyof UntraceableNocReportData)[] = [
        'contactPerson', 'metPerson', 'callRemark', 'locality', 'landmark1', 'landmark2', 'landmark3', 'landmark4',
        'dominatedArea', 'otherExtraRemark', 'finalStatus'
    ];
    if (!checkFields(baseFields)) return false;

    if (report.finalStatus === FinalStatus.Hold) {
        if (!report.holdReason || report.holdReason.trim() === '') return false;
    }

    return true;
  }, [report]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | null = value;

    if (e.target.tagName === 'SELECT' && value === '') {
      processedValue = null;
    }

    const updates: Partial<UntraceableNocReportData> = { [name]: processedValue };
    updateUntraceableNocReport(caseData.id, updates);
  };

  const handleImagesChange = (images: CapturedImage[]) => {
    updateUntraceableNocReport(caseData.id, { images });
  };

  const handleSelfieImagesChange = (selfieImages: CapturedImage[]) => {
    updateUntraceableNocReport(caseData.id, { selfieImages });
  };
  
  const options = useMemo(() => ({
    callRemark: getEnumOptions(CallRemarkUntraceable),
    localityType: getEnumOptions(LocalityTypeResiCumOffice),
    dominatedArea: getEnumOptions(DominatedArea),
    finalStatus: getEnumOptions(FinalStatus),
  }), []);

  return (
    <AutoSaveFormWrapper
      caseId={caseData.id}
      formType={FORM_TYPES.NOC_UNTRACEABLE}
      formData={report}
      images={combineImagesForAutoSave(report)}
      onFormDataChange={handleFormDataChange}
      onImagesChange={handleAutoSaveImagesChange}
      onDataRestored={handleDataRestored}
      autoSaveOptions={{
        enableAutoSave: !isReadOnly,
        showIndicator: !isReadOnly,
      }}
    >
      <div className="space-y-4 pt-4 border-t border-dark-border">
      <h3 className="text-lg font-semibold text-brand-primary">Untraceable NOC Report</h3>

      {/* Customer Information Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Customer Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-medium-text">Customer Name</span>
            <span className="block text-light-text">{caseData.customer.name}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">Bank Name</span>
            <span className="block text-light-text">{caseData.bankName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">Product</span>
            <span className="block text-light-text">{caseData.product || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">Trigger</span>
            <span className="block text-light-text">{caseData.trigger || 'N/A'}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm text-medium-text">Visit Address</span>
            <span className="block text-light-text">{caseData.visitAddress || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">System Contact Number</span>
            <span className="block text-light-text">{caseData.systemContactNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">Customer Calling Code</span>
            <span className="block text-light-text">{caseData.customerCallingCode || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm text-medium-text">Applicant Status</span>
            <span className="block text-light-text">{caseData.applicantStatus || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Verification Details Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Verification Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Contact Person" id="contactPerson" name="contactPerson" value={report.contactPerson} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Met Person" id="metPerson" name="metPerson" value={report.metPerson} onChange={handleChange} disabled={isReadOnly} />
          <SelectField label="Call Remark" id="callRemark" name="callRemark" value={report.callRemark || ''} onChange={handleChange} disabled={isReadOnly}>
            <option value="">Select...</option>
            {options.callRemark}
          </SelectField>
          <SelectField label="Locality" id="locality" name="locality" value={report.locality || ''} onChange={handleChange} disabled={isReadOnly}>
            <option value="">Select...</option>
            {options.localityType}
          </SelectField>
        </div>
      </div>

      {/* Property Details Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Property Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Landmark 1" id="landmark1" name="landmark1" value={report.landmark1} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 2" id="landmark2" name="landmark2" value={report.landmark2} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 3" id="landmark3" name="landmark3" value={report.landmark3} onChange={handleChange} disabled={isReadOnly} />
          <FormField label="Landmark 4" id="landmark4" name="landmark4" value={report.landmark4} onChange={handleChange} disabled={isReadOnly} />
        </div>
      </div>

      {/* Area Assessment Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Area Assessment</h4>
        <SelectField label="Dominated Area" id="dominatedArea" name="dominatedArea" value={report.dominatedArea || ''} onChange={handleChange} disabled={isReadOnly}>
          <option value="">Select...</option>
          {options.dominatedArea}
        </SelectField>
        <TextAreaField label="Other Extra Remark" id="otherExtraRemark" name="otherExtraRemark" value={report.otherExtraRemark} onChange={handleChange} disabled={isReadOnly} />
      </div>

      {/* Final Status Section */}
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-dark-border">
        <h4 className="font-semibold text-brand-primary">Final Status</h4>
        <SelectField label="Final Status" id="finalStatus" name="finalStatus" value={report.finalStatus || ''} onChange={handleChange} disabled={isReadOnly}>
          <option value="">Select...</option>
          {options.finalStatus}
        </SelectField>
        {report.finalStatus === FinalStatus.Hold && (
          <FormField label="Reason for Hold" id="holdReason" name="holdReason" value={report.holdReason} onChange={handleChange} disabled={isReadOnly} />
        )}
      </div>

      {/* Permission Status Section */}
      <PermissionStatus showOnlyDenied={true} />

      {/* Image Capture Section */}
      <ImageCapture
        images={report.images}
        onImagesChange={handleImagesChange}
        isReadOnly={isReadOnly}
        minImages={MIN_IMAGES}
        compact={true}
      />

      {/* Selfie Capture Section */}
      <SelfieCapture
        images={report.selfieImages || []}
        onImagesChange={handleSelfieImagesChange}
        isReadOnly={isReadOnly}
        required={true}
        title="🤳 Verification Selfie (Required)"
        compact={true}
      />

      {!isReadOnly && caseData.status === CaseStatus.InProgress && (
          <>
            <div className="mt-6">
                <button 
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={!isFormValid || isSubmitting}
                    className="w-full px-6 py-3 text-sm font-semibold rounded-md bg-brand-primary hover:bg-brand-secondary text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >{isSubmitting ? 'Submitting...' : 'Submit'}</button>
                {!isFormValid && <p className="text-xs text-red-400 text-center mt-2">Please fill all required fields and capture at least {MIN_IMAGES} photos to submit.</p>}
                {submissionError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{submissionError}</p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setSubmissionError(null);
                }}
                onSave={() => {
                    toggleSaveCase(caseData.id, true);
                    setIsConfirmModalOpen(false);
                }}
                onConfirm={async () => {
                    setIsSubmitting(true);
                    setSubmissionError(null);
                    
                    try {
                        // Prepare form data for submission
                        const formData = {
                            outcome: report.finalStatus === FinalStatus.Positive ? 'VERIFIED' :
                                    report.finalStatus === FinalStatus.Negative ? 'NOT_VERIFIED' :
                                    report.finalStatus === FinalStatus.Fraud ? 'FRAUD' :
                                    report.finalStatus === FinalStatus.Refer ? 'REFER' :
                                    report.finalStatus === FinalStatus.Hold ? 'HOLD' : 'PARTIAL',
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
                        const result = await VerificationFormService.submitNocVerification(
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
                            console.log('✅ Noc verification submitted successfully');
                        } else {
                            setSubmissionError(result.error || 'Failed to submit verification form');
                        }
                    } catch (error) {
                        console.error('❌ Verification submission error:', error);
                        setSubmissionError(error instanceof Error ? error.message : 'Unknown error occurred');
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                title="Submit or Save Case"
                confirmText={isSubmitting ? "Submitting..." : "Submit Case"}
                saveText="Save for Offline"
            >
                <div className="text-medium-text">
                    <p>You can submit the case to mark it as complete, or save it for offline access if you have a poor internet connection.</p>
                    {submissionError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm font-medium">Submission Error:</p>
                            <p className="text-red-600 text-sm">{submissionError}</p>
                        </div>
                    )}
                </div>
            </ConfirmationModal>
          </>
      )}
      </div>
    </AutoSaveFormWrapper>
  );
};

export default UntraceableNocForm;