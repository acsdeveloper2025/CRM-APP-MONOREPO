import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usersService } from '@/services/users';
import { clientsService } from '@/services/clients';
import { toast } from 'sonner';
import type { User, UserClientAssignment } from '@/types/user';
import type { Client } from '@/types/client';

interface ClientAssignmentSectionProps {
  user: User;
}

export function ClientAssignmentSection({ user }: ClientAssignmentSectionProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Only show for BACKEND users
  if (user.role !== 'BACKEND') {
    return null;
  }

  // Fetch all clients for the dropdown
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientsService.getClients({ limit: 1000 }), // Get all clients
  });

  // Fetch current user client assignments
  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['user-client-assignments', user.id],
    queryFn: () => usersService.getUserClientAssignments(user.id),
  });

  // Assign clients mutation
  const assignClientsMutation = useMutation({
    mutationFn: (clientIds: number[]) => usersService.assignClientsToUser(user.id, clientIds),
    onSuccess: () => {
      toast.success('Client assigned successfully');
      refetchAssignments();
      setSelectedClientId('');
      setHasChanges(false);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-client-assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign client');
    },
  });

  // Remove client assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: (clientId: number) => usersService.removeClientAssignment(user.id, clientId),
    onSuccess: () => {
      toast.success('Client assignment removed successfully');
      refetchAssignments();
      setHasChanges(false);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-client-assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove client assignment');
    },
  });

  const clients = clientsData?.data || [];
  const assignments = assignmentsData?.data || [];

  // Get assigned client IDs for filtering
  const assignedClientIds = assignments.map(assignment => assignment.clientId);

  // Filter available clients (not already assigned)
  const availableClients = clients.filter(client => !assignedClientIds.includes(client.id));

  const handleAssignClient = () => {
    if (!selectedClientId) return;
    
    const clientId = parseInt(selectedClientId);
    assignClientsMutation.mutate([clientId]);
  };

  const handleRemoveAssignment = (clientId: number) => {
    removeAssignmentMutation.mutate(clientId);
  };

  if (assignmentsLoading || clientsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Client Access Management</span>
          </CardTitle>
          <CardDescription>
            Loading client assignments...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Client Access Management</span>
        </CardTitle>
        <CardDescription>
          Manage which clients this BACKEND user can access. Users can only view and manage cases from their assigned clients.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Assignments */}
        <div>
          <h4 className="text-sm font-medium mb-3">Assigned Clients ({assignments.length})</h4>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{assignment.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {assignment.clientCode}
                      </p>
                    </div>
                    <Badge variant={assignment.clientIsActive ? 'default' : 'secondary'}>
                      {assignment.clientIsActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.clientId)}
                    disabled={removeAssignmentMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No clients assigned. This user will not be able to access any cases until clients are assigned.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Add New Assignment */}
        <div>
          <h4 className="text-sm font-medium mb-3">Assign New Client</h4>
          {availableClients.length > 0 ? (
            <div className="flex items-center space-x-3">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a client to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{client.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {client.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignClient}
                disabled={!selectedClientId || assignClientsMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All available clients have been assigned to this user.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Changes take effect immediately. SUPER_ADMIN users can access all clients regardless of assignments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
