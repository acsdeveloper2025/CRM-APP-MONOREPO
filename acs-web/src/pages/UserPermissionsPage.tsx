import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Shield, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usersService } from '@/services/users';
import { ClientAssignmentSection } from '@/components/users/ClientAssignmentSection';
import { ProductAssignmentSection } from '@/components/users/ProductAssignmentSection';
import type { User as UserType } from '@/types/user';

export function UserPermissionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Fetch user details
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersService.getUserById(userId!),
    enabled: !!userId,
  });

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading User Permissions...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userError || !userData?.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load user details. The user may not exist or you may not have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const user: UserType = userData.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Permissions</h1>
            <p className="text-muted-foreground">
              Manage access control and permissions for {user.name}
            </p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-based Access Control Info */}
      {user.role === 'SUPER_ADMIN' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>SUPER_ADMIN Access:</strong> This user has unrestricted access to all clients and products. 
            Client and product assignments do not apply to SUPER_ADMIN users.
          </AlertDescription>
        </Alert>
      )}

      {user.role !== 'BACKEND' && user.role !== 'SUPER_ADMIN' && (
        <Alert>
          <AlertDescription>
            <strong>Role-based Access:</strong> Client and product access control only applies to BACKEND users. 
            This user's role ({user.role}) has different permission structures.
          </AlertDescription>
        </Alert>
      )}

      {/* Client Assignment Section */}
      {user.role === 'BACKEND' && (
        <>
          <ClientAssignmentSection user={user} />
          <ProductAssignmentSection user={user} />
        </>
      )}

      {/* Additional Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permission Summary</span>
          </CardTitle>
          <CardDescription>
            Overview of this user's access levels and restrictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Client Access</span>
              </h4>
              {user.role === 'SUPER_ADMIN' ? (
                <p className="text-sm text-muted-foreground">Full access to all clients</p>
              ) : user.role === 'BACKEND' ? (
                <p className="text-sm text-muted-foreground">
                  Access restricted to assigned clients only
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Role-based access (not client-specific)
                </p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Product Access</span>
              </h4>
              {user.role === 'SUPER_ADMIN' ? (
                <p className="text-sm text-muted-foreground">Full access to all products</p>
              ) : user.role === 'BACKEND' ? (
                <p className="text-sm text-muted-foreground">
                  Access restricted to assigned products only
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Role-based access (not product-specific)
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
