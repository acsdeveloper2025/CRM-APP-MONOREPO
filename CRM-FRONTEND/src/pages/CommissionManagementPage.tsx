import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Users, 
  Settings, 
  TrendingUp, 
  DollarSign,
  FileText,
  Download
} from 'lucide-react';
import { CommissionRateTypesTab } from '@/components/commission/CommissionRateTypesTab';
import { FieldUserAssignmentsTab } from '@/components/commission/FieldUserAssignmentsTab';
import { CommissionCalculationsTab } from '@/components/commission/CommissionCalculationsTab';
import { CommissionStatsTab } from '@/components/commission/CommissionStatsTab';
import { useQuery } from '@tanstack/react-query';
import { commissionManagementService } from '@/services/commissionManagement';

export const CommissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculations');

  // Fetch commission stats for overview
  const { data: statsData } = useQuery({
    queryKey: ['commission-stats'],
    queryFn: () => commissionManagementService.getCommissionStats(),
  });

  const stats = statsData?.data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage field employee commissions, rate assignments, and payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCommissions}</p>
                </div>
                <Calculator className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.currency} {stats.totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingCommissions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.currency} {stats.pendingAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedCommissions}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.currency} {stats.approvedAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.paidCommissions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {stats.currency} {stats.paidAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Commission Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calculations" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculations
                {stats && stats.pendingCommissions > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingCommissions}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Field Assignments
              </TabsTrigger>
              <TabsTrigger value="rate-types" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Rate Types
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculations" className="mt-6">
              <CommissionCalculationsTab />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <FieldUserAssignmentsTab />
            </TabsContent>

            <TabsContent value="rate-types" className="mt-6">
              <CommissionRateTypesTab />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <CommissionStatsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('calculations')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Review Commissions</h3>
                <p className="text-sm text-muted-foreground">Approve pending commission calculations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('assignments')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Assign Rates</h3>
                <p className="text-sm text-muted-foreground">Configure field user commission rates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('rate-types')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Manage Rate Types</h3>
                <p className="text-sm text-muted-foreground">Configure commission rate templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Commission Management Guide</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• <strong>Rate Types:</strong> Create commission templates with fixed amounts or percentages</p>
                <p>• <strong>Field Assignments:</strong> Assign specific commission rates to field users by client or globally</p>
                <p>• <strong>Calculations:</strong> Review and approve auto-calculated commissions from completed cases</p>
                <p>• <strong>Payments:</strong> Process approved commissions and track payment status</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
