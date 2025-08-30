import { Case, CaseStatus, VerificationType, Attachment } from '../types';
import AsyncStorage from '../polyfills/AsyncStorage';
import { migrateCasesVerificationOutcomes, isDeprecatedOutcome } from '../utils/verificationOutcomeMigration';

const LOCAL_STORAGE_KEY = 'caseflow_cases';

// Helper function to generate realistic attachments
const generateAttachments = (caseId: string, count: number): Attachment[] => {
  const baseUrl = 'https://api.caseflow.com/v1';
  const attachmentTemplates = [
    { name: 'Property_Documents.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 2048576, uploadedBy: 'System Admin' },
    { name: 'Bank_Statement.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 1536000, uploadedBy: 'Financial Analyst' },
    { name: 'Identity_Verification.jpg', type: 'image' as const, mimeType: 'image/jpeg' as const, size: 892000, uploadedBy: 'Verification Officer' },
    { name: 'Site_Photo_Exterior.png', type: 'image' as const, mimeType: 'image/png' as const, size: 1024000, uploadedBy: 'Field Agent' },
    { name: 'Legal_Agreement.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 3145728, uploadedBy: 'Legal Team' },
    { name: 'Address_Proof.jpg', type: 'image' as const, mimeType: 'image/jpeg' as const, size: 756000, uploadedBy: 'Document Specialist' },
    { name: 'Compliance_Report.pdf', type: 'pdf' as const, mimeType: 'application/pdf' as const, size: 2097152, uploadedBy: 'Compliance Officer' },
    { name: 'Building_Interior.png', type: 'image' as const, mimeType: 'image/png' as const, size: 1310720, uploadedBy: 'Site Inspector' }
  ];

  return attachmentTemplates.slice(0, count).map((template, index) => ({
    id: `att-${caseId}-${index + 1}`,
    name: template.name,
    type: template.type,
    mimeType: template.mimeType,
    size: template.size,
    url: `${baseUrl}/files/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${caseId}`,
    thumbnailUrl: template.type === 'image' ? `${baseUrl}/files/${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${caseId}-thumb` : undefined,
    uploadedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: template.uploadedBy,
    description: `${template.name} for case ${caseId}`
  }));
};

const getInitialMockData = (): Case[] => [
  // 1. Residence Verification - Positive (Assigned with 3 attachments)
  {
    id: 'RES-001',
    title: 'Residence Verification - Priya Sharma',
    description: 'Verify current residential address for personal loan application. Expected outcome: Positive verification.',
    customer: { name: 'Priya Sharma', contact: 'priya.sharma@email.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'HDFC Bank',
    product: 'Personal Loan',
    trigger: 'Address Verification',
    visitAddress: '12B, Ocean View Apartments, Marine Drive, Mumbai',
    systemContactNumber: '9876543210',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    attachments: generateAttachments('RES-001', 3)
  },
  // 2. Residence Verification - Shifted (In Progress with 2 attachments)
  {
    id: 'RES-002',
    title: 'Residence Verification - Amit Patel (Shifted)',
    description: 'Verify new residential address after recent relocation. Expected outcome: Shifted verification.',
    customer: { name: 'Amit Patel', contact: 'amit.patel@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'SBI',
    product: 'Home Loan',
    trigger: 'Address Change Verification',
    visitAddress: '78, New Colony, Sector 15, Gurgaon',
    systemContactNumber: '9876543211',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 1,
    attachments: generateAttachments('RES-002', 2)
  },

  // 3. Business Verification - Positive (Completed with 4 attachments)
  {
    id: 'BUS-001',
    title: 'Business Verification - Tech Solutions Inc.',
    description: 'Verify business operations and premises for corporate loan. Expected outcome: Positive verification.',
    customer: { name: 'Tech Solutions Inc.', contact: 'hr@techsolutions.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Business,
    verificationOutcome: 'positive',
    bankName: 'Axis Bank',
    product: 'Corporate Loan',
    trigger: 'Business Verification',
    visitAddress: 'Unit 501, Cyber Towers, Hitech City, Hyderabad',
    systemContactNumber: '9876543212',
    customerCallingCode: '+91',
    applicantStatus: 'Company',
    submissionStatus: 'success',
    attachments: generateAttachments('BUS-001', 4)
  },
  // 4. Office Verification - Positive (Assigned with 1 attachment)
  {
    id: 'OFF-001',
    title: 'Office Verification - Global Enterprises',
    description: 'Verify employee workplace and office operations. Expected outcome: Positive verification.',
    customer: { name: 'Global Enterprises', contact: 'hr@globalent.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Office,
    verificationOutcome: null,
    bankName: 'ICICI Bank',
    product: 'Personal Loan',
    trigger: 'Employment Verification',
    visitAddress: '15th Floor, Business Tower, Connaught Place, Delhi',
    systemContactNumber: '9876543213',
    customerCallingCode: '+91',
    applicantStatus: 'Employee',
    attachments: generateAttachments('OFF-001', 1)
  },

  // 5. Residence-cum-Office Verification (In Progress with 5 attachments)
  {
    id: 'RCO-001',
    title: 'Resi-cum-Office Check - Raj Kumar',
    description: 'Verify dual-use property for business loan application. Expected outcome: Positive verification.',
    customer: { name: 'Raj Kumar', contact: 'raj.kumar@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.ResidenceCumOffice,
    verificationOutcome: null,
    bankName: 'HDFC Bank',
    product: 'Business Loan',
    trigger: 'Dual Use Verification',
    visitAddress: '45, Startup Lane, Koramangala, Bengaluru',
    systemContactNumber: '9876543214',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 2,
    attachments: generateAttachments('RCO-001', 5)
  },
  // 6. Builder Verification - Positive (Completed with 3 attachments)
  {
    id: 'BLD-001',
    title: 'Builder Verification - Apex Constructions',
    description: 'Verify construction site and builder credentials. Expected outcome: Positive verification.',
    customer: { name: 'Apex Constructions', contact: 'projects@apexconst.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Builder,
    verificationOutcome: 'positive',
    bankName: 'SBI',
    product: 'Project Finance',
    trigger: 'Builder Verification',
    visitAddress: 'Plot 8, Sector 62, Noida',
    systemContactNumber: '9876543215',
    customerCallingCode: '+91',
    applicantStatus: 'Developer',
    submissionStatus: 'success',
    attachments: generateAttachments('BLD-001', 3)
  },

  // 7. Property APF Verification (Assigned with no attachments)
  {
    id: 'APF-001',
    title: 'Property APF Verification - Lotus Towers',
    description: 'Verify Approved Project Finance status for residential project. Expected outcome: Positive verification.',
    customer: { name: 'Lotus Towers Developer', contact: 'sales@lotustowers.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.PropertyAPF,
    verificationOutcome: null,
    bankName: 'Canara Bank',
    product: 'Project Finance',
    trigger: 'APF Status Verification',
    visitAddress: 'Lotus Towers project site, Airport Road, Mohali',
    systemContactNumber: '9876543216',
    customerCallingCode: '+91',
    applicantStatus: 'Developer',
    attachments: []
  },
  // 8. Property Individual Verification (In Progress with 2 attachments)
  {
    id: 'IND-001',
    title: 'Property Individual Verification - Anil Verma',
    description: 'Verify individual property ownership for mortgage application. Expected outcome: Positive verification.',
    customer: { name: 'Anil Verma', contact: 'anil.verma@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.PropertyIndividual,
    verificationOutcome: null,
    bankName: 'Bank of Baroda',
    product: 'Mortgage Loan',
    trigger: 'Property Title Verification',
    visitAddress: 'Bungalow No. 24, Jubilee Hills, Hyderabad',
    systemContactNumber: '9876543217',
    customerCallingCode: '+91',
    applicantStatus: 'Co-Applicant',
    priority: 3,
    attachments: generateAttachments('IND-001', 2)
  },

  // 9. NOC Verification (Completed with 1 attachment)
  {
    id: 'NOC-001',
    title: 'NOC Verification - Green Valley Society',
    description: 'Obtain No Objection Certificate from society management. Expected outcome: Positive verification.',
    customer: { name: 'Green Valley Society', contact: 'secretary@greenvalley.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.NOC,
    verificationOutcome: 'positive',
    bankName: 'Kotak Mahindra Bank',
    product: 'Property Sale',
    trigger: 'NOC Verification',
    visitAddress: 'Green Valley Society, MG Road, Pune',
    systemContactNumber: '9876543218',
    customerCallingCode: '+91',
    applicantStatus: 'Society',
    submissionStatus: 'success',
    attachments: generateAttachments('NOC-001', 1)
  },
  // 10. DSA/DST Connector Verification (Assigned with 4 attachments)
  {
    id: 'CON-001',
    title: 'DSA/DST Connector Verification - Quick Loans',
    description: 'Verify business premises and operations for DSA partner. Expected outcome: Positive verification.',
    customer: { name: 'Quick Loans Agency', contact: 'partner@quickloans.com' },
    status: CaseStatus.Assigned,
    isSaved: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Connector,
    verificationOutcome: null,
    bankName: 'Yes Bank',
    product: 'Partner Verification',
    trigger: 'Business Premises Check',
    visitAddress: '3rd Floor, Commercial Complex, Karol Bagh, Delhi',
    systemContactNumber: '9876543219',
    customerCallingCode: '+91',
    applicantStatus: 'Partner',
    attachments: generateAttachments('CON-001', 4)
  },

  // 11. Business Verification - NSP (Completed with submission failed)
  {
    id: 'BUS-002',
    title: 'Business Verification - Metro Traders (NSP)',
    description: 'Business verification with NSP outcome due to operational issues. Expected outcome: NSP verification.',
    customer: { name: 'Metro Traders', contact: 'info@metrotraders.com' },
    status: CaseStatus.Completed,
    isSaved: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Business,
    verificationOutcome: 'nsp',
    bankName: 'Punjab National Bank',
    product: 'Working Capital Loan',
    trigger: 'Business Verification',
    visitAddress: '17, Industrial Area, Phase 2, Chandigarh',
    systemContactNumber: '9876543220',
    customerCallingCode: '+91',
    applicantStatus: 'Proprietor',
    submissionStatus: 'failed',
    submissionError: 'Network timeout during submission',
    attachments: generateAttachments('BUS-002', 2)
  },

  // 12. Residence Verification - Entry Restricted (In Progress with 0 attachments)
  {
    id: 'RES-003',
    title: 'Residence Verification - Sunita Devi (Entry Restricted)',
    description: 'Residence verification with restricted access. Expected outcome: Entry Restricted verification.',
    customer: { name: 'Sunita Devi', contact: 'sunita.devi@email.com' },
    status: CaseStatus.InProgress,
    isSaved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    inProgressAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verificationType: VerificationType.Residence,
    verificationOutcome: null,
    bankName: 'Union Bank',
    product: 'Personal Loan',
    trigger: 'Address Verification',
    visitAddress: '23, Restricted Colony, Sector 8, Faridabad',
    systemContactNumber: '9876543221',
    customerCallingCode: '+91',
    applicantStatus: 'Applicant',
    priority: 4,
    attachments: []
  },
].map((c, index) => ({
  ...c,
  order: index
}));

class CaseService {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
      const existingData = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (!existingData) {
          await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getInitialMockData()));
      }
  }

  private async readFromStorage(): Promise<Case[]> {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private async writeToStorage(cases: Case[]): Promise<void> {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
  }

  async getCases(): Promise<Case[]> {
    const cases = await this.readFromStorage();

    // Apply verification outcome migration for any deprecated outcomes
    const migratedCases = migrateCasesVerificationOutcomes(cases);

    // If any cases were migrated, save the updated data
    const hasMigrations = migratedCases.some((migratedCase, index) =>
      migratedCase.verificationOutcome !== cases[index].verificationOutcome
    );

    if (hasMigrations) {
      console.log('Verification outcome migrations applied, saving updated cases...');
      await this.writeToStorage(migratedCases);
    }

    return migratedCases;
  }

  async getCase(id: string): Promise<Case | undefined> {
    const cases = await this.readFromStorage();
    return cases.find(c => c.id === id);
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case> {
    const cases = await this.readFromStorage();
    const caseIndex = cases.findIndex(c => c.id === id);
    if (caseIndex === -1) {
      throw new Error('Case not found');
    }
    const updatedCase = { ...cases[caseIndex], ...updates, updatedAt: new Date().toISOString() };
    cases[caseIndex] = updatedCase;
    await this.writeToStorage(cases);
    return updatedCase;
  }
  
  async revokeCase(id: string, reason: string): Promise<void> {
    const cases = await this.readFromStorage();
    const updatedCases = cases.filter(c => c.id !== id);
    console.log(`Case ${id} revoked. Reason: ${reason}. Simulating sending to server.`);
    await this.writeToStorage(updatedCases);
  }

  async syncWithServer(): Promise<Case[]> {
    console.log("Simulating sync with server...");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency

    const localCases = await this.readFromStorage();

    // In a real app, this would fetch new/updated cases from a server
    // and merge them with local data. For this demo, we'll just log.

    console.log("Sync complete. No new data from server.");
    return localCases;
  }

  async submitCase(id: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Attempting to submit case ${id} to server...`);

    try {
      // Update case status to submitting
      await this.updateCase(id, {
        submissionStatus: 'submitting',
        lastSubmissionAttempt: new Date().toISOString()
      });

      // Simulate network request with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 20% failure rate for testing
          if (Math.random() < 0.2) {
            reject(new Error('Network timeout - please check your connection and try again'));
          } else {
            resolve(true);
          }
        }, 2000); // Simulate network latency
      });

      // Mark as successfully submitted
      await this.updateCase(id, {
        submissionStatus: 'success',
        submissionError: undefined,
        isSaved: false // Clear saved status since it's now submitted
      });

      console.log(`Case ${id} submitted successfully`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Mark as failed submission
      await this.updateCase(id, {
        submissionStatus: 'failed',
        submissionError: errorMessage
      });

      console.error(`Case ${id} submission failed:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async resubmitCase(id: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Re-attempting to submit case ${id}...`);
    return this.submitCase(id);
  }
}

export const caseService = new CaseService();
