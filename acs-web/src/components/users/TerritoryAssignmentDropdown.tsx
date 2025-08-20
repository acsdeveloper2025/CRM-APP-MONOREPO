import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Building2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { territoryAssignmentService } from '@/services/territoryAssignments';
import { usePincodes } from '@/hooks/useLocations';
import { useAreasByPincode } from '@/hooks/useAreas';
import { MultiSelectDropdown, MultiSelectOption } from '@/components/ui/multi-select-dropdown';
import type { User as UserType } from '@/types/user';

interface TerritoryAssignmentDropdownProps {
  user: UserType;
}

interface AreaAssignment {
  pincodeId: number;
  areaIds: number[];
}

export function TerritoryAssignmentDropdown({ user }: TerritoryAssignmentDropdownProps) {
  const [selectedPincodeIds, setSelectedPincodeIds] = useState<number[]>([]);
  const [selectedAreaAssignments, setSelectedAreaAssignments] = useState<AreaAssignment[]>([]);
  const [hasPincodeChanges, setHasPincodeChanges] = useState(false);
  const [hasAreaChanges, setHasAreaChanges] = useState(false);
  const [pincodeSearchQuery, setPincodeSearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch available pincodes
  const { data: pincodesData, isLoading: pincodesLoading } = usePincodes();

  // Fetch current territory assignments
  const { data: territoryData, isLoading: territoryLoading } = useQuery({
    queryKey: ['user-territory-assignments', user.id],
    queryFn: () => territoryAssignmentService.getFieldAgentTerritoryById(user.id),
    enabled: !!user.id,
  });

  // Fetch areas for selected pincodes
  const areaQueries = useQuery({
    queryKey: ['areas-for-pincodes', selectedPincodeIds],
    queryFn: async () => {
      if (selectedPincodeIds.length === 0) return [];
      
      const areaPromises = selectedPincodeIds.map(async (pincodeId) => {
        try {
          const response = await fetch(`/api/pincodes/${pincodeId}/areas`);
          if (!response.ok) return { pincodeId, areas: [] };
          const data = await response.json();
          return { pincodeId, areas: data.data || [] };
        } catch (error) {
          console.error(`Error fetching areas for pincode ${pincodeId}:`, error);
          return { pincodeId, areas: [] };
        }
      });
      
      return Promise.all(areaPromises);
    },
    enabled: selectedPincodeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save pincode assignments mutation
  const savePincodeAssignmentsMutation = useMutation({
    mutationFn: (pincodeIds: number[]) => territoryAssignmentService.assignPincodesToFieldAgent(user.id, { pincodeIds }),
    onSuccess: () => {
      toast.success('Pincode assignments updated successfully');
      setHasPincodeChanges(false);
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            (Array.isArray(queryKey) && queryKey.includes(user.id)) ||
            (Array.isArray(queryKey) && queryKey[0] === 'user-territory-assignments') ||
            (Array.isArray(queryKey) && queryKey[0] === 'user' && queryKey[1] === user.id)
          );
        }
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pincode assignments');
    },
  });

  // Save area assignments mutation
  const saveAreaAssignmentsMutation = useMutation({
    mutationFn: (assignments: AreaAssignment[]) => territoryAssignmentService.assignAreasToFieldAgent(user.id, { assignments }),
    onSuccess: () => {
      toast.success('Area assignments updated successfully');
      setHasAreaChanges(false);
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            (Array.isArray(queryKey) && queryKey.includes(user.id)) ||
            (Array.isArray(queryKey) && queryKey[0] === 'user-territory-assignments') ||
            (Array.isArray(queryKey) && queryKey[0] === 'user' && queryKey[1] === user.id)
          );
        }
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update area assignments');
    },
  });

  const currentAssignments = territoryData?.data?.pincodeAssignments || [];
  const currentAreaAssignments = territoryData?.data?.areaAssignments || [];
  const availablePincodes = pincodesData?.data || [];

  // Initialize selected pincodes from current assignments
  useEffect(() => {
    if (currentAssignments.length > 0) {
      const currentPincodeIds = currentAssignments.map(assignment => assignment.pincodeId);
      setSelectedPincodeIds(currentPincodeIds);
    }
  }, [currentAssignments]);

  // Initialize selected area assignments from current assignments
  useEffect(() => {
    if (currentAreaAssignments.length > 0) {
      const groupedAssignments = currentAreaAssignments.reduce((acc, assignment) => {
        const existing = acc.find(item => item.pincodeId === assignment.pincodeId);
        if (existing) {
          existing.areaIds.push(assignment.areaId);
        } else {
          acc.push({
            pincodeId: assignment.pincodeId,
            areaIds: [assignment.areaId]
          });
        }
        return acc;
      }, [] as AreaAssignment[]);
      
      setSelectedAreaAssignments(groupedAssignments);
    }
  }, [currentAreaAssignments]);

  // Convert pincodes to dropdown options
  const pincodeOptions: MultiSelectOption[] = useMemo(() => {
    if (!availablePincodes) return [];
    
    return availablePincodes
      .filter(pincode => {
        if (!pincodeSearchQuery) return true;
        const query = pincodeSearchQuery.toLowerCase();
        return (
          pincode.code.toLowerCase().includes(query) ||
          pincode.cityName?.toLowerCase().includes(query) ||
          pincode.state?.toLowerCase().includes(query)
        );
      })
      .map(pincode => ({
        id: pincode.id,
        label: pincode.code,
        description: `${pincode.cityName}, ${pincode.state}`
      }));
  }, [availablePincodes, pincodeSearchQuery]);

  // Convert areas to dropdown options
  const areaOptions: MultiSelectOption[] = useMemo(() => {
    if (!areaQueries.data) return [];
    
    const allAreas: MultiSelectOption[] = [];
    
    areaQueries.data.forEach(({ pincodeId, areas }) => {
      const pincode = availablePincodes.find(p => p.id === pincodeId);
      const pincodeCode = pincode?.code || pincodeId.toString();
      
      areas.forEach((area: any) => {
        if (!areaSearchQuery || area.name.toLowerCase().includes(areaSearchQuery.toLowerCase())) {
          allAreas.push({
            id: area.id,
            label: area.name,
            description: `Pincode: ${pincodeCode}`
          });
        }
      });
    });
    
    return allAreas;
  }, [areaQueries.data, availablePincodes, areaSearchQuery]);

  // Get all selected area IDs for the dropdown
  const selectedAreaIds = useMemo(() => {
    return selectedAreaAssignments.flatMap(assignment => assignment.areaIds);
  }, [selectedAreaAssignments]);

  // Handle pincode selection changes
  const handlePincodeSelectionChange = (values: (string | number)[]) => {
    const newPincodeIds = values.map(id => Number(id));
    setSelectedPincodeIds(newPincodeIds);
    
    // Check if there are changes
    const currentIds = currentAssignments.map(assignment => assignment.pincodeId).sort();
    const newIds = newPincodeIds.sort();
    setHasPincodeChanges(JSON.stringify(currentIds) !== JSON.stringify(newIds));
    
    // Remove area assignments for deselected pincodes
    const removedPincodes = selectedPincodeIds.filter(id => !newPincodeIds.includes(id));
    if (removedPincodes.length > 0) {
      setSelectedAreaAssignments(prev => 
        prev.filter(assignment => !removedPincodes.includes(assignment.pincodeId))
      );
      setHasAreaChanges(true);
    }
  };

  // Handle area selection changes
  const handleAreaSelectionChange = (values: (string | number)[]) => {
    const newAreaIds = values.map(id => Number(id));
    
    // Group areas by pincode
    const newAssignments: AreaAssignment[] = [];
    
    if (areaQueries.data) {
      areaQueries.data.forEach(({ pincodeId, areas }) => {
        const pincodeAreaIds = areas
          .filter((area: any) => newAreaIds.includes(area.id))
          .map((area: any) => area.id);
        
        if (pincodeAreaIds.length > 0) {
          newAssignments.push({
            pincodeId,
            areaIds: pincodeAreaIds
          });
        }
      });
    }
    
    setSelectedAreaAssignments(newAssignments);
    
    // Check if there are changes
    const currentGrouped = currentAreaAssignments.reduce((acc, assignment) => {
      const existing = acc.find(item => item.pincodeId === assignment.pincodeId);
      if (existing) {
        existing.areaIds.push(assignment.areaId);
      } else {
        acc.push({
          pincodeId: assignment.pincodeId,
          areaIds: [assignment.areaId]
        });
      }
      return acc;
    }, [] as AreaAssignment[]);
    
    setHasAreaChanges(JSON.stringify(currentGrouped.sort()) !== JSON.stringify(newAssignments.sort()));
  };

  // Handle save operations
  const handleSavePincodes = () => {
    savePincodeAssignmentsMutation.mutate(selectedPincodeIds);
  };

  const handleSaveAreas = () => {
    saveAreaAssignmentsMutation.mutate(selectedAreaAssignments);
  };

  const isLoading = pincodesLoading || territoryLoading;
  const isSaving = savePincodeAssignmentsMutation.isPending || saveAreaAssignmentsMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading territory assignments...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Territory Assignments</span>
        </CardTitle>
        <CardDescription>
          Assign pincodes and areas to this field agent for case routing and territory management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Assignments Summary */}
        {(currentAssignments.length > 0 || currentAreaAssignments.length > 0) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Current Assignments</h4>
            <div className="space-y-2">
              {currentAssignments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pincodes ({currentAssignments.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {currentAssignments.map((assignment) => (
                      <Badge key={assignment.pincodeId} variant="secondary" className="text-xs">
                        {assignment.pincodeCode} - {assignment.cityName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {currentAreaAssignments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Areas ({currentAreaAssignments.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {currentAreaAssignments.map((assignment) => (
                      <Badge key={`${assignment.pincodeId}-${assignment.areaId}`} variant="outline" className="text-xs">
                        {assignment.areaName} ({assignment.pincodeCode})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </div>
        )}

        {/* Dropdown-based Assignment Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pincode Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <h4 className="font-medium">Pincode Assignment</h4>
              </div>
              {hasPincodeChanges && (
                <Button 
                  onClick={handleSavePincodes} 
                  disabled={isSaving}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Pincodes
                </Button>
              )}
            </div>
            
            <MultiSelectDropdown
              options={pincodeOptions}
              selectedValues={selectedPincodeIds}
              onSelectionChange={handlePincodeSelectionChange}
              placeholder="Select pincodes..."
              searchPlaceholder="Search by pincode or city..."
              onSearch={setPincodeSearchQuery}
              searchQuery={pincodeSearchQuery}
              isLoading={pincodesLoading}
              maxDisplayItems={50}
              emptyMessage="No pincodes found"
            />
          </div>

          {/* Area Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <h4 className="font-medium">Area Assignment</h4>
              </div>
              {hasAreaChanges && (
                <Button 
                  onClick={handleSaveAreas} 
                  disabled={isSaving || selectedPincodeIds.length === 0}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Areas
                </Button>
              )}
            </div>
            
            {selectedPincodeIds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select pincodes first to assign areas</p>
              </div>
            ) : (
              <MultiSelectDropdown
                options={areaOptions}
                selectedValues={selectedAreaIds}
                onSelectionChange={handleAreaSelectionChange}
                placeholder="Select areas..."
                searchPlaceholder="Search areas..."
                onSearch={setAreaSearchQuery}
                searchQuery={areaSearchQuery}
                isLoading={areaQueries.isLoading}
                maxDisplayItems={100}
                emptyMessage="No areas found for selected pincodes"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
