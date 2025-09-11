import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export interface VerificationReportData {
  verificationType: string;
  outcome: string;
  formData: any;
  caseDetails: {
    caseId: string;
    customerName: string;
    address: string;
    verificationDate: string;
    agentName: string;
  };
  geoLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos?: Array<{
    type: string;
    metadata?: any;
  }>;
  metadata?: any;
}

export interface AIReportResult {
  success: boolean;
  report?: {
    executiveSummary: string;
    keyFindings: string[];
    verificationDetails: string;
    riskAssessment: string;
    recommendations: string[];
    conclusion: string;
    confidence: number;
  };
  error?: string;
}

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate comprehensive AI report for verification form submission
   */
  async generateVerificationReport(data: VerificationReportData): Promise<AIReportResult> {
    try {
      logger.info('Generating AI verification report', {
        verificationType: data.verificationType,
        outcome: data.outcome,
        caseId: data.caseDetails.caseId
      });

      const prompt = this.buildReportPrompt(data);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the structured response
      const parsedReport = this.parseAIResponse(text);

      logger.info('AI verification report generated successfully', {
        caseId: data.caseDetails.caseId,
        confidence: parsedReport.confidence
      });

      return {
        success: true,
        report: parsedReport
      };

    } catch (error) {
      logger.error('Error generating AI verification report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Build comprehensive prompt for Gemini AI
   */
  private buildReportPrompt(data: VerificationReportData): string {
    const { verificationType, outcome, formData, caseDetails, geoLocation, photos } = data;

    return `
You are an expert verification analyst tasked with generating a comprehensive verification report. Analyze the provided data and create a professional, detailed report.

**CASE INFORMATION:**
- Case ID: ${caseDetails.caseId}
- Customer Name: ${caseDetails.customerName}
- Address: ${caseDetails.address}
- Verification Type: ${verificationType}
- Verification Outcome: ${outcome}
- Verification Date: ${caseDetails.verificationDate}
- Field Agent: ${caseDetails.agentName}

**LOCATION DATA:**
${geoLocation ? `- Coordinates: ${geoLocation.latitude}, ${geoLocation.longitude}
- Captured Address: ${geoLocation.address || 'Not available'}` : '- Location data not available'}

**PHOTO EVIDENCE:**
${photos && photos.length > 0 ? `- Total Photos: ${photos.length}
- Photo Types: ${photos.map(p => p.type).join(', ')}` : '- No photos captured'}

**FORM DATA ANALYSIS:**
${this.formatFormDataForPrompt(formData, verificationType)}

**INSTRUCTIONS:**
Generate a comprehensive verification report in the following JSON format. Ensure all analysis is based on the provided data and follows professional verification standards.

{
  "executiveSummary": "Brief 2-3 sentence summary of the verification outcome and key findings",
  "keyFindings": [
    "List of 3-5 key findings from the verification",
    "Each finding should be specific and evidence-based"
  ],
  "verificationDetails": "Detailed analysis of the verification process, what was verified, who was met, documents checked, etc. (200-300 words)",
  "riskAssessment": "Professional risk assessment based on findings - categorize as LOW, MEDIUM, or HIGH risk with justification (150-200 words)",
  "recommendations": [
    "List of 2-4 actionable recommendations",
    "Based on the verification outcome and risk assessment"
  ],
  "conclusion": "Final conclusion with clear verification status and any follow-up actions needed (100-150 words)",
  "confidence": 85
}

**IMPORTANT GUIDELINES:**
1. Base analysis only on provided data - do not make assumptions
2. Use professional, objective language
3. Highlight any discrepancies or concerns found
4. Consider verification type-specific factors (residence vs office vs business etc.)
5. Factor in the outcome status (Positive, Shifted, NSP, ERT, Untraceable)
6. Confidence score should be 70-95 based on data completeness and verification quality
7. Ensure JSON format is valid and complete

Generate the report now:`;
  }

  /**
   * Format form data for AI prompt based on verification type
   */
  private formatFormDataForPrompt(formData: any, verificationType: string): string {
    if (!formData) return 'No form data available';

    let formatted = '';
    
    // Common fields across all verification types
    if (formData.addressLocatable) formatted += `- Address Locatable: ${formData.addressLocatable}\n`;
    if (formData.addressRating) formatted += `- Address Rating: ${formData.addressRating}\n`;
    if (formData.personMet) formatted += `- Person Met: ${formData.personMet}\n`;
    if (formData.documentShown) formatted += `- Document Shown: ${formData.documentShown}\n`;
    if (formData.documentType) formatted += `- Document Type: ${formData.documentType}\n`;
    if (formData.remarks) formatted += `- Remarks: ${formData.remarks}\n`;
    if (formData.verifierComments) formatted += `- Verifier Comments: ${formData.verifierComments}\n`;

    // Verification type specific fields
    switch (verificationType.toUpperCase()) {
      case 'RESIDENCE':
      case 'RESIDENCE_CUM_OFFICE':
        if (formData.applicantName) formatted += `- Applicant Name: ${formData.applicantName}\n`;
        if (formData.applicantAge) formatted += `- Applicant Age: ${formData.applicantAge}\n`;
        if (formData.applicantRelation) formatted += `- Applicant Relation: ${formData.applicantRelation}\n`;
        if (formData.stayingStatus) formatted += `- Staying Status: ${formData.stayingStatus}\n`;
        if (formData.houseStatus) formatted += `- House Status: ${formData.houseStatus}\n`;
        if (formData.localityType) formatted += `- Locality Type: ${formData.localityType}\n`;
        break;

      case 'OFFICE':
        if (formData.companyName) formatted += `- Company Name: ${formData.companyName}\n`;
        if (formData.designation) formatted += `- Designation: ${formData.designation}\n`;
        if (formData.officeType) formatted += `- Office Type: ${formData.officeType}\n`;
        if (formData.workingStatus) formatted += `- Working Status: ${formData.workingStatus}\n`;
        break;

      case 'BUSINESS':
        if (formData.businessName) formatted += `- Business Name: ${formData.businessName}\n`;
        if (formData.businessType) formatted += `- Business Type: ${formData.businessType}\n`;
        if (formData.ownershipType) formatted += `- Ownership Type: ${formData.ownershipType}\n`;
        if (formData.businessExistence) formatted += `- Business Existence: ${formData.businessExistence}\n`;
        break;
    }

    // Third party confirmation
    if (formData.tpcMetPerson) formatted += `- TPC Met Person: ${formData.tpcMetPerson}\n`;
    if (formData.tpcConfirmation) formatted += `- TPC Confirmation: ${formData.tpcConfirmation}\n`;

    // Area information
    if (formData.politicalConnection) formatted += `- Political Connection: ${formData.politicalConnection}\n`;
    if (formData.dominatedArea) formatted += `- Dominated Area: ${formData.dominatedArea}\n`;
    if (formData.feedbackFromNeighbour) formatted += `- Neighbor Feedback: ${formData.feedbackFromNeighbour}\n`;

    return formatted || 'No specific form data available';
  }

  /**
   * Parse AI response and extract structured report
   */
  private parseAIResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // Validate required fields
        const required = ['executiveSummary', 'keyFindings', 'verificationDetails', 'riskAssessment', 'recommendations', 'conclusion'];
        const missing = required.filter(field => !parsed[field]);
        
        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        // Ensure confidence is a number between 70-95
        if (!parsed.confidence || parsed.confidence < 70 || parsed.confidence > 95) {
          parsed.confidence = 80; // Default confidence
        }

        return parsed;
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      
      // Fallback: create a basic report from the text
      return {
        executiveSummary: 'AI-generated report based on verification data analysis.',
        keyFindings: ['Verification completed', 'Data analyzed by AI system'],
        verificationDetails: text.substring(0, 500) + '...',
        riskAssessment: 'Unable to determine risk level due to parsing error.',
        recommendations: ['Review verification data', 'Manual analysis recommended'],
        conclusion: 'AI report generation encountered parsing issues. Manual review recommended.',
        confidence: 70
      };
    }
  }

  /**
   * Test Gemini AI connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.model.generateContent('Test connection. Respond with "Connection successful"');
      const response = await result.response;
      const text = response.text();
      
      return {
        success: text.toLowerCase().includes('connection successful') || text.length > 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const geminiAIService = new GeminiAIService();
