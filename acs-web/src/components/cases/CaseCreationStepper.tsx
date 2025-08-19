import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, User, FileText } from 'lucide-react';
import { CustomerInfoStep, type CustomerInfoData } from './CustomerInfoStep';
import { FullCaseFormStep, type FullCaseFormData } from './FullCaseFormStep';
import { DeduplicationDialog } from './DeduplicationDialog';
import { deduplicationService, type DeduplicationResult } from '@/services/deduplication';
import { casesService, type CreateCaseData } from '@/services/cases';
import toast from 'react-hot-toast';

interface CaseCreationStepperProps {
  onSuccess?: (caseId: string) => void;
  onCancel?: () => void;
}

type Step = 'customer-info' | 'case-details';

export const CaseCreationStepper: React.FC<CaseCreationStepperProps> = ({
  onSuccess,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('customer-info');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoData | null>(null);
  const [caseFormData, setCaseFormData] = useState<FullCaseFormData | null>(null);
  
  // Deduplication state
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [showDeduplicationDialog, setShowDeduplicationDialog] = useState(false);

  const steps = [
    {
      id: 'customer-info' as const,
      title: 'Customer Information',
      description: 'Enter customer details',
      icon: User,
      completed: currentStep === 'case-details' || (currentStep === 'customer-info' && customerInfo !== null),
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
        applicantName: data.customerName,
        panNumber: data.panNumber,
        applicantPhone: data.mobileNumber,
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

  const handleCaseFormSubmit = async (data: FullCaseFormData) => {
    if (!customerInfo) {
      toast.error('Customer information is missing');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const caseData: CreateCaseData = {
        title: `Case for ${customerInfo.customerName}`,
        description: `Verification case for ${customerInfo.customerName}`,
        customerName: customerInfo.customerName,
        customerCallingCode: customerInfo.customerCallingCode,
        customerPhone: customerInfo.mobileNumber,
        customerEmail: '',
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressPincode: data.addressPincode,
        assignedToId: data.assignedToId,
        clientId: data.clientId,
        productId: data.productId,
        verificationType: data.verificationType,
        verificationTypeId: data.verificationTypeId,
        priority: data.priority,
        notes: data.notes,
        // Deduplication fields
        applicantName: customerInfo.customerName,
        applicantPhone: customerInfo.mobileNumber,
        applicantEmail: '',
        panNumber: customerInfo.panNumber,
        deduplicationDecision: 'CREATE_NEW',
        deduplicationRationale: 'Case created through two-step workflow',
      };

      const result = await casesService.createCase(caseData);
      
      if (result.success) {
        toast.success('Case created successfully!');
        onSuccess?.(result.data.id);
      } else {
        toast.error('Failed to create case');
      }
    } catch (error) {
      console.error('Case creation failed:', error);
      toast.error('Failed to create case');
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

        {currentStep === 'case-details' && customerInfo && (
          <FullCaseFormStep
            customerInfo={customerInfo}
            onSubmit={handleCaseFormSubmit}
            onBack={handleBackToCustomerInfo}
            isSubmitting={isSubmitting}
            initialData={caseFormData || {}}
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
