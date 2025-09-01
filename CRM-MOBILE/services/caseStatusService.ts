import { Case, CaseStatus } from '../types';
import { caseService } from './caseService';
import AuthStorageService from './authStorageService';
import { getEnvironmentConfig } from '../config/environment';

/**
 * Simple Case Status Service
 * Handles case status updates with direct backend sync
 */

export interface StatusUpdateResult {
  success: boolean;
  case?: Case;
  error?: string;
}

class CaseStatusService {

  /**
   * Update case status with direct backend sync
   */
  static async updateCaseStatus(
    caseId: string,
    newStatus: CaseStatus
  ): Promise<StatusUpdateResult> {
    try {
      console.log(`🔄 Updating case ${caseId} status to ${newStatus}...`);

      // Get current case
      const currentCase = await caseService.getCase(caseId);
      if (!currentCase) {
        return { success: false, error: 'Case not found' };
      }

      // Validate status transition
      if (!this.isValidStatusTransition(currentCase.status, newStatus)) {
        return {
          success: false,
          error: `Invalid status transition from ${currentCase.status} to ${newStatus}`
        };
      }

      // Update local state
      await caseService.updateCase(caseId, { status: newStatus });
      console.log(`✅ Local update: Case ${caseId} status updated to ${newStatus}`);

      // Try to sync with backend, but don't fail if it's not available
      try {
        const syncResult = await this.syncStatusWithBackend(caseId, newStatus, {});
        if (syncResult.success) {
          console.log(`🌐 Backend sync successful for case ${caseId}`);
        } else {
          console.log(`⚠️ Backend sync failed (offline mode): ${syncResult.error}`);
        }
      } catch (error) {
        console.log(`📱 Working offline - backend sync will retry later`);
      }

      // Always return success for local update
      const updatedCase = await caseService.getCase(caseId);
      return {
        success: true,
        case: updatedCase,
      };
    } catch (error) {
      console.error(`❌ Failed to update case ${caseId} status:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate if status transition is allowed
   */
  private static isValidStatusTransition(from: CaseStatus, to: CaseStatus): boolean {
    const validTransitions: Record<CaseStatus, CaseStatus[]> = {
      [CaseStatus.Assigned]: [CaseStatus.InProgress],
      [CaseStatus.InProgress]: [CaseStatus.Completed, CaseStatus.Assigned], // Allow back to assigned for revoke
      [CaseStatus.Completed]: [], // Completed cases cannot change status
    };

    return validTransitions[from]?.includes(to) || false;
  }



  /**
   * Sync status update with backend
   */
  private static async syncStatusWithBackend(
    caseId: string,
    status: CaseStatus,
    metadata: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const authToken = await AuthStorageService.getCurrentAccessToken();

      if (!authToken) {
        return { success: false, error: 'No authentication token available' };
      }

      // Map mobile status to backend status
      const backendStatus = this.mapMobileStatusToBackend(status);

      const envConfig = getEnvironmentConfig();
      const response = await fetch(`${API_BASE_URL}/mobile/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-App-Version': envConfig.app.version,
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify({
          status: backendStatus,
          metadata: {
            ...metadata,
            updatedAt: new Date().toISOString(),
            source: 'mobile_app',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const result = await response.json();
      return { success: result.success || true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Map mobile status to backend status format
   */
  private static mapMobileStatusToBackend(status: CaseStatus): string {
    const statusMap: Record<CaseStatus, string> = {
      [CaseStatus.Assigned]: 'ASSIGNED',
      [CaseStatus.InProgress]: 'IN_PROGRESS',
      [CaseStatus.Completed]: 'COMPLETED',
    };

    return statusMap[status] || 'ASSIGNED';
  }


}

export default CaseStatusService;
