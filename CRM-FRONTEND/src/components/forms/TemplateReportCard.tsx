import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TemplateReport {
  id: string;
  content: string;
  metadata: {
    verificationType: string;
    outcome: string;
    generatedAt: string;
    templateUsed: string;
  };
  createdAt: string;
}

interface TemplateReportCardProps {
  caseId: string;
  submissionId: string;
  verificationType: string;
  outcome: string;
}

export const TemplateReportCard: React.FC<TemplateReportCardProps> = ({
  caseId,
  submissionId,
  verificationType,
  outcome
}) => {
  const [report, setReport] = useState<TemplateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Load existing report on component mount
  useEffect(() => {
    loadExistingReport();
  }, [caseId, submissionId]);

  const loadExistingReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://192.168.1.36:3000/api/template-reports/cases/${caseId}/submissions/${submissionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setReport(data.report);
        }
      } else if (response.status !== 404) {
        // 404 is expected if no report exists yet
        throw new Error('Failed to load existing report');
      }
      // 404 is expected when no report exists yet - don't treat as error
    } catch (err) {
      // Only log and show error if it's not a 404 (report not found)
      if (err instanceof Error && !err.message.includes('404')) {
        console.error('Error loading existing report:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://192.168.1.36:3000/api/template-reports/cases/${caseId}/submissions/${submissionId}/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate template report');
      }

      const data = await response.json();
      if (data.success) {
        setReport({
          id: data.reportId,
          content: data.report,
          metadata: data.metadata,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating template report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const content = `VERIFICATION REPORT
Generated: ${new Date(report.createdAt).toLocaleString()}
Verification Type: ${report.metadata.verificationType}
Outcome: ${report.metadata.outcome}
Template Used: ${report.metadata.templateUsed}

${report.content}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-report-case-${caseId}-${submissionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600 dark:text-slate-300">Loading template report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Template Verification Report
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Structured report based on predefined templates
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Template-Based</span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Report Content */}
      {report ? (
        <div className="space-y-6">
          {/* Report Content */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Report Content
            </h4>
            <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {report.content}
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Clock className="h-4 w-4 text-slate-500 mr-2" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Report Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Generated:</span>
                <span className="ml-2 text-slate-700 dark:text-slate-300">
                  {formatDate(report.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Type:</span>
                <span className="ml-2 text-slate-700 dark:text-slate-300">
                  {report.metadata.verificationType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Outcome:</span>
                <span className="ml-2 text-slate-700 dark:text-slate-300">
                  {report.metadata.outcome}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Template:</span>
                <span className="ml-2 text-slate-700 dark:text-slate-300">
                  {report.metadata.templateUsed}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {generating ? 'Regenerating...' : 'Regenerate Report'}
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
          </div>
        </div>
      ) : (
        /* No Report State */
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
            No Template Report Generated
          </h4>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Generate a structured verification report using predefined templates
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors mx-auto"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <FileText className="h-5 w-5 mr-2" />
            )}
            {generating ? 'Generating Report...' : 'Generate Template Report'}
          </button>
        </div>
      )}
    </div>
  );
};
