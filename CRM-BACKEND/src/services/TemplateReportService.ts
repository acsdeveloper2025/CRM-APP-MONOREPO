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
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {House_Status}. Met with {Met_Person_Name} {Met_Person_Relation} {Applicant_Status}, confirmed {Met_Person_Name} stay and provide the details and also confirmed {Met_Person_Name} is staying at given address since {Staying_Period} {Staying_Status}. The area of premises is approx. {Approx_Area_Sq_Feet}. Total family members are {Total_Family_Members} and earning members are {Total_Earning}. {Met_Person_Name} is {Working_Status} {Company_Name}. The door name plate is {Door_Name_Plate} {Name_on_Door_Plate} and also name on Society board is {Society_Name_Plate} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality}. {Locality} is of {Address_Structure_G_Plus} and {Met_Person_Name} is staying on {Applicant_Staying_Floor} floor. {Locality} color is {Address_Structure_Color}. The Door color is {Door_Color}. Residence set up is sighted at the time of visit. During visit met person shown {Document_Type}. TPC {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} {Met_Person_Name} name and stay. TPC {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Met_Person_Name} name and stay. Landmarks: {Landmark_1} and {Landmark_2}. It is {Dominated_Area} area. {Feedback_from_Neighbour} feedback received from neighbors. Field executive also confirmed {Met_Person_Name} is {Political_Connection}. {Met_Person_Name} stay is confirmed by our executive's observation as well as from TPC. Field Executive Observation: {Other_Observation} Hence the profile is marked as {Final_Status}.`,

    'POSITIVE_DOOR_ACCESSIBLE': `Residence Remark: POSITIVE.
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit met with {Met_Person_Name} {Met_Person_Relation} {Applicant_Status}, confirmed {Met_Person_Name} stay and provide the details and also confirmed {Met_Person_Name} is staying at given address since {Staying_Period} {Staying_Status}. The area of premises is approx. {Approx_Area_Sq_Feet}. Total family members are {Total_Family_Members} and earning members are {Total_Earning}. {Met_Person_Name} is {Working_Status} {Company_Name}. The door name plate is {Door_Name_Plate} {Name_on_Door_Plate} and also name on Society board is {Society_Name_Plate} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality}. {Locality} is of {Address_Structure_G_Plus} and {Met_Person_Name} is staying on {Applicant_Staying_Floor} floor. {Locality} color is {Address_Structure_Color}. The Door color is {Door_Color}. Residence set up is sighted at the time of visit. During visit met person shown {Document_Type}. TPC {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} {Met_Person_Name} name and stay. TPC {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Met_Person_Name} name and stay. Landmarks: {Landmark_1} and {Landmark_2}. It is {Dominated_Area} area. {Feedback_from_Neighbour} feedback received from neighbors. Field executive also confirmed {Met_Person_Name} is {Political_Connection}. {Met_Person_Name} stay is confirmed by our executive's observation as well as from TPC. Field Executive Observation: {Other_Observation} Hence the profile is marked as {Final_Status}.`,

    'SHIFTED': `Residence Remark: (Shifted) :-
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {House_Status}. Met with {Met_Person_Name} {Met_Person_Relation} informed that {Customer_Name} is shifted to another address since last {Shifted_Period}. The door name plate is {Door_Name_Plate_Status} {Name_on_Door_Plate} and also name on Society board is {Society_Name_Plate_Status} {Name_on_Society_Board}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they have informed that {Customer_Name} is shifted from the given address. Locality is Residential & type of locality is {Locality_Type}. {Locality_Type} is of {Address_Structure} and address located on {Address_Floor} floor. {Locality_Type} color is {Address_Structure_Color}. The Door color is {Door_Color}. It's a {Dominated_Area} area.
Landmarks: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback received from neighbors.
Field executive also confirmed {Customer_Name} is {Political_Connection}.
Field Executive Observation :- {Other_Observation}.
Hence the profile is marked as {Final_Status}.`,

    'SHIFTED_DOOR_LOCKED': `Residence Remark: (Door Lock & Shifted) :-
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {House_Status}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they have informed that {Customer_Name} is shifted from the given address from last {Shifted_Period}. At present given premises is {Premises_Status}. The door name plate is {Door_Name_Plate_Status} {Name_on_Door_Plate} and also Society board is {Society_Name_Plate_Status} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality_Type}. {Locality_Type} is of {Address_Structure} and address located on {Address_Floor} floor.
{Locality_Type} color is {Address_Structure_Color}. The Door color is {Door_Color}.
It's a {Dominated_Area} area.
Landmarks: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback received from neighbors. Field executive also confirmed {Customer_Name} is {Political_Connection}.
Field Executive Observation :- {Other_Observation}.
Hence the profile is marked as {Final_Status}.`,

    'ERT': `Residence Entry Restricted Remark (ERT):-
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. It is {Customer_Name} address. At the time of visit met with {Met_Person_Name} {Name_of_Met_Person} informed that in given premises entry is not allowed. {Met_Person_Name} {Met_Person_Confirmation} {Applicant_Staying_Status} given address. Society board is {Society_Name_Plate_Status} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality_Type}.
{Locality_Type} is of {Address_Structure} and address located on {Applicant_Staying_Floor}.
{Locality_Type} color is {Address_Structure_Color}.
It's a {Address_Structure_Color} area.
Landmarks: {Landmark_1} and {Landmark_2}.
{Feedback_from_Neighbour} feedback received from met person.
Also executive confirmed about customer {Feedback_from_Neighbour}.
Field Executive Observation :- {Other_Observation}
Hence the profile is marked as {Final_Status}`,

    'UNTRACEABLE': `Residence Untraceable Remark (UT):-
Visited at the given address {ADDRESS}. The given address is incorrect and untraceable. At the time of visit met with {Met_Person_Name}, Met person informed that provided address is short. We called {Customer_Name} but {Customer_Name} {Call_Remark}. We required proper guidance to trace the address. Type of Locality is {Locality_Type}. Field executive reached up to {Landmark_1}, {Landmark_2}, {Landmark_3}, {Landmark_4}. It's a {Dominated_Area} area.
Field Executive Observation :- {Other_Observation}.
Hence the profile is marked as {Final_Status}.`,

    'NSP': `Residence No Such Person Remark (NSP):-
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {House_Status}.
Met with {Met_Person_Name} {Met_Person_Status} informed that there is no such person staying at given address. Met person staying at given address from last {Staying_Period}. The door name plate is {Door_Name_Plate_Status} {Name_on_Door_Plate} and Society board is {Society_Name_Plate_Status} {Name_on_Society_Board}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they have informed there is no such person staying at given address.
Locality is Residential & type of locality is {Locality_Type}. {Locality_Type} is of {Address_Structure} and address is on {Applicant_Staying_Floor} floor.
{Locality_Type} color is {Address_Structure_Color}.
The Door color is {Door_Color}.
Landmarks: {Landmark_1} and {Landmark_2}.
It's a {Dominated_Area} area.
Applicant's stability is not confirmed from our executive's observation as well as from TPC.
Field Executive Observation :- {Other_Observation}.
Hence the profile is marked as {Final_Status}.`,

    'NSP_DOOR_LOCKED': `Residence No Such Person Door Locked Remark (NSP-DL):-
Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {House_Status}.
TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they have informed that there is no such person staying at given address.
As per TPC confirmation {Staying_Person_Name} is staying at given address.
The door name plate is {Door_Name_Plate_Status} {Name_on_Door_Plate} and a Society board is {Society_Name_Plate_Status} {Name_on_Society_Board}. Locality is Residential & type of locality is {Locality_Type}. {Locality_Type} is of {Address_Structure} and the address is on {Applicant_Staying_Floor} floor.
{Locality_Type} color is {Address_Structure_Color}.
The Door color is {Door_Color}.
Landmarks: {Landmark_1} and {Landmark_2}.
It's a {Dominated_Area} area.
Applicant's stability is not confirmed from our executive's observation as well as from TPC.
Field Executive Observation: - {Other_Observation}.
Hence the profile is marked as {Final_Status}.`
  };

  private readonly OFFICE_TEMPLATES = {
    'POSITIVE': `Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit office was {Office_Status}. Met with {Met_Person_Name} {Designation}, confirmed {Applicant_Status} is working in given office since last {Working_Period} as {Applicant_Designation}. {Applicant_Status} working on {Applicant_Designation} & sitting at {Applicant_Working_Premises} {Sitting_Location}. It's a {Office_Type} and nature of business is {Company_Nature_Of_Business}. Total strength of the staff is {Staff_Strength} & seen {Staff_Seen}. Office area approx. {Office_Approx_Area} Sq. feet. Company Name board {Company_Name_Plate} {Name_On_Board}.
Locality is {Locality}. {Locality} is of {Address_Structure}. {Locality} color is {Address_Structure_Color} and Door color is {Door_Color}.
TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} and {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Applicant_Status} & office existence.
It is {Dominated_Area} area.
Landmarks: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback found against {Applicant_Status} & his firm.
Field executive also confirmed {Applicant_Status} is {Political_Connection}.
{Applicant_Status} stability is confirmed by our executive's observation as well as from TPC.
Field Executive Observation: {Other_Observation}
Hence the profile is marked as {Final_Status}.`,

    'POSITIVE_DOOR_LOCKED': `Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit office was {Office_Status}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} {TPC_Confirmation_1} and {TPC_Met_Person_2} {Name_of_TPC_2} {TPC_Confirmation_2} {Applicant_Status} & office existence.
They informed that given office at given address since last {Address_Structure}. Company Name board {Company_Name_Plate} {Name_On_Board}. Locality is {Locality}. {Locality} is of {Address_Structure}. {Locality} color is {Address_Structure_Color} and Door color is {Door_Color}.
It is {Dominated_Area} area.
Landmark: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback received from neighbors.
Field executive also confirmed {Applicant_Status} is {Political_Connection}.
Field Executive Observation: {Other_Observation}.
Hence the profile is marked as {Final_Status}.`,

    'SHIFTED': `Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {Office_Status}. Met with {Met_Person_Name} {Designation} confirmed that company shifted from the given address {Old_Office_Shifted_Period} ago. {Current_Company_Name} Company operating business at given address from last {Current_Company_Period}. Company name board is {Company_Name_Plate} {Name_On_Board}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they confirmed that company is shifted from the given address on {Old_Office_Shifted_Period} ago. Locality is {Locality}. {Locality} is of {Address_Structure}. {Locality} color is {Address_Structure_Color} and Door color is {Door_Color}.
It is {Dominated_Area} area.
Landmark: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback received from neighbors.
Field executive also confirmed {Applicant_Status} is {Political_Connection}.
Field Executive Observation: {Other_Observation}
Hence the profile is marked as {Final_Status}.`,

    'SHIFTED_DOOR_LOCKED': `Visited at the given address {ADDRESS}. The given address is traceable and {Address_Locatable}. Address locality is {Address_Rating}. At the time of visit door was {Office_Status}. TPC done with {TPC_Met_Person_1} {Name_of_TPC_1} and {TPC_Met_Person_2} {Name_of_TPC_2} they confirmed that company shifted from the given address {Old_Office_Shifted_Period} ago. {Current_Company_Name} Company operating business at given address. Company name board is {Company_Name_Plate} {Name_On_Board}. Locality is {Locality}. {Locality} is of {Address_Structure}. {Locality} color is {Address_Structure_Color} and Door color is {Door_Color}.
It is {Dominated_Area} area.
Landmarks: {Landmark_1} and {Landmark_2}.
{Feedback_From_Neighbour} feedback from neighbors.
Field executive also confirmed {Applicant_Status} is {Political_Connection}.
Field Executive Observation: {Other_Observation}
Hence the profile is marked as {Final_Status}.`
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
      const template = this.getTemplate(data.verificationType, data.outcome, data.formData);
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
        templateUsed: this.getTemplateKey(data.verificationType, data.outcome, data.formData)
      });

      return {
        success: true,
        report: populatedTemplate,
        metadata: {
          verificationType: data.verificationType,
          outcome: data.outcome,
          generatedAt: new Date().toISOString(),
          templateUsed: this.getTemplateKey(data.verificationType, data.outcome, data.formData)
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
  private getTemplate(verificationType: string, outcome: string, formData?: any): string | null {
    const templateKey = this.getTemplateKey(verificationType, outcome, formData);

    if (verificationType.toUpperCase() === 'RESIDENCE') {
      return this.RESIDENCE_TEMPLATES[templateKey] || null;
    }

    if (verificationType.toUpperCase() === 'OFFICE') {
      return this.OFFICE_TEMPLATES[templateKey] || null;
    }

    // Add other verification types here as needed
    return null;
  }

  /**
   * Get template key based on verification type and outcome
   */
  private getTemplateKey(verificationType: string, outcome: string, formData?: any): string {
    const outcomeNormalized = outcome.toLowerCase();

    if (verificationType.toUpperCase() === 'RESIDENCE') {
      // Handle Shifted scenarios
      if (outcomeNormalized.includes('shifted')) {
        if (outcomeNormalized.includes('door lock') || outcomeNormalized.includes('door locked') || outcomeNormalized.includes('locked')) {
          return 'SHIFTED_DOOR_LOCKED';
        } else {
          return 'SHIFTED';
        }
      }

      // Handle ERT scenarios
      if (outcomeNormalized.includes('ert') || outcomeNormalized === 'ert') {
        return 'ERT';
      }

      // Handle Untraceable scenarios
      if (outcomeNormalized.includes('untraceable') || outcomeNormalized === 'untraceable') {
        return 'UNTRACEABLE';
      }

      // Handle NSP scenarios
      if (outcomeNormalized.includes('nsp')) {
        if (outcomeNormalized.includes('door lock') || outcomeNormalized.includes('door locked') || outcomeNormalized.includes('locked')) {
          return 'NSP_DOOR_LOCKED';
        } else {
          return 'NSP';
        }
      }

      // Handle Positive scenarios
      if (outcomeNormalized.includes('positive')) {
        if (outcomeNormalized.includes('door locked') || outcomeNormalized.includes('locked')) {
          return 'POSITIVE_DOOR_LOCKED';
        } else {
          return 'POSITIVE_DOOR_ACCESSIBLE';
        }
      }
    }

    if (verificationType.toUpperCase() === 'OFFICE') {
      // Handle Shifted scenarios - use office status to determine template
      if (outcomeNormalized.includes('shifted')) {
        const officeStatus = formData?.officeStatus || formData?.office_status;
        if (officeStatus && officeStatus.toLowerCase() === 'opened') {
          return 'SHIFTED'; // Office was open, person was met
        } else {
          return 'SHIFTED_DOOR_LOCKED'; // Office was closed, only TPC
        }
      }

      // Handle ERT scenarios
      if (outcomeNormalized.includes('ert') || outcomeNormalized === 'ert') {
        return 'ERT';
      }

      // Handle Untraceable scenarios
      if (outcomeNormalized.includes('untraceable') || outcomeNormalized === 'untraceable') {
        return 'UNTRACEABLE';
      }

      // Handle NSP scenarios
      if (outcomeNormalized.includes('nsp')) {
        if (outcomeNormalized.includes('door lock') || outcomeNormalized.includes('door locked') || outcomeNormalized.includes('locked')) {
          return 'NSP_DOOR_LOCKED';
        } else {
          return 'NSP';
        }
      }

      // Handle Positive scenarios - use office status to determine template
      if (outcomeNormalized.includes('positive')) {
        // Check office status to determine if person was met or only TPC was done
        const officeStatus = formData?.officeStatus || formData?.office_status;
        if (officeStatus && officeStatus.toLowerCase() === 'opened') {
          return 'POSITIVE'; // Office was open, person was met
        } else {
          return 'POSITIVE_DOOR_LOCKED'; // Office was closed, only TPC
        }
      }
    }

    return 'DEFAULT';
  }

  /**
   * Map form data to template variables for verification reports
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
      Met_Person_Name: safeGet(formData, 'metPersonName') || safeGet(formData, 'personMet') || safeGet(formData, 'met_person_name'),
      Applicant_Status: caseDetails.customerName || safeGet(formData, 'customerName') || safeGet(formData, 'applicantStatus') || 'Applicant',
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
      Landmark_3: safeGet(formData, 'landmark3') || safeGet(formData, 'nearbyLandmark3') || 'Not provided',
      Landmark_4: safeGet(formData, 'landmark4') || safeGet(formData, 'nearbyLandmark4') || 'Not provided',
      
      // Area assessment
      Dominated_Area: safeGet(formData, 'dominatedArea'),
      Feedback_from_Neighbour: safeGet(formData, 'feedbackFromNeighbour') || safeGet(formData, 'neighborFeedback'),
      Political_Connection: safeGet(formData, 'politicalConnection'),
      Other_Observation: safeGet(formData, 'otherObservation') || safeGet(formData, 'remarks') || safeGet(formData, 'verifierComments'),
      Final_Status: safeGet(formData, 'finalStatus') || safeGet(formData, 'verificationOutcome') || 'Positive',

      // Call-related fields for Untraceable template
      Call_Remark: safeGet(formData, 'callRemark') || safeGet(formData, 'phoneCallRemark') || 'did not respond',

      // NSP-specific fields
      Staying_Person_Name: safeGet(formData, 'stayingPersonName') || safeGet(formData, 'actualResidentName') || 'Not provided',

      // Additional variables for shifted templates
      Customer_Name: caseDetails.customerName || safeGet(formData, 'customerName') || 'Customer',
      House_Status: safeGet(formData, 'houseStatus') || safeGet(formData, 'doorStatus'),
      Shifted_Period: safeGet(formData, 'shiftedPeriod') || safeGet(formData, 'shiftingSince'),
      Door_Name_Plate_Status: safeGet(formData, 'doorNamePlateStatus'),
      Society_Name_Plate_Status: safeGet(formData, 'societyNamePlateStatus'),
      Locality_Type: safeGet(formData, 'localityType') || safeGet(formData, 'locality'),
      Address_Structure: safeGet(formData, 'addressStructure'),
      Address_Floor: safeGet(formData, 'addressFloor') || safeGet(formData, 'floor'),
      Feedback_From_Neighbour: safeGet(formData, 'feedbackFromNeighbour') || safeGet(formData, 'neighborFeedback'),
      Premises_Status: safeGet(formData, 'premisesStatus') || safeGet(formData, 'currentPremisesStatus'),

      // Office-specific variables
      Office_Status: safeGet(formData, 'officeStatus') || safeGet(formData, 'office_status'),
      Designation: safeGet(formData, 'designation') || safeGet(formData, 'metPersonDesignation'),
      Working_Period: safeGet(formData, 'workingPeriod') || safeGet(formData, 'working_period'),
      Applicant_Designation: safeGet(formData, 'applicantDesignation') || safeGet(formData, 'applicant_designation'),
      Applicant_Working_Premises: safeGet(formData, 'applicantWorkingPremises') || safeGet(formData, 'applicant_working_premises'),
      Sitting_Location: safeGet(formData, 'sittingLocation') || safeGet(formData, 'sitting_location'),
      Office_Type: safeGet(formData, 'officeType') || safeGet(formData, 'office_type'),
      Company_Nature_Of_Business: safeGet(formData, 'companyNatureOfBusiness') || safeGet(formData, 'company_nature_of_business'),
      Staff_Strength: safeGet(formData, 'staffStrength') || safeGet(formData, 'staff_strength'),
      Staff_Seen: safeGet(formData, 'staffSeen') || safeGet(formData, 'staff_seen'),
      Office_Approx_Area: safeGet(formData, 'officeApproxArea') || safeGet(formData, 'office_approx_area'),
      Company_Name_Plate: safeGet(formData, 'companyNamePlateStatus') || safeGet(formData, 'company_nameplate_status'),
      Name_On_Board: safeGet(formData, 'nameOnCompanyBoard') || safeGet(formData, 'name_on_company_board'),

      // Office SHIFTED-specific variables
      Old_Office_Shifted_Period: safeGet(formData, 'oldOfficeShiftedPeriod') || safeGet(formData, 'old_office_shifted_period') || safeGet(formData, 'shiftedPeriod'),
      Current_Company_Name: safeGet(formData, 'currentCompanyName') || safeGet(formData, 'current_company_name') || safeGet(formData, 'companyName'),
      Current_Company_Period: safeGet(formData, 'currentCompanyPeriod') || safeGet(formData, 'current_company_period') || safeGet(formData, 'establishmentPeriod')
    };
  }
}

export const templateReportService = new TemplateReportService();
