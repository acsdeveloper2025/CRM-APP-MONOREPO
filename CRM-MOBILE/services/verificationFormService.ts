import { Case, CapturedImage } from '../types';
import AuthStorageService from './authStorageService';
import NetworkService from './networkService';
import { getEnvironmentConfig } from '../config/environment';
import retryService from './retryService';
import progressTrackingService from './progressTrackingService';
import compressionService from './compressionService';

export interface VerificationFormData {
  [key: string]: any;
}

export interface VerificationSubmissionRequest {
  formData: VerificationFormData;
  attachmentIds: string[];
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  };
  photos: Array<{
    attachmentId: string;
    geoLocation: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      timestamp?: string;
    };
  }>;
}

export interface VerificationSubmissionResult {
  success: boolean;
  error?: string;
  caseId?: string;
  status?: string;
  completedAt?: string;
  submissionId?: string;
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
  retryInfo?: {
    requestId: string;
    willRetry: boolean;
    nextRetryIn?: number;
  };
}

/**
 * Service for submitting verification forms to the backend
 */
class VerificationFormService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  /**
   * Submit residence verification form with enhanced error recovery, progress tracking, and compression
   */
  static async submitResidenceVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number },
    onProgress?: (progress: any) => void
  ): Promise<VerificationSubmissionResult> {
    // Start progress tracking
    const submissionId = progressTrackingService.startSubmission(caseId, 'residence');

    // Subscribe to progress updates
    const unsubscribe = onProgress ?
      progressTrackingService.subscribeToProgress(submissionId, onProgress) :
      () => {};

    try {
      console.log(`🏠 Submitting residence verification for case ${caseId}...`);

      // Step 1: Validation
      progressTrackingService.updateStepProgress(submissionId, 'validation', 0, 'IN_PROGRESS');

      // Validate minimum requirements
      if (images.length < 5) {
        progressTrackingService.markSubmissionFailed(submissionId, 'Minimum 5 geo-tagged photos required', 'validation');
        return {
          success: false,
          error: 'Minimum 5 geo-tagged photos required for residence verification',
          submissionId
        };
      }

      // Check if all images have geo-location
      const photosWithoutGeo = images.filter(img =>
        !img.geoLocation ||
        !img.geoLocation.latitude ||
        !img.geoLocation.longitude
      );

      if (photosWithoutGeo.length > 0) {
        progressTrackingService.markSubmissionFailed(submissionId, 'All photos must have geo-location data', 'validation');
        return {
          success: false,
          error: 'All photos must have geo-location data',
          submissionId
        };
      }

      progressTrackingService.updateStepProgress(submissionId, 'validation', 100, 'COMPLETED');

      // Step 2: Compression
      progressTrackingService.updateStepProgress(submissionId, 'compression', 0, 'IN_PROGRESS');

      // Get network-appropriate compression settings
      const networkType = NetworkService.isOnline() ?
        (NetworkService.getConnectionType() === 'wifi' ? 'wifi' : 'cellular') : 'slow';
      const compressionOptions = compressionService.getCompressionRecommendations(networkType);

      // Compress data
      const compressedData = await compressionService.compressSubmissionData(
        images,
        formData,
        compressionOptions,
        (progress) => progressTrackingService.updateStepProgress(submissionId, 'compression', progress, 'IN_PROGRESS')
      );

      progressTrackingService.updateStepProgress(submissionId, 'compression', 100, 'COMPLETED');

      // Step 3: Prepare submission data
      const submissionData: VerificationSubmissionRequest = {
        formData: compressionService.decompressFormData(compressedData.formData.compressed),
        attachmentIds: compressedData.images.map(img => img.id),
        geoLocation,
        photos: compressedData.images.map(img => ({
          attachmentId: img.id,
          geoLocation: img.geoLocation
        }))
      };

      // Step 4: Submit to backend with retry mechanism
      progressTrackingService.updateStepProgress(submissionId, 'submit_form', 0, 'IN_PROGRESS');

      const result = await this.submitToBackendWithRetry(
        `${this.API_BASE_URL}/mobile/cases/${caseId}/verification/residence`,
        submissionData,
        'VERIFICATION_SUBMISSION',
        'HIGH',
        submissionId
      );

      if (result.success) {
        progressTrackingService.markSubmissionCompleted(submissionId);
        console.log(`✅ Residence verification submitted successfully for case ${caseId}`);

        unsubscribe();
        return {
          ...result,
          submissionId,
          compressionStats: {
            originalSize: compressedData.totalOriginalSize,
            compressedSize: compressedData.totalCompressedSize,
            compressionRatio: compressedData.overallCompressionRatio
          }
        };
      } else {
        progressTrackingService.markSubmissionFailed(submissionId, result.error || 'Submission failed', 'submit_form');
        console.error(`❌ Residence verification submission failed for case ${caseId}:`, result.error);

        unsubscribe();
        return {
          ...result,
          submissionId
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      progressTrackingService.markSubmissionFailed(submissionId, errorMessage);
      unsubscribe();

      console.error(`❌ Residence verification submission error for case ${caseId}:`, error);
      return {
        success: false,
        error: errorMessage,
        submissionId
      };
    }
  }

  /**
   * Submit office verification form
   */
  static async submitOfficeVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'office', formData, images, geoLocation);
  }

  /**
   * Submit business verification form
   */
  static async submitBusinessVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'business', formData, images, geoLocation);
  }

  /**
   * Submit builder verification form
   */
  static async submitBuilderVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'builder', formData, images, geoLocation);
  }

  /**
   * Submit residence-cum-office verification form
   */
  static async submitResidenceCumOfficeVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'residence-cum-office', formData, images, geoLocation);
  }

  /**
   * Submit DSA/DST connector verification form
   */
  static async submitDsaConnectorVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'dsa-connector', formData, images, geoLocation);
  }

  /**
   * Submit property individual verification form
   */
  static async submitPropertyIndividualVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'property-individual', formData, images, geoLocation);
  }

  /**
   * Submit property APF verification form
   */
  static async submitPropertyApfVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'property-apf', formData, images, geoLocation);
  }

  /**
   * Submit NOC verification form
   */
  static async submitNocVerification(
    caseId: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    return this.submitGenericVerification(caseId, 'noc', formData, images, geoLocation);
  }

  /**
   * Generic verification submission method
   */
  private static async submitGenericVerification(
    caseId: string,
    verificationType: string,
    formData: VerificationFormData,
    images: CapturedImage[],
    geoLocation?: { latitude: number; longitude: number; accuracy?: number }
  ): Promise<VerificationSubmissionResult> {
    try {
      console.log(`📋 Submitting ${verificationType} verification for case ${caseId}...`);

      // Validate minimum requirements
      if (images.length < 5) {
        return {
          success: false,
          error: `Minimum 5 geo-tagged photos required for ${verificationType} verification`
        };
      }

      // Check if all images have geo-location
      const photosWithoutGeo = images.filter(img =>
        !img.geoLocation ||
        !img.geoLocation.latitude ||
        !img.geoLocation.longitude
      );

      if (photosWithoutGeo.length > 0) {
        return {
          success: false,
          error: 'All photos must have geo-location data'
        };
      }

      // Prepare submission data
      const submissionData: VerificationSubmissionRequest = {
        formData,
        attachmentIds: images.map(img => img.id),
        geoLocation,
        photos: images.map(img => ({
          attachmentId: img.id,
          geoLocation: {
            latitude: img.geoLocation!.latitude,
            longitude: img.geoLocation!.longitude,
            accuracy: img.geoLocation!.accuracy,
            timestamp: img.geoLocation!.timestamp || new Date().toISOString()
          }
        }))
      };

      // Submit to backend
      const result = await this.submitToBackend(
        `${this.API_BASE_URL}/mobile/cases/${caseId}/verification/${verificationType}`,
        submissionData
      );

      if (result.success) {
        console.log(`✅ ${verificationType.charAt(0).toUpperCase() + verificationType.slice(1)} verification submitted successfully for case ${caseId}`);
      } else {
        console.error(`❌ ${verificationType.charAt(0).toUpperCase() + verificationType.slice(1)} verification submission failed for case ${caseId}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error(`❌ ${verificationType.charAt(0).toUpperCase() + verificationType.slice(1)} verification submission error for case ${caseId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Enhanced method to submit verification data to backend with retry mechanism
   */
  private static async submitToBackendWithRetry(
    url: string,
    data: VerificationSubmissionRequest,
    type: 'VERIFICATION_SUBMISSION' | 'ATTACHMENT_UPLOAD' | 'CASE_UPDATE',
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    submissionId: string
  ): Promise<VerificationSubmissionResult> {
    try {
      // Check network connectivity
      if (!NetworkService.isOnline()) {
        // Add to retry queue for later
        const requestId = await retryService.addToRetryQueue(
          url,
          'POST',
          await this.getHeaders(),
          data,
          type,
          priority
        );

        return {
          success: false,
          error: 'No internet connection. Request queued for retry when connection is restored.',
          retryInfo: {
            requestId,
            willRetry: true
          }
        };
      }

      // Execute with retry mechanism
      const result = await retryService.executeWithRetry(
        url,
        'POST',
        await this.getHeaders(),
        data,
        type,
        priority,
        (progress) => {
          // Update submission progress based on retry progress
          if (progress.status === 'RETRYING') {
            progressTrackingService.updateStepProgress(
              submissionId,
              'submit_form',
              Math.round((progress.currentAttempt / progress.maxAttempts) * 100),
              'IN_PROGRESS',
              { retryAttempt: progress.currentAttempt, maxAttempts: progress.maxAttempts }
            );
          }
        }
      );

      if (result.success) {
        progressTrackingService.updateStepProgress(submissionId, 'submit_form', 100, 'COMPLETED');
        progressTrackingService.updateStepProgress(submissionId, 'confirmation', 100, 'COMPLETED');

        return {
          success: true,
          caseId: result.data?.caseId,
          status: result.data?.status,
          completedAt: result.data?.completedAt
        };
      } else {
        return {
          success: false,
          error: result.error || 'Submission failed',
          retryInfo: {
            requestId: result.requestId,
            willRetry: true
          }
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Get headers for API requests
   */
  private static async getHeaders(): Promise<Record<string, string>> {
    const authToken = await AuthStorageService.getCurrentAccessToken();
    const envConfig = getEnvironmentConfig();

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'X-App-Version': envConfig.app.version,
      'X-Client-Type': 'mobile',
    };
  }

  /**
   * Legacy method to submit verification data to backend (kept for compatibility)
   */
  private static async submitToBackend(
    url: string,
    data: VerificationSubmissionRequest
  ): Promise<VerificationSubmissionResult> {
    try {
      // Check network connectivity
      if (!NetworkService.isOnline()) {
        return {
          success: false,
          error: 'No internet connection. Please check your network and try again.'
        };
      }

      // Get authentication token
      const authToken = await AuthStorageService.getCurrentAccessToken();
      if (!authToken) {
        return {
          success: false,
          error: 'Authentication required. Please log in again.'
        };
      }

      // Make API request
      const envConfig = getEnvironmentConfig();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-App-Version': envConfig.app.version,
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.message || 'Verification submission failed'
        };
      }

      return {
        success: true,
        caseId: result.data?.caseId,
        status: result.data?.status,
        completedAt: result.data?.completedAt
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Check if verification form can be submitted (validation)
   */
  static validateVerificationSubmission(
    formData: VerificationFormData,
    images: CapturedImage[],
    verificationType: 'residence' | 'office' | 'business' | 'builder' | 'residence-cum-office' | 'dsa-connector' | 'property-individual' | 'property-apf' | 'noc'
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum photo requirement
    if (images.length < 5) {
      errors.push(`Minimum 5 photos required for ${verificationType} verification`);
    }

    // Check geo-location on photos
    const photosWithoutGeo = images.filter(img =>
      !img.geoLocation ||
      !img.geoLocation.latitude ||
      !img.geoLocation.longitude
    );

    if (photosWithoutGeo.length > 0) {
      errors.push('All photos must have geo-location data');
    }

    // Check required form fields based on verification type
    const requiredFieldsMap: Record<string, string[]> = {
      'residence': ['applicantName', 'addressConfirmed', 'residenceType', 'outcome'],
      'office': ['companyName', 'designation', 'workingHours', 'outcome'],
      'business': ['businessName', 'businessType', 'ownerName', 'outcome'],
      'builder': ['builderName', 'projectName', 'projectAddress', 'outcome'],
      'residence-cum-office': ['applicantName', 'residenceConfirmed', 'officeConfirmed', 'outcome'],
      'dsa-connector': ['connectorName', 'connectorType', 'officeAddress', 'outcome'],
      'property-individual': ['propertyOwner', 'propertyType', 'propertyAddress', 'outcome'],
      'property-apf': ['projectName', 'developerName', 'projectAddress', 'outcome'],
      'noc': ['applicantName', 'nocType', 'propertyAddress', 'outcome']
    };

    const requiredFields = requiredFieldsMap[verificationType] || ['outcome'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default VerificationFormService;
