import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Eye,
  Expand,
  Smartphone,
  Wifi,
  Calendar
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
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Helper functions
  const getFormTypeLabel = (formType: string) => {
    return formType.replace('_', ' ').toUpperCase();
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
    <>
      {/* Compact Summary Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {getFormTypeLabel(submission.formType)} Verification
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                  <Badge className={getValidationColor(submission.validationStatus)}>
                    {submission.validationStatus}
                  </Badge>
                  <span className={`text-sm font-medium ${getOutcomeColor(verificationOutcome)}`}>
                    {verificationOutcome}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullDetails(true)}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Details</span>
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

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Smartphone className="h-3 w-3" />
                <span>{submission.metadata?.platform || 'Unknown'}</span>
              </div>
              {submission.metadata?.networkType && (
                <div className="flex items-center space-x-1">
                  <Wifi className="h-3 w-3" />
                  <span>{submission.metadata.networkType}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveTab('photos');
                  setShowFullDetails(true);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Camera className="h-4 w-4 mr-1" />
                View Photos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={showFullDetails} onOpenChange={setShowFullDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{getFormTypeLabel(submission.formType)} Verification Details</span>
              <Badge className={getStatusColor(submission.status)}>
                {submission.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="form-data">Form Data</TabsTrigger>
              <TabsTrigger value="photos">Photos ({submission.attachments?.length || 0})</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <div className="mt-4 overflow-auto max-h-[calc(90vh-200px)]">
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Submission Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Submission Overview</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Validation:</span>
                        <Badge className={getValidationColor(submission.validationStatus)}>
                          {submission.validationStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Outcome:</span>
                        <span className={`font-medium ${getOutcomeColor(verificationOutcome)}`}>
                          {verificationOutcome}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted by:</span>
                        <span className="font-medium">{agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date & Time:</span>
                        <span className="font-medium">
                          {submissionDate ? format(submissionDate, 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span>Form Statistics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Form Type:</span>
                        <span className="font-medium">{getFormTypeLabel(submission.formType)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sections:</span>
                        <span className="font-medium">{formSections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Fields:</span>
                        <span className="font-medium">{totalFields}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Photos Captured:</span>
                        <span className="font-medium">{submission.attachments?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform:</span>
                        <span className="font-medium">{submission.metadata?.platform || 'Unknown'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Form Fields */}
                {formSections.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formSections.slice(0, 2).map((section, sectionIndex) => (
                          <div key={sectionIndex} className="space-y-2">
                            <h4 className="font-medium text-gray-900">{section.title}</h4>
                            <div className="space-y-1">
                              {section.fields?.slice(0, 3).map((field, fieldIndex) => (
                                <div key={fieldIndex} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{field.label}:</span>
                                  <span className="font-medium text-right max-w-[200px] truncate">
                                    {field.value || 'Not provided'}
                                  </span>
                                </div>
                              ))}
                              {(section.fields?.length || 0) > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{(section.fields?.length || 0) - 3} more fields
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="form-data" className="space-y-4">
                {formSections.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {sectionIndex + 1}
                        </div>
                        <span>{section.title}</span>
                        <Badge variant="outline">{section.fields?.length || 0} fields</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields?.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-900 bg-gray-50 rounded p-2 min-h-[2rem] flex items-center">
                              {field.value || <span className="text-gray-500 italic">Not provided</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="photos">
                <VerificationImages
                  caseId={caseId}
                  submissionId={submission.id}
                  title="Verification Photos"
                  showStats={false}
                />
              </TabsContent>

              <TabsContent value="location">
                {submission.location ? (
                  <FormLocationViewer
                    location={submission.location}
                    readonly={true}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Data</h3>
                      <p className="text-gray-600">
                        No GPS location information was captured for this form submission.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
