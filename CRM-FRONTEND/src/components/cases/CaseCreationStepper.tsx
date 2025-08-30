import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, User, FileText } from 'lucide-react';
import { CustomerInfoStep, type CustomerInfoData } from './CustomerInfoStep';
import { FullCaseFormStep, type FullCaseFormData } from './FullCaseFormStep';
import { DeduplicationDialog } from './DeduplicationDialog';
import { deduplicationService, type DeduplicationResult } from '@/services/deduplication';
import { casesService, type CreateCaseData } from '@/services/cases';
import { usePincodes } from '@/hooks/useLocations';
import { useVerificationTypes } from '@/hooks/useClients';
import toast from 'react-hot-toast';

interface CaseCreationStepperProps {
  onSuccess?: (caseId: string) => void;
  onCancel?: () => void;
  editMode?: boolean;
  editCaseId?: string;
  initialData?: {
    customerInfo?: CustomerInfoData;
    caseFormData?: FullCaseFormData;
  };
}

type Step = 'customer-info' | 'case-details';

// Helper function to map verification type names to backend expected values
const mapVerificationType = (verificationType: string): string => {
  const typeMap: Record<string, string> = {
    'Residence Verification': 'RESIDENCE',
    'Office Verification': 'OFFICE',
    'Business Verification': 'BUSINESS',
    'Other Verification': 'OTHER',
    'RESIDENCE': 'RESIDENCE',
    'OFFICE': 'OFFICE',
    'BUSINESS': 'BUSINESS',
    'OTHER': 'OTHER'
  };
  return typeMap[verificationType] || 'OTHER';
};

