import { logger } from '../utils/logger';

/**
 * Template-based Report Generation Service
 * Generates structured reports using predefined templates for different verification types and outcomes
 */

export interface TemplateReportResult {
  success: boolean;
  report?: string;
  error?: string;
  metadata?: {
    verificationType: string;
    outcome: string;
    generatedAt: string;
    templateUsed: string;
  };
}

export interface VerificationReportData {
  verificationType: string;
  outcome: string;
  formData: any;
  caseDetails: {
    caseId: string;
    customerName: string;
    address: string;
  };
}

export class TemplateReportService {
  private readonly RESIDENCE_TEMPLATES = {
    'POSITIVE_DOOR_LOCKED': `Residence Remark: POSITIVE.
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit met with {Met_Person_Name} {Met_Person_Relation} {Applicant_Status}, confirmed {Met_Person_Name} stay and provide the details and also confirmed {Met_Person_Name} is staying at given address since {Staying_Period} {Staying_Status}. The area of premises is approx. {Approx_Area_Sq_Feet}. Total family members are {Total_Family_Members} and earning members are {Total_Earning}. {Met_Person_Name} is {Working_Status} {Company_Name}. The door name plate is {Door_Name_Plate} {Name_on_Door_Plate} and also name on Society board is {Society_Name_Plate} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality}. {Locality} is of {Address_Structure_G_Plus} and {Met_Person_Name} is staying on {Applicant_Staying_Floor} floor. {Locality} color is {Address_Structure_Color}. The Door color is {Door_Color}. Residence set up is sighted at the time of visit. During visit met person shown {Document_Type}. TPC {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} {Met_Person_Name} name and stay. TPC {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Met_Person_Name} name and stay. Landmarks: {Landmark_1} and {Landmark_2}. It is {Dominated_Area} area. {Feedback_from_Neighbour} feedback received from neighbors. Field executive also confirmed {Met_Person_Name} is {Political_Connection}. {Met_Person_Name} stay is confirmed by our executive's observation as well as from TPC. Field Executive Observation: {Other_Observation} Hence the profile is marked as {Final_Status}.`,

    'POSITIVE_DOOR_ACCESSIBLE': `Residence Remark: POSITIVE.
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit met with {Met_Person_Name} {Met_Person_Relation} {Applicant_Status}, confirmed {Met_Person_Name} stay and provide the details and also confirmed {Met_Person_Name} is staying at given address since {Staying_Period} {Staying_Status}. The area of premises is approx. {Approx_Area_Sq_Feet}. Total family members are {Total_Family_Members} and earning members are {Total_Earning}. {Met_Person_Name} is {Working_Status} {Company_Name}. The door name plate is {Door_Name_Plate} {Name_on_Door_Plate} and also name on Society board is {Society_Name_Plate} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality}. {Locality} is of {Address_Structure_G_Plus} and {Met_Person_Name} is staying on {Applicant_Staying_Floor} floor. {Locality} color is {Address_Structure_Color}. The Door color is {Door_Color}. Residence set up is sighted at the time of visit. During visit met person shown {Document_Type}. TPC {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} {Met_Person_Name} name and stay. TPC {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Met_Person_Name} name and stay. Landmarks: {Landmark_1} and {Landmark_2}. It is {Dominated_Area} area. {Feedback_from_Neighbour} feedback received from neighbors. Field executive also confirmed {Met_Person_Name} is {Political_Connection}. {Met_Person_Name} stay is confirmed by our executive's observation as well as from TPC. Field Executive Observation: {Other_Observation} Hence the profile is marked as {Final_Status}.`
  };

