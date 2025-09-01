import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCaseFormSubmissions } from '@/hooks/useForms';
import { FormSubmissionsList } from '@/components/forms/FormSubmissionsList';
import { FormViewer } from '@/components/forms/FormViewer';
import { FormSubmission } from '@/types/form';
import { 
  FileText, 
  BarChart3, 
  MapPin, 
  Camera, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const FormSubmissionsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { data: formSubmissionsData, isLoading, error } = useCaseFormSubmissions(caseId!);
  const submissions = formSubmissionsData?.data?.submissions || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = submissions.length;
    const byStatus = submissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byValidation = submissions.reduce((acc, sub) => {
      acc[sub.validationStatus] = (acc[sub.validationStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPhotos = submissions.reduce((acc, sub) => acc + (sub.photos?.length || 0), 0);
    
    const recentSubmissions = submissions.filter(sub => {
      const submittedDate = new Date(sub.submittedAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return submittedDate > dayAgo;
    }).length;

    return {
      total,
      byStatus,
      byValidation,
      totalPhotos,
      recentSubmissions,
    };
  }, [submissions]);

  const handleSubmissionSelect = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setSelectedSubmission(null);
    setIsViewerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Form Submissions</h2>
        <p className="text-gray-600">There was an error loading the form submissions for this case.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
          <p className="mt-2 text-gray-600">Case #{caseId}</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {stats.total} Submissions
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (24h)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentSubmissions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Photos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPhotos}</p>
              </div>
              <Camera className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byValidation.VALID || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {status === 'APPROVED' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {status === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                    {status === 'UNDER_REVIEW' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {status === 'SUBMITTED' && <FileText className="h-4 w-4 text-blue-600" />}
                    <span className="font-medium">{status.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byValidation).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {status === 'VALID' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {status === 'INVALID' && <XCircle className="h-4 w-4 text-red-600" />}
                    {status === 'WARNING' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    <span className="font-medium">{status}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Form Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <FormSubmissionsList
            submissions={submissions}
            isLoading={isLoading}
            onSubmissionSelect={handleSubmissionSelect}
            showSearch={true}
            showFilters={true}
            showSorting={true}
          />
        </CardContent>
      </Card>

      {/* Form Viewer Modal */}
      {selectedSubmission && (
        <Dialog open={isViewerOpen} onOpenChange={handleCloseViewer}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Form Submission Details</DialogTitle>
            </DialogHeader>
            <FormViewer
              submission={selectedSubmission}
              readonly={true}
              showAttachments={true}
              showPhotos={true}
              showLocation={true}
              showMetadata={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
