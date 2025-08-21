import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CaseCreationStepper } from '@/components/cases/CaseCreationStepper';
import { useCase } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { CustomerInfoData } from '@/components/cases/CustomerInfoStep';
import type { FullCaseFormData } from '@/components/cases/FullCaseFormStep';

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCaseId = searchParams.get('edit');
  const isEditMode = !!editCaseId;



  const [initialData, setInitialData] = useState<{
    customerInfo?: CustomerInfoData;
    caseFormData?: FullCaseFormData;
  } | undefined>();

  // Only fetch case data if we're in edit mode
  const shouldFetchCase = isEditMode && editCaseId;
  const { data: caseData, isLoading: loadingCase } = useCase(shouldFetchCase ? editCaseId : '');

  useEffect(() => {
    try {
      if (isEditMode && caseData?.data) {
        const caseItem = caseData.data;

        // Map case data to CustomerInfoData format
        const customerInfo: CustomerInfoData = {
          customerName: String(caseItem.applicantName || ''),
          mobileNumber: String(caseItem.applicantPhone || ''),
          panNumber: String(caseItem.panNumber || ''),
          customerCallingCode: String(caseItem.customerCallingCode || '')
        };

        // Map case data to FullCaseFormData format
        const caseFormData: FullCaseFormData = {
          clientId: String(caseItem.clientId || ''),
          productId: String(caseItem.productId || ''),
          verificationType: String(caseItem.verificationType || ''),
          applicantType: String(caseItem.applicantType || ''),
          createdByBackendUser: String(caseItem.createdByBackendUser || ''),
          backendContactNumber: String(caseItem.backendContactNumber || ''),
          assignedToId: String(caseItem.assignedTo || ''),
          priority: typeof caseItem.priority === 'string' ?
            (caseItem.priority === 'LOW' ? 1 : caseItem.priority === 'MEDIUM' ? 2 : caseItem.priority === 'HIGH' ? 3 : 4) :
            Number(caseItem.priority) || 2,
          notes: String(caseItem.trigger || caseItem.notes || ''),
          address: String(caseItem.address || ''),
          pincodeId: '', // Will be populated by the form
          areaId: '', // Will be populated by the form
        };

        setInitialData({
          customerInfo,
          caseFormData
        });
      }
    } catch (error) {
      console.error('Error in NewCasePage useEffect:', error);
      // Don't redirect on error, just log it
    }
  }, [isEditMode, caseData]);

  const handleSuccess = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleCancel = () => {
    navigate('/cases');
  };



  if (isEditMode && loadingCase) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Edit Case</h1>
          <p className="text-muted-foreground">Loading case data... (ID: {editCaseId})</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Debug: Show if we're in edit mode but have no data
  if (isEditMode && !loadingCase && !caseData?.data) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Edit Mode - No Data</h1>
          <p className="text-muted-foreground">
            Edit Case ID: {editCaseId}<br/>
            Loading: {loadingCase ? 'Yes' : 'No'}<br/>
            Has Case Data: {caseData?.data ? 'Yes' : 'No'}<br/>
            Case Data: {JSON.stringify(caseData, null, 2)}
          </p>
          <Button onClick={() => navigate('/cases')} className="mt-4">
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Case' : 'Create New Case'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? 'Update the case details using the form below.'
            : 'Follow the steps below to create a new verification case with duplicate detection.'
          }
        </p>
      </div>

      <CaseCreationStepper
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        editMode={isEditMode}
        editCaseId={editCaseId || undefined}
        initialData={initialData}
      />
    </div>
  );
};
