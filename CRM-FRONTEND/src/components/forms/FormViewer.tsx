/* eslint-disable id-match */
import { FileText, Clock, User, Eye, Camera, Smartphone, Wifi, WifiOff, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormSubmission } from '@/types/form';
import { FormFieldViewer } from './FormFieldViewer';
import { FormAttachmentsViewer } from './FormAttachmentsViewer';
import { FormLocationViewer } from './FormLocationViewer';
import { FormPhotosGallery } from './FormPhotosGallery';
import VerificationImages from '@/components/VerificationImages';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedFormViewerProps {
  submission: FormSubmission;
  readonly?: boolean;
  showAttachments?: boolean;
  showPhotos?: boolean;
  showLocation?: boolean;
  showMetadata?: boolean;
  onFieldChange?: (fieldId: string, value: unknown) => void;
}

export function FormViewer({
  submission,
  readonly = true,
  showAttachments = true,
  showPhotos = true,
  showLocation = true,
  showMetadata = true,
  onFieldChange,
}: EnhancedFormViewerProps) {


  // Helper functions for styling
  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'nsp':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      SUBMITTED: { variant: 'default' as const, label: 'Submitted' },
      UNDER_REVIEW: { variant: 'outline' as const, label: 'Under Review' },
      APPROVED: { variant: 'default' as const, label: 'Approved' },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFormTypeLabel = (formType: string) => {
    return formType
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getValidationBadge = (status: string) => {
    const statusConfig = {
      VALID: { variant: 'default' as const, label: 'Valid', color: 'text-green-600' },
      INVALID: { variant: 'destructive' as const, label: 'Invalid', color: 'text-red-600' },
      WARNING: { variant: 'outline' as const, label: 'Warning', color: 'text-yellow-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.VALID;
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getDeviceIcon = (platform: string) => {
    switch (platform) {
      case 'IOS':
        return <Smartphone className="h-4 w-4" />;
      case 'ANDROID':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const getNetworkIcon = (type: string) => {
    switch (type) {
      case 'WIFI':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'CELLULAR':
        return <Wifi className="h-4 w-4 text-blue-600" />;
      case 'OFFLINE':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {getFormTypeLabel(submission.formType)} Form
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div>{submission.verificationType} • {submission.outcome}</div>
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-3 w-3" />
                    <span>Submitted by {submission.submittedByName}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
                  </div>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(submission.status)}
              {getValidationBadge(submission.validationStatus)}
              <Badge variant="outline">
                Case #{submission.caseId}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Form Metadata */}
      {showMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Submission Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Device Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  {getDeviceIcon(submission.metadata.deviceInfo.platform)}
                  <span>Device Info</span>
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Platform: {submission.metadata.deviceInfo.platform}</div>
                  <div>Model: {submission.metadata.deviceInfo.model}</div>
                  <div>OS: {submission.metadata.deviceInfo.osVersion}</div>
                  <div>App: v{submission.metadata.deviceInfo.appVersion}</div>
                </div>
              </div>

              {/* Network Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  {getNetworkIcon(submission.metadata.networkInfo.type)}
                  <span>Network Info</span>
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Type: {submission.metadata.networkInfo.type}</div>
                  {submission.metadata.networkInfo.strength && (
                    <div>Strength: {submission.metadata.networkInfo.strength}%</div>
                  )}
                  {submission.metadata.isOfflineSubmission && (
                    <Badge variant="outline" className="text-orange-600">
                      Offline Submission
                    </Badge>
                  )}
                </div>
              </div>

              {/* Submission Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Submission Info</span>
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Form Version: {submission.metadata.formVersion}</div>
                  <div>Attempts: {submission.metadata.submissionAttempts}</div>
                  {submission.metadata.syncedAt && (
                    <div>Synced: {formatDistanceToNow(new Date(submission.metadata.syncedAt), { addSuffix: true })}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {submission.validationErrors && submission.validationErrors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-medium text-red-800 mb-2">Validation Issues</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {submission.validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos Gallery */}
      {showPhotos && submission.photos && submission.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Photos ({submission.photos.length})</span>
            </CardTitle>
            <CardDescription>
              Verification photos with geo-location data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormPhotosGallery photos={submission.photos} />
          </CardContent>
        </Card>
      )}

      {/* Exact Form as Filled by Field Agent */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span>Form as Submitted by Field Agent</span>
          </CardTitle>
          <CardDescription>
            Exact replica of the form filled by {submission.submittedByName} on {new Date(submission.submittedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Form Header */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              {getFormTypeLabel(submission.formType)} Verification Form
            </h2>
            <div className="text-center text-gray-600 space-y-1">
              <p className="font-medium">Case ID: {submission.caseId}</p>
              <p>Verification Type: {submission.verificationType}</p>
              <p>Outcome: <span className={`font-semibold ${getOutcomeColor(submission.outcome)}`}>{submission.outcome}</span></p>
            </div>
          </div>

          {/* Form Sections - Exact Layout */}
          <div className="space-y-6">
            {submission.sections.map((section, sectionIndex) => (
              <div key={section.id} className="border rounded-lg overflow-hidden">
                {/* Section Header */}
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {sectionIndex + 1}
                    </span>
                    <span>{section.title}</span>
                  </h3>

                </div>

                {/* Section Fields */}
                <div className="p-4 space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      {/* Field Label */}
                      <Label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <span>{field.label}</span>
                        {field.isRequired && <span className="text-red-500">*</span>}
                      </Label>

                      {/* Field Value Display */}
                      <div className="min-h-[40px] p-3 bg-white border rounded-md">
                        <FormFieldViewer
                          field={field}
                          readonly={true}
                          onChange={(value) => onFieldChange?.(field.id, value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Form Footer */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Submitted by:</span>
                <p className="text-gray-600">{submission.submittedByName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Submission Date:</span>
                <p className="text-gray-600">{new Date(submission.submittedAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Images - Captured during form submission */}
      {submission.caseId && (
        <VerificationImages
          caseId={submission.caseId}
          submissionId={submission.id}
          title="Captured Verification Images"
          showStats={true}
        />
      )}

      {/* Form Attachments */}
      {showAttachments && submission.attachments.length > 0 && (
        <FormAttachmentsViewer
          attachments={submission.attachments}
          readonly={readonly}
        />
      )}

      {/* Form Location */}
      {showLocation && submission.geoLocation && (
        <FormLocationViewer
          location={submission.geoLocation}
          readonly={readonly}
        />
      )}

      {/* Review Comments */}
      {submission.reviewNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Review Comments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{submission.reviewNotes}</p>
              {submission.reviewedBy && submission.reviewedAt && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Reviewed by {submission.reviewedBy}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(submission.reviewedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      {!readonly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(submission.submittedAt).toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Print Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
