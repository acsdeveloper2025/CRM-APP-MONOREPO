import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormSubmissionsDashboard } from '@/components/analytics/FormSubmissionsDashboard';
import { CaseAnalyticsDashboard } from '@/components/analytics/CaseAnalyticsDashboard';
import { AgentPerformanceDashboard } from '@/components/analytics/AgentPerformanceDashboard';
import { 
  useFormSubmissionStats, 
  useCaseCompletionMetrics, 
  useAgentPerformanceOverview 
} from '@/hooks/useAnalytics';
import { 
  BarChart3, 
  FileText, 
  Users, 
  TrendingUp,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get overview data for the summary cards
  const { data: formStats } = useFormSubmissionStats();
  const { data: caseMetrics } = useCaseCompletionMetrics();
  const { data: agentOverview } = useAgentPerformanceOverview();

  const formSummary = formStats?.data;
  const caseSummary = caseMetrics?.data;
  const agentSummary = agentOverview?.data?.summary;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into form submissions, case performance, and agent productivity
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="forms" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Form Submissions</span>
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Case Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Agent Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Dashboard */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Form Submissions Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Form Submissions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formSummary?.totalSubmissions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formSummary?.validationRate 
                    ? `${formSummary.validationRate.toFixed(1)}% validation rate`
                    : 'No submissions yet'
                  }
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valid:</span>
                    <span className="text-green-600 font-medium">{formSummary?.validSubmissions || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="text-yellow-600 font-medium">{formSummary?.pendingSubmissions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Case Completion Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Case Performance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{caseSummary?.totalCases || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {caseSummary?.completionRate 
                    ? `${caseSummary.completionRate.toFixed(1)}% completion rate`
                    : 'No cases yet'
                  }
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed:</span>
                    <span className="text-green-600 font-medium">{caseSummary?.completedCases || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Days:</span>
                    <span className="text-blue-600 font-medium">
                      {caseSummary?.avgCompletionDays ? `${caseSummary.avgCompletionDays.toFixed(1)}d` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Performance Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agent Performance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agentSummary?.totalAgents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {agentSummary?.activeAgents 
                    ? `${agentSummary.activeAgents} active agents`
                    : 'No active agents'
                  }
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Cases:</span>
                    <span className="text-blue-600 font-medium">
                      {agentSummary?.avgCasesPerAgent ? agentSummary.avgCasesPerAgent.toFixed(1) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completion:</span>
                    <span className="text-green-600 font-medium">
                      {agentSummary?.avgCompletionRate ? `${agentSummary.avgCompletionRate.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Residence Forms</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formSummary?.residenceForms || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Office Forms</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formSummary?.officeForms || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Form Completion</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {caseSummary?.avgFormCompletion ? `${caseSummary.avgFormCompletion.toFixed(1)}%` : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{agentSummary?.activeAgents || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Explore detailed insights using the tabs above
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold">Form Submissions</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track form completion rates, validation status, and submission trends
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Target className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold">Case Analytics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitor case progress, completion times, and status distributions
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Users className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-semibold">Agent Performance</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyze agent productivity, quality scores, and performance metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <FormSubmissionsDashboard />
        </TabsContent>

        <TabsContent value="cases">
          <CaseAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="agents">
          <AgentPerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
