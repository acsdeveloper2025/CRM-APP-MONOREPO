import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormSubmission } from '@/types/form';
import VerificationImages from '@/components/VerificationImages';
import { FormLocationViewer } from '@/components/forms/FormLocationViewer';
import {
  FileText,
  User,
  Clock,
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Wifi,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface OptimizedFormSubmissionViewerProps {
  submission: FormSubmission;
  caseId: string;
}

export const OptimizedFormSubmissionViewer: React.FC<OptimizedFormSubmissionViewerProps> = ({
  submission,
  caseId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper functions
  const getFormTypeLabel = (formType: string) => {
    return formType.replace('_', ' ').toUpperCase();
  };

  const formatMetadataValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || 'Unknown');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidationColor = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'bg-green-100 text-green-800';
      case 'INVALID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome?.toLowerCase()) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'untraceable':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Extract key information
  const submissionDate = submission.submittedAt ? (() => {
    const date = new Date(submission.submittedAt);
    return isNaN(date.getTime()) ? null : date;
  })() : null;
  const agentName = submission.submittedBy || 'Unknown Agent';
  const formSections = submission.formData?.sections || [];
  const totalFields = formSections.reduce((total, section) => total + (section.fields?.length || 0), 0);
  const verificationOutcome = submission.formData?.sections?.[0]?.fields?.find(
    field => field.id === 'verification_outcome' || field.label?.toLowerCase().includes('outcome')
  )?.value || 'Not specified';

  return (
    <div className="space-y-6">
      {/* Header Card with Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {getFormTypeLabel(submission.formType)} Verification
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                  <Badge className={getValidationColor(submission.validationStatus)}>
                    {submission.validationStatus}
                  </Badge>
                  <span className={`text-sm font-medium ${getOutcomeColor(verificationOutcome)}`}>
                    Outcome: {verificationOutcome}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{isExpanded ? 'Collapse' : 'Expand'} Details</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Agent</p>
                <p className="text-sm font-medium">{agentName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-sm font-medium">
                  {submissionDate ? formatDistanceToNow(submissionDate, { addSuffix: true }) : 'Unknown time'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Photos</p>
                <p className="text-sm font-medium">{submission.attachments?.length || 0} captured</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Form Data</p>
                <p className="text-sm font-medium">{formSections.length} sections, {totalFields} fields</p>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Full Date & Time</p>
                <p className="text-sm font-medium">
                  {submissionDate ? format(submissionDate, 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Platform</p>
                <p className="text-sm font-medium">{submission.metadata?.platform || 'Unknown'}</p>
              </div>
            </div>

            {submission.metadata?.networkType && (
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Network</p>
                  <p className="text-sm font-medium">{submission.metadata.networkType}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expanded Content - All Data in Single Page */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Form Data Sections */}
          {formSections.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Form Data</h3>
                <Badge variant="outline">{formSections.length} sections, {totalFields} fields</Badge>
              </div>

              {formSections.map((section, sectionIndex) => (
                <Card key={sectionIndex} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                        {sectionIndex + 1}
                      </div>
                      <span>{section.title}</span>
                      <Badge variant="outline">{section.fields?.length || 0} fields</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.fields?.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-900 bg-white rounded p-2 min-h-[2.5rem] flex items-center border">
                            {field.value || <span className="text-gray-500 italic">Not provided</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Data</h3>
                <p className="text-gray-600">No form fields were captured in this submission.</p>
              </CardContent>
            </Card>
          )}

          {/* Verification Images */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Verification Photos</h3>
              <Badge variant="outline">{submission.attachments?.length || 0} photos</Badge>
            </div>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <VerificationImages
                  caseId={caseId}
                  submissionId={submission.id}
                  title=""
                  showStats={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-semibold">Location Information</h3>
            </div>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                {submission.location ? (
                  <FormLocationViewer
                    location={submission.location}
                    readonly={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Location Data</h4>
                    <p className="text-gray-600">
                      No GPS location information was captured for this form submission.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submission Metadata */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Submission Details</h3>
            </div>

            <Card className="border-l-4 border-l-gray-500">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Submission ID</p>
                    <p className="text-sm font-medium">{submission.id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Form Type</p>
                    <p className="text-sm font-medium">{getFormTypeLabel(submission.formType)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Platform</p>
                    <p className="text-sm font-medium">{formatMetadataValue(submission.metadata?.platform)}</p>
                  </div>
                  {submission.metadata?.appVersion && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">App Version</p>
                      <p className="text-sm font-medium">{formatMetadataValue(submission.metadata.appVersion)}</p>
                    </div>
                  )}
                  {submission.metadata?.networkType && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Network Type</p>
                      <p className="text-sm font-medium">{formatMetadataValue(submission.metadata.networkType)}</p>
                    </div>
                  )}
                  {submission.metadata?.deviceInfo && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Device Info</p>
                      <p className="text-sm font-medium">{formatMetadataValue(submission.metadata.deviceInfo)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
