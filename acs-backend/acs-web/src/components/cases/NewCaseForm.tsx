import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFieldUsers } from '@/hooks/useUsers';
import { useClients, useVerificationTypes } from '@/hooks/useClients';
import { Save, Send, Loader2, Search } from 'lucide-react';
import type { CreateCaseData } from '@/services/cases';
import { deduplicationService, type DeduplicationResult } from '@/services/deduplication';
import { DeduplicationDialog } from './DeduplicationDialog';
import toast from 'react-hot-toast';

const newCaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name must be less than 100 characters'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  addressStreet: z.string().min(1, 'Street address is required').max(200, 'Street address must be less than 200 characters'),
  addressCity: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
  addressState: z.string().min(1, 'State is required').max(100, 'State must be less than 100 characters'),
  addressPincode: z.string().min(1, 'Pincode is required').regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  verificationType: z.string().min(1, 'Verification type is required'),
  verificationTypeId: z.string().optional(),
  assignedToId: z.string().min(1, 'Field user assignment is required'),
  clientId: z.string().min(1, 'Client selection is required'),
  priority: z.number().min(1).max(5).default(2),
  notes: z.string().optional(),
  // New deduplication fields
  panNumber: z.string().optional().refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
    message: 'PAN must be in format: ABCDE1234F'
  }),
  aadhaarNumber: z.string().optional().refine((val) => !val || /^[0-9]{12}$/.test(val.replace(/\s/g, '')), {
    message: 'Aadhaar must be 12 digits'
  }),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional().refine((val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
    message: 'IFSC code must be in format: ABCD0123456'
  }),
});

type NewCaseFormData = z.infer<typeof newCaseSchema>;

interface NewCaseFormProps {
  onSubmit: (data: CreateCaseData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const NewCaseForm: React.FC<NewCaseFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { data: fieldUsers, isLoading: loadingUsers } = useFieldUsers();
  const { data: clientsData, isLoading: loadingClients } = useClients();
  const { data: verificationTypesData, isLoading: loadingVerificationTypes } = useVerificationTypes();

  const clients = clientsData?.data || [];
  const verificationTypes = verificationTypesData?.data || [];

  const form = useForm<NewCaseFormData>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      title: '',
      description: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressPincode: '',
      verificationType: undefined,
      verificationTypeId: undefined,
      assignedToId: undefined,
      clientId: undefined,
      priority: 2,
      notes: '',
      // New deduplication fields
      panNumber: '',
      aadhaarNumber: '',
      bankAccountNumber: '',
      bankIfscCode: '',
    },
  });

  // Deduplication state
  const [isCheckingDuplicates, setIsCheckingDuplicates] = React.useState(false);
  const [deduplicationResult, setDeduplicationResult] = React.useState<DeduplicationResult | null>(null);
  const [showDeduplicationDialog, setShowDeduplicationDialog] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<NewCaseFormData | null>(null);

  const performDeduplicationCheck = async (data: NewCaseFormData) => {
    setIsCheckingDuplicates(true);

    try {
      const criteria = deduplicationService.cleanCriteria({
        applicantName: data.customerName,
        panNumber: data.panNumber,
        aadhaarNumber: data.aadhaarNumber,
        applicantPhone: data.customerPhone,
        applicantEmail: data.customerEmail,
        bankAccountNumber: data.bankAccountNumber,
      });

      const validation = deduplicationService.validateCriteria(criteria);
      if (!validation.isValid) {
        toast.error(`Validation errors: ${validation.errors.join(', ')}`);
        return;
      }

      const result = await deduplicationService.searchDuplicates(criteria);

      if (result.success && result.data.duplicatesFound.length > 0) {
        setDeduplicationResult(result.data);
        setPendingFormData(data);
        setShowDeduplicationDialog(true);
      } else {
        // No duplicates found, proceed with case creation
        proceedWithCaseCreation(data, 'NO_DUPLICATES', 'No duplicate cases found during deduplication check');
      }
    } catch (error) {
      console.error('Deduplication check failed:', error);
      toast.error('Deduplication check failed. Proceeding with case creation.');
      proceedWithCaseCreation(data, 'NO_DUPLICATES', 'Deduplication check failed - proceeding anyway');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const proceedWithCaseCreation = (data: NewCaseFormData, decision: string, rationale: string) => {
    const caseData: CreateCaseData = {
      ...data,
      applicantName: data.customerName,
      applicantPhone: data.customerPhone,
      applicantEmail: data.customerEmail,
      deduplicationDecision: decision,
      deduplicationRationale: rationale,
    };
    onSubmit(caseData);
  };

  const handleSubmit = (data: NewCaseFormData) => {
    // Always perform deduplication check before creating case
    performDeduplicationCheck(data);
  };

  const handleCreateNewCase = (rationale: string) => {
    if (pendingFormData) {
      proceedWithCaseCreation(pendingFormData, 'CREATE_NEW', rationale);
      setShowDeduplicationDialog(false);
      setPendingFormData(null);
      setDeduplicationResult(null);
    }
  };

  const handleUseExistingCase = (caseId: string, rationale: string) => {
    // For now, we'll just close the dialog and show a message
    // In a full implementation, this would navigate to the existing case
    toast.success(`Redirecting to existing case: ${caseId}`);
    setShowDeduplicationDialog(false);
    setPendingFormData(null);
    setDeduplicationResult(null);
    onCancel(); // Close the form
  };

  const verificationTypeOptions = [
    { value: 'RESIDENCE', label: 'Residence Verification' },
    { value: 'OFFICE', label: 'Office Verification' },
    { value: 'BUSINESS', label: 'Business Verification' },
    { value: 'OTHER', label: 'Other Verification' },
  ];

  const priorityOptions = [
    { value: 1, label: 'Low (1)' },
    { value: 2, label: 'Normal (2)' },
    { value: 3, label: 'Medium (3)' },
    { value: 4, label: 'High (4)' },
    { value: 5, label: 'Critical (5)' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Case Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Case Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter case title" {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {verificationTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter case description and requirements"
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Provide detailed information about what needs to be verified
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Deduplication Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Identity & Financial Information</h3>
          <p className="text-sm text-gray-600">
            This information is used for deduplication checks to prevent duplicate cases.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABCDE1234F"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234 5678 9012"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                        field.onChange(formatted);
                      }}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankIfscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank IFSC Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABCD0123456"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      maxLength={11}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
          
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
                    <Input placeholder="Enter 6-digit pincode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Assignment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Assignment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Field User *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingUsers ? (
                        <SelectItem value="loading" disabled>Loading users...</SelectItem>
                      ) : (
                        fieldUsers?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingClients ? (
                        <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.code})
                          </SelectItem>
                        ))
                      )}
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
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions / Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any special instructions or notes for the field user"
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Optional: Add any specific instructions or important notes for the field user
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isCheckingDuplicates}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isCheckingDuplicates}>
            {isCheckingDuplicates ? (
              <>
                <Search className="h-4 w-4 mr-2 animate-spin" />
                Checking for Duplicates...
              </>
            ) : isSubmitting ? (
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

      {/* Deduplication Dialog */}
      <DeduplicationDialog
        isOpen={showDeduplicationDialog}
        onClose={() => {
          setShowDeduplicationDialog(false);
          setPendingFormData(null);
          setDeduplicationResult(null);
        }}
        deduplicationResult={deduplicationResult}
        onCreateNew={handleCreateNewCase}
        onUseExisting={handleUseExistingCase}
        isProcessing={isSubmitting}
      />
    </Form>
  );
};
