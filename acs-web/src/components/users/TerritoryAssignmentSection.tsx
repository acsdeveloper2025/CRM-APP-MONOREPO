import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
// import { useTerritoryAssignments } from '@/hooks/useTerritoryAssignments';
// import { usePincodes } from '@/hooks/useLocations';
// import { useAreasByPincode } from '@/hooks/useAreas';
// import type { TerritorySelection } from '@/types/territoryAssignment';

// Temporary types for UI development
interface TerritorySelection {
  pincodeId: number;
  selectedAreaIds: number[];
}

// Mock data for UI development
const mockPincodes = [
  { id: 1, code: '400001', cityName: 'Mumbai', stateName: 'Maharashtra' },
  { id: 2, code: '110001', cityName: 'Delhi', stateName: 'Delhi' },
  { id: 3, code: '560001', cityName: 'Bangalore', stateName: 'Karnataka' },
];

const mockAreas = [
  { id: 1, name: 'Colaba' },
  { id: 2, name: 'Fort' },
  { id: 3, name: 'Churchgate' },
  { id: 4, name: 'Marine Drive' },
];

interface TerritoryAssignmentSectionProps {
  userId?: string;
  userRole?: string;
  onAssignmentsChange?: (assignments: TerritorySelection[]) => void;
  disabled?: boolean;
}

export const TerritoryAssignmentSection: React.FC<TerritoryAssignmentSectionProps> = ({
  userId,
  userRole,
  onAssignmentsChange,
  disabled = false
}) => {
  const [territorySelections, setTerritorySelections] = useState<TerritorySelection[]>([]);
  const [selectedPincodeId, setSelectedPincodeId] = useState<string>('');

  // Mock data for UI development
  const pincodes = mockPincodes;
  const areas = mockAreas;
  const pincodesLoading = false;
  const areasLoading = false;
  const territoryLoading = false;

  // Load existing territory assignments for the user (mock for now)
  useEffect(() => {
    if (userId && userRole === 'FIELD_AGENT') {
      // Mock existing assignments for demonstration
      const mockSelections: TerritorySelection[] = [
        { pincodeId: 1, selectedAreaIds: [1, 2] }
      ];
      setTerritorySelections(mockSelections);
      onAssignmentsChange?.(mockSelections);
    }
  }, [userId, userRole, onAssignmentsChange]);

  // Don't show territory assignment for non-field users
  if (userRole !== 'FIELD_AGENT') {
    return null;
  }

  const handleAddPincode = () => {
    if (!selectedPincodeId) {
      toast.error("Please select a pincode to add");
      return;
    }

    const pincodeId = parseInt(selectedPincodeId);
    const existingSelection = territorySelections.find(sel => sel.pincodeId === pincodeId);

    if (existingSelection) {
      toast.error("This pincode is already in the territory assignments");
      return;
    }

    const newSelection: TerritorySelection = {
      pincodeId,
      selectedAreaIds: []
    };

    const updatedSelections = [...territorySelections, newSelection];
    setTerritorySelections(updatedSelections);
    onAssignmentsChange?.(updatedSelections);
    setSelectedPincodeId('');
  };

  const handleRemovePincode = async (pincodeId: number) => {
    try {
      // Mock API call for now
      const updatedSelections = territorySelections.filter(sel => sel.pincodeId !== pincodeId);
      setTerritorySelections(updatedSelections);
      onAssignmentsChange?.(updatedSelections);

      toast.success("Pincode assignment removed successfully");
    } catch (error) {
      toast.error("Failed to remove pincode assignment");
    }
  };

  const handleAreaToggle = (pincodeId: number, areaId: number, checked: boolean) => {
    const updatedSelections = territorySelections.map(selection => {
      if (selection.pincodeId === pincodeId) {
        const updatedAreaIds = checked
          ? [...selection.selectedAreaIds, areaId]
          : selection.selectedAreaIds.filter(id => id !== areaId);
        
        return {
          ...selection,
          selectedAreaIds: updatedAreaIds
        };
      }
      return selection;
    });

    setTerritorySelections(updatedSelections);
    onAssignmentsChange?.(updatedSelections);
  };

  const handleSaveAssignments = async () => {
    if (!userId) {
      toast.error("User ID is required to save assignments");
      return;
    }

    try {
      // Mock API call for now
      console.log('Saving territory assignments:', territorySelections);

      toast.success("Territory assignments saved successfully");
    } catch (error) {
      toast.error("Failed to save territory assignments");
    }
  };

  const getPincodeInfo = (pincodeId: number) => {
    return pincodes.find(p => p.id === pincodeId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Territory Assignments
        </CardTitle>
        <CardDescription>
          Assign pincodes and areas to this field agent for case routing and territory management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Pincode */}
        <div className="flex gap-2">
          <Select
            value={selectedPincodeId}
            onValueChange={setSelectedPincodeId}
            disabled={disabled || pincodesLoading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a pincode to add" />
            </SelectTrigger>
            <SelectContent>
              {pincodes.map((pincode) => (
                <SelectItem key={pincode.id} value={pincode.id.toString()}>
                  {pincode.code} - {pincode.cityName}, {pincode.stateName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddPincode}
            disabled={disabled || !selectedPincodeId}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Pincode
          </Button>
        </div>

        {/* Current Territory Assignments */}
        <div className="space-y-4">
          {territorySelections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No territory assignments yet</p>
              <p className="text-sm">Add pincodes to assign territories to this field agent</p>
            </div>
          ) : (
            territorySelections.map((selection) => {
              const pincodeInfo = getPincodeInfo(selection.pincodeId);
              return (
                <Card key={selection.pincodeId} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {pincodeInfo?.code || `Pincode ${selection.pincodeId}`}
                        </CardTitle>
                        <CardDescription>
                          {pincodeInfo?.cityName}, {pincodeInfo?.stateName}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePincode(selection.pincodeId)}
                        disabled={disabled}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Areas in this Pincode</h4>
                        <Badge variant="secondary">
                          {selection.selectedAreaIds.length} selected
                        </Badge>
                      </div>
                      
                      {areasLoading ? (
                        <p className="text-sm text-muted-foreground">Loading areas...</p>
                      ) : areas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No areas found for this pincode</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {areas.map((area) => (
                            <div key={area.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`area-${area.id}`}
                                checked={selection.selectedAreaIds.includes(area.id)}
                                onCheckedChange={(checked) =>
                                  handleAreaToggle(selection.pincodeId, area.id, checked as boolean)
                                }
                                disabled={disabled}
                              />
                              <label
                                htmlFor={`area-${area.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {area.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Save Button */}
        {territorySelections.length > 0 && userId && (
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSaveAssignments}
              disabled={disabled || territoryLoading}
              className="min-w-[120px]"
            >
              {territoryLoading ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