  /**
   * Generate template-based report for verification form submission
   */
  async generateTemplateReport(data: VerificationReportData): Promise<TemplateReportResult> {
    try {
      logger.info('Generating template-based report', {
        verificationType: data.verificationType,
        outcome: data.outcome,
        caseId: data.caseDetails.caseId
      });

      // Get appropriate template
      const template = this.getTemplate(data.verificationType, data.outcome);
      if (!template) {
        throw new Error(`No template found for ${data.verificationType} - ${data.outcome}`);
      }

      // Map form data to template variables
      const templateVariables = this.mapFormDataToTemplateVariables(data.formData, data.caseDetails);
      
      // Replace template variables with actual data
      let populatedTemplate = template;
      Object.entries(templateVariables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        populatedTemplate = populatedTemplate.replace(new RegExp(placeholder, 'g'), value);
      });

      logger.info('Template-based report generated successfully', {
        caseId: data.caseDetails.caseId,
        templateUsed: this.getTemplateKey(data.verificationType, data.outcome)
      });

      return {
        success: true,
        report: populatedTemplate,
        metadata: {
          verificationType: data.verificationType,
          outcome: data.outcome,
          generatedAt: new Date().toISOString(),
          templateUsed: this.getTemplateKey(data.verificationType, data.outcome)
        }
      };

    } catch (error) {
      logger.error('Error generating template-based report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get template for specific verification type and outcome
   */
  private getTemplate(verificationType: string, outcome: string): string | null {
    const templateKey = this.getTemplateKey(verificationType, outcome);
    
    if (verificationType.toUpperCase() === 'RESIDENCE') {
      return this.RESIDENCE_TEMPLATES[templateKey] || null;
    }
    
    // Add other verification types here as needed
    return null;
  }

  /**
   * Get template key based on verification type and outcome
   */
  private getTemplateKey(verificationType: string, outcome: string): string {
    if (verificationType.toUpperCase() === 'RESIDENCE') {
      // Determine template based on outcome and door status
      if (outcome.toLowerCase().includes('positive')) {
        if (outcome.toLowerCase().includes('door locked') || outcome.toLowerCase().includes('locked')) {
          return 'POSITIVE_DOOR_LOCKED';
        } else {
          return 'POSITIVE_DOOR_ACCESSIBLE';
        }
      }
    }
    
    return 'DEFAULT';
  }

  /**
   * Map form data to template variables for residence verification
   */
  private mapFormDataToTemplateVariables(formData: any, caseDetails: any): Record<string, string> {
    const safeGet = (obj: any, key: string, defaultValue: string = 'Not provided') => {
      return obj?.[key] || obj?.[key.toLowerCase()] || obj?.[key.replace(/([A-Z])/g, '_$1').toLowerCase()] || defaultValue;
    };

    return {
      // Address and basic info
      ADDRESS: caseDetails.address || 'Address not provided',
      Address_Locatable: safeGet(formData, 'addressLocatable'),
      Address_Rating: safeGet(formData, 'addressRating'),
      
      // Person details
      Met_Person_Name: safeGet(formData, 'metPersonName') || safeGet(formData, 'personMet'),
      Applicant_Status: safeGet(formData, 'applicantStatus') || 'Applicant',
      Met_Person_Relation: safeGet(formData, 'metPersonRelation') || safeGet(formData, 'relation'),
      
      // Staying details
      Staying_Period: safeGet(formData, 'stayingPeriod') || safeGet(formData, 'stayingSince'),
      Staying_Status: safeGet(formData, 'stayingStatus'),
      
      // Property details
      Approx_Area_Sq_Feet: safeGet(formData, 'approxAreaSqFeet') || safeGet(formData, 'approximateArea'),
      Total_Family_Members: safeGet(formData, 'totalFamilyMembers') || safeGet(formData, 'familyMembers'),
      Total_Earning: safeGet(formData, 'totalEarning') || safeGet(formData, 'earningMembers'),
      
      // Work details
      Working_Status: safeGet(formData, 'workingStatus'),
      Company_Name: safeGet(formData, 'companyName') || safeGet(formData, 'employerName'),
      
      // Name plates and boards
      Door_Name_Plate: safeGet(formData, 'doorNamePlateStatus') === 'Sighted' ? 'Available' : 'Not Available',
      Name_on_Door_Plate: safeGet(formData, 'nameOnDoorPlate') || safeGet(formData, 'doorNamePlate'),
      Society_Name_Plate: safeGet(formData, 'societyNamePlateStatus') === 'Sighted' ? 'Available' : 'Not Available',
      Name_on_Society_Board: safeGet(formData, 'nameOnSocietyBoard') || safeGet(formData, 'societyNamePlate'),
      
      // Locality details
      Locality: safeGet(formData, 'locality') || safeGet(formData, 'localityType'),
      Address_Structure_G_Plus: safeGet(formData, 'addressStructure') || safeGet(formData, 'addressStructureGPlus'),
      Applicant_Staying_Floor: safeGet(formData, 'applicantStayingFloor') || safeGet(formData, 'floor'),
      Address_Structure_Color: safeGet(formData, 'addressStructureColor') || safeGet(formData, 'buildingColor'),
      Door_Color: safeGet(formData, 'doorColor'),
      
      // Documents
      Document_Type: safeGet(formData, 'documentType'),
      
      // TPC details
      TPC_Met_Person_1: safeGet(formData, 'tpcMetPerson1') || safeGet(formData, 'tpcMetPerson'),
      Name_of_TPC_1: safeGet(formData, 'tpcName1') || safeGet(formData, 'nameOfTpc1'),
      TPC_Confirmation_1: safeGet(formData, 'tpcConfirmation1') || safeGet(formData, 'tpcConfirmation'),
      TPC_Met_Person_2: safeGet(formData, 'tpcMetPerson2'),
      Name_of_TPC_2: safeGet(formData, 'tpcName2') || safeGet(formData, 'nameOfTpc2'),
      TPC_Confirmation_2: safeGet(formData, 'tpcConfirmation2'),
      
      // Landmarks
      Landmark_1: safeGet(formData, 'landmark1') || safeGet(formData, 'nearbyLandmark1'),
      Landmark_2: safeGet(formData, 'landmark2') || safeGet(formData, 'nearbyLandmark2'),
      
      // Area assessment
      Dominated_Area: safeGet(formData, 'dominatedArea'),
      Feedback_from_Neighbour: safeGet(formData, 'feedbackFromNeighbour') || safeGet(formData, 'neighborFeedback'),
      Political_Connection: safeGet(formData, 'politicalConnection'),
      Other_Observation: safeGet(formData, 'otherObservation') || safeGet(formData, 'remarks') || safeGet(formData, 'verifierComments'),
      Final_Status: safeGet(formData, 'finalStatus') || safeGet(formData, 'verificationOutcome') || 'Positive'
    };
  }
}

export const templateReportService = new TemplateReportService();
