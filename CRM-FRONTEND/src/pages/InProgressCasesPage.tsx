import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InProgressCaseTable } from '@/components/cases/InProgressCaseTable';
import { CasePagination } from '@/components/cases/CasePagination';
import { useCases } from '@/hooks/useCases';
import { useFieldUsers } from '@/hooks/useUsers';
import { useClients } from '@/hooks/useClients';
import { Download, RefreshCw, Search, Filter, X, PlayCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { CaseListQuery } from '@/services/cases';

export const InProgressCasesPage: React.FC = () => {
  const [filters, setFilters] = useState<CaseListQuery>({
    status: 'IN_PROGRESS',
    page: 1,
    limit: 20,
    sortBy: 'pendingDuration',
    sortOrder: 'desc', // Longest in progress first
  });

  // Local state for search input to prevent focus loss
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search value to prevent excessive API calls
  const debouncedSearchValue = useDebounce(searchValue, 300);

  const { data: casesData, isLoading, refetch } = useCases(filters);
  const { data: fieldUsers } = useFieldUsers();
  const { data: clientsData } = useClients();

  const cases = casesData?.data || [];
  const pagination = casesData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
  const clients = clientsData?.data || [];

  // Update filters when debounced search value changes
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      setFilters(prev => ({
        ...prev,
        search: debouncedSearchValue || undefined,
        page: 1, // Reset to first page when filters change
      }));
    }
  }, [debouncedSearchValue, filters.search]);

  // Memoize the filter change handler to prevent unnecessary re-renders
  const handleFiltersChange = useCallback((newFilters: Partial<CaseListQuery>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  // Update local search value when filters are cleared
  useEffect(() => {
    if (!filters.search && searchValue) {
      setSearchValue('');
    }
  }, [filters.search, searchValue]);

  // Handle search input change with focus preservation
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Ensure focus is maintained
    setTimeout(() => {
      if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  }, []);

  const handleClearFilters = () => {
    setSearchValue(''); // Clear local search state
    setFilters({
      status: 'IN_PROGRESS',
      page: 1,
      limit: 20,
      sortBy: 'pendingDuration',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export in progress cases');
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'status' && key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder' && value !== undefined && value !== ''
  );

  // Helper function to format in progress duration
  const formatInProgressDuration = (pendingDurationSeconds?: number) => {
    if (!pendingDurationSeconds) return 'N/A';
    
    const hours = Math.floor(pendingDurationSeconds / 3600);
    const minutes = Math.floor((pendingDurationSeconds % 3600) / 60);
    
    if (hours < 1) {
      return `${minutes}m in progress`;
    } else if (hours < 24) {
      return `${hours}h in progress`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h in progress` : `${days}d in progress`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">In Progress Cases</h1>
          <p className="mt-2 text-gray-600">
            View and manage all cases currently being worked on
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <PlayCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Long Running</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cases.filter(c => {
                    const duration = (c as any).pendingDurationSeconds || 0;
                    return duration > 172800; // More than 2 days
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">⚡</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cases.filter(c => c.priority >= 4).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(cases.map(c => c.assignedToId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <CardTitle>Filters</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 'IN_PROGRESS' && v !== 1 && v !== 20 && v !== 'pendingDuration' && v !== 'desc').length} active
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  id="search"
                  placeholder="Search cases..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select
                value={filters.assignedTo || 'ALL'}
                onValueChange={(value) => handleFiltersChange({ assignedTo: value === 'ALL' ? undefined : value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All field users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All field users</SelectItem>
                  {fieldUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={filters.clientId || 'ALL'}
                onValueChange={(value) => handleFiltersChange({ clientId: value === 'ALL' ? undefined : value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority?.toString() || 'ALL'}
                onValueChange={(value) => handleFiltersChange({ priority: value === 'ALL' ? undefined : parseInt(value) })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All priorities</SelectItem>
                  <SelectItem value="1">Low (1)</SelectItem>
                  <SelectItem value="2">Normal (2)</SelectItem>
                  <SelectItem value="3">Medium (3)</SelectItem>
                  <SelectItem value="4">High (4)</SelectItem>
                  <SelectItem value="5">Critical (5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>In Progress Cases</CardTitle>
              <CardDescription>
                {pagination.total > 0
                  ? `Showing ${pagination.total} in progress case${pagination.total === 1 ? '' : 's'}`
                  : 'No in progress cases found'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <InProgressCaseTable
            cases={cases}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <CasePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