export const CaseCreationStepper: React.FC<CaseCreationStepperProps> = ({
  onSuccess,
  onCancel,
  editMode = false,
  editCaseId,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(
    editMode ? 'case-details' : 'customer-info'
  );
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoData | null>(
    initialData?.customerInfo || null
  );
  const [caseFormData, setCaseFormData] = useState<FullCaseFormData | null>(
    initialData?.caseFormData || null
  );

  // Deduplication state
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [showDeduplicationDialog, setShowDeduplicationDialog] = useState(false);

  // Fetch pincodes for code lookup
  const { data: pincodesResponse } = usePincodes();
  const pincodes = pincodesResponse?.data || [];

  // Fetch verification types for ID lookup
  const { data: verificationTypesResponse } = useVerificationTypes();
  const verificationTypes = verificationTypesResponse?.data || [];

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (editMode && initialData) {
      if (initialData.customerInfo) {
        setCustomerInfo(initialData.customerInfo);
      }
      if (initialData.caseFormData) {
        setCaseFormData(initialData.caseFormData);
      }
    }
  }, [editMode, initialData]);

  const steps = [
    {
      id: 'customer-info' as const,
      title: 'Customer Information',
      description: 'Enter customer details',
      icon: User,
      completed: editMode || currentStep === 'case-details' || (currentStep === 'customer-info' && customerInfo !== null),
    },
    {
      id: 'case-details' as const,
      title: 'Case Details',
      description: 'Complete case information',
      icon: FileText,
      completed: false,
    },
  ];

  const performDeduplicationSearch = async (data: CustomerInfoData) => {
    setIsSearching(true);
    
    try {
      const criteria = deduplicationService.cleanCriteria({
        customerName: data.customerName,
        panNumber: data.panNumber,
        customerPhone: data.mobileNumber,
      });

      const validation = deduplicationService.validateCriteria(criteria);
      if (!validation.isValid) {
        toast.error(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      const result = await deduplicationService.searchDuplicates(criteria);
      
      if (result.success && result.data.duplicatesFound.length > 0) {
        setDeduplicationResult(result.data);
        setShowDeduplicationDialog(true);
      } else {
        toast.success('No duplicate cases found. Proceeding to case creation.');
        proceedToCaseDetails(data);
      }
    } catch (error) {
      console.error('Deduplication search failed:', error);
      toast.error('Deduplication search failed. Proceeding to case creation.');
      proceedToCaseDetails(data);
    } finally {
      setIsSearching(false);
    }
  };

  const proceedToCaseDetails = (data: CustomerInfoData) => {
    setCustomerInfo(data);
    setCurrentStep('case-details');
  };

  const handleSearchExisting = (data: CustomerInfoData) => {
    performDeduplicationSearch(data);
  };

  const handleCreateNew = (data: CustomerInfoData) => {
    proceedToCaseDetails(data);
  };

  const handleBackToCustomerInfo = () => {
    setCurrentStep('customer-info');
    setCaseFormData(null);
  };

  const handleCaseFormSubmit = async (data: FullCaseFormData, attachments: any[] = []) => {
    if (!customerInfo) {
      toast.error('Customer information is missing');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get pincode code from pincode ID for backend compatibility
      const selectedPincode = pincodes.find(p => p.id.toString() === data.pincodeId);
      const pincodeCode = selectedPincode?.code || data.pincodeId;

      // Get verification type ID from verification type name
      const selectedVerificationType = verificationTypes.find(vt => vt.name === data.verificationType);
      const verificationTypeId = selectedVerificationType?.id?.toString() || '';

      const caseData: CreateCaseData = {
        // Core case fields
        customerName: customerInfo.customerName,
        customerCallingCode: customerInfo.customerCallingCode,
        customerPhone: customerInfo.mobileNumber,
        createdByBackendUser: data.createdByBackendUser,
        verificationType: mapVerificationType(data.verificationType),
        address: data.address,
        pincode: pincodeCode, // Use actual pincode code, not ID
        assignedToId: data.assignedToId,
        clientId: data.clientId,
        productId: data.productId,
        verificationTypeId: verificationTypeId,
        applicantType: data.applicantType,
        backendContactNumber: data.backendContactNumber,
        priority: data.priority,
        notes: data.notes,

        // Deduplication fields
        panNumber: customerInfo.panNumber,
        deduplicationDecision: 'CREATE_NEW',
        deduplicationRationale: 'Case created through two-step workflow',
      };

      let result;
      if (editMode && editCaseId) {
        result = await casesService.updateCaseDetails(editCaseId, caseData);

        // Handle attachments separately for edit mode (if needed)
        if (attachments.length > 0) {
          try {
            const formData = new FormData();
            attachments.forEach(attachment => {
              formData.append('files', attachment.file);
            });
            formData.append('caseId', String(editCaseId));
            formData.append('category', 'DOCUMENT');

            const uploadResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attachments/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: formData,
            });

            if (uploadResponse.ok) {
              toast.success(`${attachments.length} file(s) uploaded successfully`);
            } else {
              toast.error('Case updated but some attachments failed to upload');
            }
          } catch (uploadError) {
            console.error('Attachment upload failed:', uploadError);
            toast.error('Case updated but attachments failed to upload');
          }
        }
      } else {
        // Create new case with attachments in single request
        if (attachments.length > 0) {
          const attachmentFiles = attachments.map(att => att.file);
          result = await casesService.createCaseWithAttachments(caseData, attachmentFiles);

          if (result.success) {
            toast.success(`Case created successfully with ${result.data.attachmentCount || attachments.length} attachment(s)`);
          }
        } else {
          // No attachments, use regular create endpoint
          result = await casesService.createCase(caseData);
        }
      }

      if (result.success) {
        const caseId = result.data.caseId || result.data.id;

        const action = editMode ? 'updated' : 'created';
        toast.success(`Case ${action} successfully! Case ID: ${caseId}`);
        onSuccess?.(String(caseId));
      } else {
        const action = editMode ? 'update' : 'create';
        toast.error(`Failed to ${action} case`);
      }
    } catch (error: any) {
      console.error('Case creation failed:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create case';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewFromDialog = (rationale: string) => {
    if (customerInfo) {
      proceedToCaseDetails(customerInfo);
      setShowDeduplicationDialog(false);
      setDeduplicationResult(null);
    }
  };

  const handleUseExistingFromDialog = (caseId: string, rationale: string) => {
    toast.success(`Redirecting to existing case: ${caseId}`);
    setShowDeduplicationDialog(false);
    setDeduplicationResult(null);
    onCancel?.();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Stepper */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                        ${isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-xs text-gray-400">{step.description}</span>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {currentStep === 'customer-info' && (
          <CustomerInfoStep
            onSearchExisting={handleSearchExisting}
            onCreateNew={handleCreateNew}
            isSearching={isSearching}
            initialData={customerInfo || {}}
          />
        )}

        {currentStep === 'case-details' && (editMode || customerInfo) && (
          <FullCaseFormStep
            customerInfo={customerInfo || initialData?.customerInfo || {}}
            onSubmit={handleCaseFormSubmit}
            onBack={editMode ? undefined : handleBackToCustomerInfo}
            isSubmitting={isSubmitting}
            initialData={caseFormData || {}}
            editMode={editMode}
          />
        )}
      </div>

      {/* Deduplication Dialog */}
      <DeduplicationDialog
        isOpen={showDeduplicationDialog}
        onClose={() => {
          setShowDeduplicationDialog(false);
          setDeduplicationResult(null);
        }}
        deduplicationResult={deduplicationResult}
        onCreateNew={handleCreateNewFromDialog}
        onUseExisting={handleUseExistingFromDialog}
        isProcessing={isSubmitting}
      />
    </div>
  );
};
