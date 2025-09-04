import { apiService } from './api';
import type { ApiResponse } from '@/types/api';

export interface VerificationImage {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  photoType: 'verification' | 'selfie';
  verificationType: string;
  submissionId: string;
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
    address?: string;
  };
}

export interface VerificationImagesQuery {
  verificationType?: string;
  submissionId?: string;
  photoType?: 'verification' | 'selfie';
}

class VerificationImagesService {
  /**
   * Get verification images for a case
   */
  async getVerificationImages(
    caseId: string, 
    query: VerificationImagesQuery = {}
  ): Promise<ApiResponse<VerificationImage[]>> {
    const params = new URLSearchParams();
    
    if (query.verificationType) {
      params.append('verificationType', query.verificationType);
    }
    
    if (query.submissionId) {
      params.append('submissionId', query.submissionId);
    }
    
    if (query.photoType) {
      params.append('photoType', query.photoType);
    }

    const queryString = params.toString();
    const url = `/cases/${caseId}/verification-images${queryString ? `?${queryString}` : ''}`;

    return apiService.get<VerificationImage[]>(url);
  }

  /**
   * Get verification images by submission ID
   */
  async getVerificationImagesBySubmission(
    caseId: string, 
    submissionId: string
  ): Promise<ApiResponse<VerificationImage[]>> {
    return this.getVerificationImages(caseId, { submissionId });
  }

  /**
   * Get verification images by type
   */
  async getVerificationImagesByType(
    caseId: string, 
    verificationType: string
  ): Promise<ApiResponse<VerificationImage[]>> {
    return this.getVerificationImages(caseId, { verificationType });
  }

  /**
   * Get only verification photos (excluding selfies)
   */
  async getVerificationPhotos(caseId: string): Promise<ApiResponse<VerificationImage[]>> {
    return this.getVerificationImages(caseId, { photoType: 'verification' });
  }

  /**
   * Get only selfie photos
   */
  async getSelfiePhotos(caseId: string): Promise<ApiResponse<VerificationImage[]>> {
    return this.getVerificationImages(caseId, { photoType: 'selfie' });
  }

  /**
   * Download verification image
   */
  async downloadVerificationImage(imageUrl: string): Promise<Blob> {
    // Static files are served from the base URL without /api suffix
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    const response = await fetch(`${baseUrl}${imageUrl}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get verification image URL for display
   */
  getImageDisplayUrl(imageUrl: string): string {
    // Static files are served from the base URL without /api suffix
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imageUrl}`;
  }

  /**
   * Get thumbnail URL for display
   */
  getThumbnailDisplayUrl(thumbnailUrl: string): string {
    // Static files are served from the base URL without /api suffix
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    return `${baseUrl}${thumbnailUrl}`;
  }

  /**
   * Group verification images by submission
   */
  groupImagesBySubmission(images: VerificationImage[]): Record<string, VerificationImage[]> {
    return images.reduce((groups, image) => {
      const submissionId = image.submissionId;
      if (!groups[submissionId]) {
        groups[submissionId] = [];
      }
      groups[submissionId].push(image);
      return groups;
    }, {} as Record<string, VerificationImage[]>);
  }

  /**
   * Group verification images by type
   */
  groupImagesByType(images: VerificationImage[]): Record<string, VerificationImage[]> {
    return images.reduce((groups, image) => {
      const photoType = image.photoType;
      if (!groups[photoType]) {
        groups[photoType] = [];
      }
      groups[photoType].push(image);
      return groups;
    }, {} as Record<string, VerificationImage[]>);
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(images: VerificationImage[]) {
    const stats = {
      total: images.length,
      verificationPhotos: 0,
      selfiePhotos: 0,
      geoTaggedPhotos: 0,
      submissions: new Set<string>(),
      verificationTypes: new Set<string>(),
    };

    images.forEach(image => {
      if (image.photoType === 'verification') {
        stats.verificationPhotos++;
      } else if (image.photoType === 'selfie') {
        stats.selfiePhotos++;
      }

      if (image.geoLocation) {
        stats.geoTaggedPhotos++;
      }

      stats.submissions.add(image.submissionId);
      stats.verificationTypes.add(image.verificationType);
    });

    return {
      ...stats,
      submissionCount: stats.submissions.size,
      verificationTypeCount: stats.verificationTypes.size,
    };
  }
}

export const verificationImagesService = new VerificationImagesService();
