import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Building2,
  Loader2,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { deduplicationService, type DeduplicationCriteria, type DuplicateCluster } from '@/services/deduplication';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const DeduplicationPage: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<DeduplicationCriteria>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  // Fetch duplicate clusters
  const { data: clustersData, isLoading: loadingClusters, refetch: refetchClusters } = useQuery({
    queryKey: ['duplicate-clusters'],
    queryFn: () => deduplicationService.getDuplicateClusters(),
  });

  const clusters = clustersData?.data?.clusters || [];
  const pagination = clustersData?.data?.pagination;

  const handleSearch = async () => {
    const validation = deduplicationService.validateCriteria(searchCriteria);
    if (!validation.isValid) {
      toast.error(`Validation errors: ${validation.errors.join(', ')}`);
      return;
    }

    setIsSearching(true);
    try {
      const cleanedCriteria = deduplicationService.cleanCriteria(searchCriteria);
      const result = await deduplicationService.searchDuplicates(cleanedCriteria);
      
      if (result.success) {
        setSearchResults(result.data);
        if (result.data.duplicatesFound.length === 0) {
          toast.success('No duplicate cases found');
        } else {
          toast.success(`Found ${result.data.duplicatesFound.length} potential duplicates`);
        }
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchCriteria({});
    setSearchResults(null);
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'PAN':
      case 'Aadhaar':
        return 'bg-red-100 text-red-800';
      case 'Phone':
      case 'Bank Account':
        return 'bg-orange-100 text-orange-800';
      case 'Email':
        return 'bg-yellow-100 text-yellow-800';
      case 'Name':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Case Deduplication</h1>
        <p className="text-muted-foreground">
          Search for duplicate cases and manage case deduplication across the system.
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Deduplication Search</TabsTrigger>
          <TabsTrigger value="clusters">Duplicate Clusters</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search for Duplicate Cases
              </CardTitle>
              <CardDescription>
                Enter any combination of criteria to search for potential duplicate cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input
                    id="applicantName"
                    placeholder="Enter applicant name"
                    value={searchCriteria.applicantName || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, applicantName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    placeholder="ABCDE1234F"
                    value={searchCriteria.panNumber || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                  <Input
                    id="aadhaarNumber"
                    placeholder="1234 5678 9012"
                    value={searchCriteria.aadhaarNumber || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                      setSearchCriteria(prev => ({ ...prev, aadhaarNumber: formatted }));
                    }}
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantPhone">Phone Number</Label>
                  <Input
                    id="applicantPhone"
                    placeholder="Enter phone number"
                    value={searchCriteria.applicantPhone || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, applicantPhone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantEmail">Email Address</Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={searchCriteria.applicantEmail || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, applicantEmail: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="Enter bank account number"
                    value={searchCriteria.bankAccountNumber || ''}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search for Duplicates
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {searchResults.duplicatesFound.length} potential duplicate case{searchResults.duplicatesFound.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchResults.duplicatesFound.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No duplicate cases found</p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.duplicatesFound.map((duplicate: any) => (
                      <Card key={duplicate.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{duplicate.caseNumber}</span>
                              <Badge className={getStatusColor(duplicate.status)}>
                                {duplicate.status}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Score: {duplicate.matchScore}%
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{duplicate.applicantName}</span>
                              </div>
                              {duplicate.applicantPhone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{duplicate.applicantPhone}</span>
                                </div>
                              )}
                              {duplicate.applicantEmail && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>{duplicate.applicantEmail}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDistanceToNow(new Date(duplicate.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {duplicate.matchType.map((type: string) => (
                                <Badge key={type} className={getMatchTypeColor(type)} variant="secondary">
                                  {type} Match
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="ml-2">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Duplicate Case Clusters
              </CardTitle>
              <CardDescription>
                Groups of cases that share identical information and may be duplicates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClusters ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading duplicate clusters...</span>
                </div>
              ) : clusters.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No duplicate clusters found</p>
              ) : (
                <div className="space-y-4">
                  {clusters.map((cluster: DuplicateCluster, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{cluster.case_count} Cases</Badge>
                          <span className="text-sm text-gray-600">
                            Shared identifier: {cluster.group_key}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                      
                      <div className="grid gap-2">
                        {cluster.cases.map((caseItem) => (
                          <div key={caseItem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{caseItem.caseNumber}</span>
                              <span>{caseItem.applicantName}</span>
                              <Badge className={getStatusColor(caseItem.status)} variant="secondary">
                                {caseItem.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
