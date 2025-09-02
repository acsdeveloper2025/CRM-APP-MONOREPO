import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, MapPin, Clock, User, Eye, Download, Camera, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormSubmission, FormSection, FormField } from '@/types/form';
import { FormFieldViewer } from './FormFieldViewer';
import { FormAttachmentsViewer } from './FormAttachmentsViewer';
import { FormLocationViewer } from './FormLocationViewer';
import { FormMetadataViewer } from './FormMetadataViewer';
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
  onFieldChange?: (fieldId: string, value: any) => void;
  onSectionToggle?: (sectionId: string, expanded: boolean) => void;
}

export function FormViewer({
  submission,
  readonly = true,
  showAttachments = true,
  showPhotos = true,
  showLocation = true,
  showMetadata = true,
  onFieldChange,
  onSectionToggle,
}: EnhancedFormViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(submission.sections.filter(s => s.defaultExpanded !== false).map(s => s.id))
  );

  const handleSectionToggle = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
    onSectionToggle?.(sectionId, newExpanded.has(sectionId));
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

      {/* Form Sections */}
      <div className="space-y-4">
        {submission.sections.map((section) => (
          <Card key={section.id}>
            <Collapsible
              open={expandedSections.has(section.id)}
              onOpenChange={() => handleSectionToggle(section.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {section.description && (
                        <CardDescription>{section.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {section.fields.length} fields
                      </Badge>
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.fields.map((field) => (
                      <FormFieldViewer
                        key={field.id}
                        field={field}
                        readonly={readonly}
                        onChange={(value) => onFieldChange?.(field.id, value)}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

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
      {showLocation && submission.location && (
        <FormLocationViewer
          location={submission.location}
          readonly={readonly}
        />
      )}

      {/* Review Comments */}
      {submission.reviewComments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Review Comments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{submission.reviewComments}</p>
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
