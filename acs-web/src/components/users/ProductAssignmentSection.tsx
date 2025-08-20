import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, AlertCircle, Package } from 'lucide-react';
import { usersService } from '@/services/users';
import { productsService } from '@/services/products';
import type { User, UserProductAssignment } from '@/types/user';
import type { Product } from '@/types/product';

interface ProductAssignmentSectionProps {
  user: User;
}

export function ProductAssignmentSection({ user }: ProductAssignmentSectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Only show for BACKEND users
  if (user.role !== 'BACKEND') {
    return null;
  }

  // Fetch all products for the dropdown
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsService.getProducts({ limit: 1000 }), // Get all products
  });

  // Fetch user's product assignments
  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['user-product-assignments', user.id],
    queryFn: () => usersService.getUserProductAssignments(user.id),
  });

  // Assign products mutation
  const assignProductsMutation = useMutation({
    mutationFn: (productIds: number[]) => usersService.assignProductsToUser(user.id, productIds),
    onSuccess: () => {
      toast.success('Product assigned successfully');
      refetchAssignments();
      setSelectedProductId('');
      setHasChanges(false);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-product-assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign product');
    },
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: (productId: number) => usersService.removeProductAssignment(user.id, productId),
    onSuccess: () => {
      toast.success('Product assignment removed successfully');
      refetchAssignments();
      setHasChanges(false);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-product-assignments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove product assignment');
    },
  });

  const products = productsData?.data || [];
  const assignments = assignmentsData?.data || [];

  // Get assigned product IDs for filtering
  const assignedProductIds = assignments.map(assignment => assignment.productId);

  // Filter available products (not already assigned)
  const availableProducts = products.filter(product => !assignedProductIds.includes(product.id));

  const handleAssignProduct = () => {
    if (!selectedProductId) return;
    
    const productId = parseInt(selectedProductId);
    assignProductsMutation.mutate([productId]);
  };

  const handleRemoveAssignment = (productId: number) => {
    removeAssignmentMutation.mutate(productId);
  };

  if (productsLoading || assignmentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Access Assignment
          </CardTitle>
          <CardDescription>
            Loading product assignments...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Access Assignment
        </CardTitle>
        <CardDescription>
          Manage which products this BACKEND user can access for case assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Assignments */}
        <div>
          <h4 className="text-sm font-medium mb-3">Currently Assigned Products ({assignments.length})</h4>
          {assignments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => (
                <Badge
                  key={assignment.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <span>{assignment.productName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveAssignment(assignment.productId)}
                    disabled={removeAssignmentMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No products assigned. This user will not be able to create or access any cases.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Add New Assignment */}
        <div>
          <h4 className="text-sm font-medium mb-3">Assign New Product</h4>
          {availableProducts.length > 0 ? (
            <div className="flex gap-2">
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                disabled={assignProductsMutation.isPending}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a product to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        {product.description && (
                          <span className="text-sm text-muted-foreground">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignProduct}
                disabled={!selectedProductId || assignProductsMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All available products have been assigned to this user.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Changes take effect immediately. SUPER_ADMIN users can access all products regardless of assignments.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
