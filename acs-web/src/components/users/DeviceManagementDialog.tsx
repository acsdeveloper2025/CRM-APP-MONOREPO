import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { User } from '../../types/user';
import { usersService } from '../../services/users';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

const deviceManagementSchema = z.object({
  deviceId: z.string().optional().refine((val) => {
    if (!val) return true; // Allow empty for clearing device ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  }, {
    message: 'Device ID must be a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)',
  }),
});

type DeviceManagementFormData = z.infer<typeof deviceManagementSchema>;

interface DeviceManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export function DeviceManagementDialog({
  open,
  onOpenChange,
  user,
}: DeviceManagementDialogProps) {
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const queryClient = useQueryClient();

  const form = useForm<DeviceManagementFormData>({
    resolver: zodResolver(deviceManagementSchema),
    defaultValues: {
      deviceId: user.deviceId || user.device_id || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DeviceManagementFormData) =>
      usersService.updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error updating device ID:', error);
    },
  });

  const onSubmit = (data: DeviceManagementFormData) => {
    updateMutation.mutate(data);
  };

  const handleCopyDeviceId = async () => {
    const deviceId = user.deviceId || user.device_id;
    if (!deviceId) return;

    try {
      await navigator.clipboard.writeText(deviceId);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (error) {
      console.error('Failed to copy device ID:', error);
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleClearDeviceId = () => {
    form.setValue('deviceId', '');
  };

  const handleGenerateNewUUID = () => {
    // Generate a new UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    form.setValue('deviceId', uuid);
  };

  const isFieldAgent = user.role === 'FIELD' || user.role === 'FIELD_AGENT' || 
                      user.roleName === 'Field Agent' || user.role_name === 'FIELD_AGENT';
  const currentDeviceId = user.deviceId || user.device_id;
  const hasDeviceId = Boolean(currentDeviceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📱 Device Management
            {isFieldAgent && (
              <Badge variant="secondary" className="text-xs">
                Field Agent
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Manage device authentication for {user.name} ({user.username})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Device Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Current Device Status</h4>
                {hasDeviceId ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ Device Registered
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    ⚪ No Device
                  </Badge>
                )}
              </div>

              {hasDeviceId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Current Device ID:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyDeviceId}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copyFeedback || 'Copy'}
                      </Button>
                    </div>
                  </div>
                  <code className="text-xs bg-white px-2 py-1 rounded border block">
                    {currentDeviceId}
                  </code>
                </div>
              )}

              {!isFieldAgent && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This user is not a field agent. Device authentication is only required for field agents.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Device ID Management */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Update Device ID</h4>
              
              <FormField
                control={form.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID (UUID Format)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter device UUID or leave empty to clear" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateNewUUID}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate New UUID
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearDeviceId}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Device ID
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Instructions:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Field agents must provide their device UUID from the mobile app</li>
                  <li>• You can generate a new UUID and provide it to the field agent</li>
                  <li>• Clearing the device ID will require the agent to re-register</li>
                  <li>• Device authentication is enforced during login for field agents</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Device ID'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
