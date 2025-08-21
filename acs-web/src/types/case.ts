export type CaseStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Case {
  id: string;
  caseId?: number;
  caseNumber?: string;
  title?: string;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPincode?: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status: CaseStatus;
  verificationType?: string;
  verificationOutcome?: string;
  assignedAt?: string;
  updatedAt: string;
  createdAt: string;
  completedAt?: string;
  priority: number | string;
  notes?: string;
  trigger?: string;
  assignedToId?: string;
  assignedTo?: string; // UUID of assigned user
  assignedToName?: string; // Name of assigned user
  clientId: string | number;
  clientName?: string;
  clientCode?: string;
  productId?: string | number;
  verificationTypeId?: string | number;
  createdBy?: string;
  updatedBy?: string;
  // Applicant information
  applicantName?: string;
  applicantPhone?: string;
  applicantEmail?: string;
  applicantType?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  backendContactNumber?: string;
  createdByBackendUser?: string;
  // Deduplication fields
  deduplicationChecked?: boolean;
  deduplicationDecision?: string;
  deduplicationRationale?: string;
  // Legacy nested objects (for backward compatibility)
  client?: {
    id: string;
    name: string;
    code: string;
  };
  verificationTypeRef?: {
    id: string;
    name: string;
  };
}

export interface CaseFilters {
  status?: CaseStatus;
  search?: string;
  assignedTo?: string;
  clientId?: string;
  priority?: number;
  dateFrom?: string;
  dateTo?: string;
}
