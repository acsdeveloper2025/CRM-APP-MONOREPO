import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseCreationStepper } from '@/components/cases/CaseCreationStepper';

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (caseId: string) => {
    navigate('/cases');
  };

  const handleCancel = () => {
    navigate('/cases');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create New Case</h1>
        <p className="text-muted-foreground">
          Follow the steps below to create a new verification case with duplicate detection.
        </p>
      </div>

      <CaseCreationStepper onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
};
