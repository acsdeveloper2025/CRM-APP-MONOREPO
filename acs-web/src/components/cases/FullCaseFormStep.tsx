import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send, Loader2, User, MapPin, Building2, CreditCard, Building } from 'lucide-react';
import { useFieldUsers } from '@/hooks/useUsers';
import { useClients, useVerificationTypes, useProductsByClient } from '@/hooks/useClients';
import type { CustomerInfoData } from './CustomerInfoStep';

const fullCaseFormSchema = z.object({
  // Address information
  addressStreet: z.string().min(1, 'Street address is required').max(200, 'Street address must be less than 200 characters'),
  addressCity: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  addressState: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  addressPincode: z.string().min(1, 'Pincode is required').regex(/^\d{6}$/, 'Pincode must be 6 digits'),

  // Assignment and client
  assignedToId: z.string().min(1, 'Field user assignment is required'),
  clientId: z.string().min(1, 'Client selection is required'),
  productId: z.string().min(1, 'Product selection is required'),
  verificationType: z.string().min(1, 'Verification type is required'),
  verificationTypeId: z.string().optional(),

  // Additional details
  priority: z.number().min(1).max(5).default(2),
  notes: z.string().optional(), // TRIGGER field
});

export type FullCaseFormData = z.infer<typeof fullCaseFormSchema>;

interface FullCaseFormStepProps {
  customerInfo: CustomerInfoData;
  onSubmit: (data: FullCaseFormData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<FullCaseFormData>;
}

export const FullCaseFormStep: React.FC<FullCaseFormStepProps> = ({
  customerInfo,
  onSubmit,
  onBack,
  isSubmitting = false,
  initialData = {}
}) => {
  const { data: fieldUsersResponse } = useFieldUsers();
  const { data: clientsResponse } = useClients();
  const { data: verificationTypesResponse } = useVerificationTypes();

  // Extract the actual arrays from the API responses
  const fieldUsers = fieldUsersResponse?.data || [];
  const clients = clientsResponse?.data || [];
  const verificationTypes = verificationTypesResponse?.data || [];

  const form = useForm<FullCaseFormData>({
    resolver: zodResolver(fullCaseFormSchema),
    defaultValues: {
      addressStreet: initialData.addressStreet || '',
      addressCity: initialData.addressCity || '',
      addressState: initialData.addressState || '',
      addressPincode: initialData.addressPincode || '',
      assignedToId: initialData.assignedToId || '',
      clientId: initialData.clientId || '',
      productId: initialData.productId || '',
      verificationType: initialData.verificationType || '',
      verificationTypeId: initialData.verificationTypeId || '',
      priority: initialData.priority || 2,
      notes: initialData.notes || '', // TRIGGER field
    },
  });

  // Watch for client selection to fetch products
  const selectedClientId = form.watch('clientId');
  const { data: productsResponse } = useProductsByClient(selectedClientId);
  const products = productsResponse?.data || [];

  const handleSubmit = (data: FullCaseFormData) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Case Details</h2>
        <p className="text-muted-foreground">
          Complete the case information and assignment details
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Customer Information Summary - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Customer details from previous step (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <p className="text-base font-medium">{customerInfo.customerName}</p>
                </div>
                {customerInfo.panNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                    <p className="text-base font-mono">{customerInfo.panNumber}</p>
                  </div>
                )}
                {customerInfo.mobileNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                    <p className="text-base">{customerInfo.mobileNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="addressStreet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="addressCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressPincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          {...field}
                          maxLength={6}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assignment & Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Reset product selection when client changes
                        form.setValue('productId', '');
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={String(client.id)}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedClientId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedClientId ? "Select product" : "Select client first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Field User *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select field user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fieldUsers?.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="verificationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select verification type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {verificationTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">High</SelectItem>
                          <SelectItem value="4">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* TRIGGER Field - Moved from Additional Information */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TRIGGER</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information or special instructions"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>



          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customer Info
            </Button>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Case...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create & Assign Case
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
