import { Case, CaseStatus } from '../types';
import { caseService } from './caseService';
import AuthStorageService from './authStorageService';
import NetworkService from './networkService';

/**
 * Enhanced Case Status Service
 * Handles case status updates with optimistic UI, offline support, and audit logging
 */

export interface StatusUpdateResult {
  success: boolean;
  case?: Case;
  error?: string;
  wasOffline?: boolean;
}

export interface StatusUpdateOptions {
  optimistic?: boolean;
  skipBackendSync?: boolean;
  auditMetadata?: Record<string, any>;
}

export interface PendingStatusUpdate {
  id: string;
  caseId: string;
  fromStatus: CaseStatus;
  toStatus: CaseStatus;
  timestamp: string;
  userId: string;
  username: string;
  metadata?: Record<string, any>;
  retryCount: number;
  lastAttempt?: string;
}

class CaseStatusService {
  private static readonly PENDING_UPDATES_KEY = 'caseflow_pending_status_updates';
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Update case status with optimistic UI and offline support
   */
  static async updateCaseStatus(
    caseId: string,
    newStatus: CaseStatus,
    options: StatusUpdateOptions = {}
  ): Promise<StatusUpdateResult> {
    const { optimistic = true, skipBackendSync = false, auditMetadata = {} } = options;

    try {
      console.log(`🔄 Updating case ${caseId} status to ${newStatus}...`);

      // Get current case
      const currentCase = await caseService.getCase(caseId);
      if (!currentCase) {
        return { success: false, error: 'Case not found' };
      }

      const fromStatus = currentCase.status;
      
      // Validate status transition
      if (!this.isValidStatusTransition(fromStatus, newStatus)) {
        return { 
          success: false, 
          error: `Invalid status transition from ${fromStatus} to ${newStatus}` 
        };
      }

      // Prepare case updates
      const updates = this.prepareStatusUpdates(currentCase, newStatus);
      
      // Optimistic UI update (update local storage immediately)
      if (optimistic) {
        await caseService.updateCase(caseId, updates);
        console.log(`✅ Optimistic UI update completed for case ${caseId}`);
      }

      // Get updated case for return
      const updatedCase = await caseService.getCase(caseId);

      // Check network connectivity
      const isOnline = NetworkService.isOnline();
      
      if (!isOnline || skipBackendSync) {
        // Store pending update for later sync
        await this.storePendingUpdate(caseId, fromStatus, newStatus, auditMetadata);
        console.log(`📱 Offline: Status update queued for sync when online`);
        
        return {
          success: true,
          case: updatedCase,
          wasOffline: true,
        };
      }

      // Attempt backend sync
      try {
        const syncResult = await this.syncStatusWithBackend(caseId, newStatus, auditMetadata);
        
        if (syncResult.success) {
          console.log(`✅ Case ${caseId} status synced with backend`);
          return {
            success: true,
            case: updatedCase,
            wasOffline: false,
          };
        } else {
          // Backend sync failed, store for retry
          await this.storePendingUpdate(caseId, fromStatus, newStatus, auditMetadata);
          console.log(`⚠️ Backend sync failed, queued for retry: ${syncResult.error}`);
          
          return {
            success: true, // Local update succeeded
            case: updatedCase,
            error: `Local update successful, backend sync failed: ${syncResult.error}`,
            wasOffline: false,
          };
        }
      } catch (error) {
        // Network error during sync
        await this.storePendingUpdate(caseId, fromStatus, newStatus, auditMetadata);
        console.log(`📡 Network error during sync, queued for retry:`, error);
        
        return {
          success: true, // Local update succeeded
          case: updatedCase,
          error: `Local update successful, will retry sync when connection improves`,
          wasOffline: false,
        };
      }
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
   * Prepare case updates based on status change
   */
  private static prepareStatusUpdates(currentCase: Case, newStatus: CaseStatus): Partial<Case> {
    const updates: Partial<Case> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    switch (newStatus) {
      case CaseStatus.InProgress:
        if (!currentCase.inProgressAt) {
          updates.inProgressAt = new Date().toISOString();
        }
        break;
        
      case CaseStatus.Completed:
        updates.completedAt = new Date().toISOString();
        updates.submissionStatus = 'pending';
        updates.isSaved = false;
        break;
        
      case CaseStatus.Assigned:
        // Reset progress timestamps if moving back to assigned
        updates.inProgressAt = undefined;
        updates.completedAt = undefined;
        updates.submissionStatus = undefined;
        break;
    }

    return updates;
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

      const response = await fetch(`${API_BASE_URL}/mobile/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
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

  /**
   * Store pending status update for later sync
   */
  private static async storePendingUpdate(
    caseId: string,
    fromStatus: CaseStatus,
    toStatus: CaseStatus,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      const authData = await AuthStorageService.getAuthData();
      if (!authData) {
        console.warn('No auth data available for pending update');
        return;
      }

      const pendingUpdate: PendingStatusUpdate = {
        id: `${caseId}_${Date.now()}`,
        caseId,
        fromStatus,
        toStatus,
        timestamp: new Date().toISOString(),
        userId: authData.user.id,
        username: authData.user.username,
        metadata,
        retryCount: 0,
      };

      const existingUpdates = await this.getPendingUpdates();
      
      // Remove any existing pending updates for this case
      const filteredUpdates = existingUpdates.filter(update => update.caseId !== caseId);
      
      // Add new pending update
      filteredUpdates.push(pendingUpdate);

      await this.savePendingUpdates(filteredUpdates);
      console.log(`📝 Stored pending status update for case ${caseId}`);
    } catch (error) {
      console.error('Failed to store pending update:', error);
    }
  }

  /**
   * Get all pending status updates
   */
  static async getPendingUpdates(): Promise<PendingStatusUpdate[]> {
    try {
      const stored = localStorage.getItem(this.PENDING_UPDATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get pending updates:', error);
      return [];
    }
  }

  /**
   * Save pending status updates
   */
  private static async savePendingUpdates(updates: PendingStatusUpdate[]): Promise<void> {
    try {
      localStorage.setItem(this.PENDING_UPDATES_KEY, JSON.stringify(updates));
    } catch (error) {
      console.error('Failed to save pending updates:', error);
    }
  }

  /**
   * Sync all pending status updates when coming back online
   */
  static async syncPendingUpdates(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const pendingUpdates = await this.getPendingUpdates();
    
    if (pendingUpdates.length === 0) {
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`🔄 Syncing ${pendingUpdates.length} pending status updates...`);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];
    const remainingUpdates: PendingStatusUpdate[] = [];

    for (const update of pendingUpdates) {
      try {
        const result = await this.syncStatusWithBackend(
          update.caseId,
          update.toStatus,
          update.metadata || {}
        );

        if (result.success) {
          synced++;
          console.log(`✅ Synced pending update for case ${update.caseId}`);
        } else {
          update.retryCount++;
          update.lastAttempt = new Date().toISOString();

          if (update.retryCount < this.MAX_RETRY_ATTEMPTS) {
            remainingUpdates.push(update);
            console.log(`⚠️ Retry ${update.retryCount}/${this.MAX_RETRY_ATTEMPTS} for case ${update.caseId}: ${result.error}`);
          } else {
            failed++;
            errors.push(`Case ${update.caseId}: ${result.error}`);
            console.error(`❌ Max retries exceeded for case ${update.caseId}: ${result.error}`);
          }
        }
      } catch (error) {
        update.retryCount++;
        update.lastAttempt = new Date().toISOString();

        if (update.retryCount < this.MAX_RETRY_ATTEMPTS) {
          remainingUpdates.push(update);
        } else {
          failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Case ${update.caseId}: ${errorMsg}`);
        }
      }
    }

    // Save remaining updates that need more retries
    await this.savePendingUpdates(remainingUpdates);

    console.log(`📊 Sync complete: ${synced} synced, ${failed} failed, ${remainingUpdates.length} pending retry`);

    return { synced, failed, errors };
  }

  /**
   * Clear all pending updates (for testing or reset)
   */
  static async clearPendingUpdates(): Promise<void> {
    await this.savePendingUpdates([]);
    console.log('🗑️ Cleared all pending status updates');
  }

  /**
   * Get pending updates count for UI display
   */
  static async getPendingUpdatesCount(): Promise<number> {
    const updates = await this.getPendingUpdates();
    return updates.length;
  }
}

export default CaseStatusService;
