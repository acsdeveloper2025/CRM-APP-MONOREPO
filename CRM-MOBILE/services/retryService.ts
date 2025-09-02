import AsyncStorage from '../polyfills/AsyncStorage';
import NetworkService from './networkService';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RetryableRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  attempts: number;
  lastAttempt: string;
  nextRetry: string;
  error?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'VERIFICATION_SUBMISSION' | 'ATTACHMENT_UPLOAD' | 'CASE_UPDATE';
}

export interface RetryProgress {
  requestId: string;
  currentAttempt: number;
  maxAttempts: number;
  nextRetryIn: number;
  status: 'PENDING' | 'RETRYING' | 'SUCCESS' | 'FAILED';
  error?: string;
}

class RetryService {
  private static readonly STORAGE_KEY = 'retry_queue';
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 5,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'CONNECTION_FAILED',
      'RATE_LIMITED'
    ]
  };

  private retryQueue: RetryableRequest[] = [];
  private isProcessing = false;
  private progressCallbacks: Map<string, (progress: RetryProgress) => void> = new Map();

  constructor() {
    this.loadRetryQueue();
    this.startRetryProcessor();
  }

  /**
   * Add a request to the retry queue
   */
  async addToRetryQueue(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    type: RetryableRequest['type'],
    priority: RetryableRequest['priority'] = 'MEDIUM'
  ): Promise<string> {
    const requestId = `retry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const retryableRequest: RetryableRequest = {
      id: requestId,
      url,
      method,
      headers,
      body: JSON.stringify(body),
      attempts: 0,
      lastAttempt: new Date().toISOString(),
      nextRetry: new Date().toISOString(),
      priority,
      type
    };

    this.retryQueue.push(retryableRequest);
    await this.saveRetryQueue();

    console.log(`📋 Added request to retry queue: ${requestId} (${type})`);
    return requestId;
  }

  /**
   * Execute a request with automatic retry on failure
   */
  async executeWithRetry<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    type: RetryableRequest['type'],
    priority: RetryableRequest['priority'] = 'MEDIUM',
    onProgress?: (progress: RetryProgress) => void
  ): Promise<{ success: boolean; data?: T; error?: string; requestId: string }> {
    const requestId = await this.addToRetryQueue(url, method, headers, body, type, priority);
    
    if (onProgress) {
      this.progressCallbacks.set(requestId, onProgress);
    }

    // Try immediate execution first
    const result = await this.executeRequest(requestId);
    
    if (result.success) {
      await this.removeFromQueue(requestId);
      this.progressCallbacks.delete(requestId);
      return { success: true, data: result.data, requestId };
    }

    // If immediate execution fails, it will be retried by the processor
    return { success: false, error: result.error, requestId };
  }

  /**
   * Execute a single request
   */
  private async executeRequest(requestId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const request = this.retryQueue.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found in queue' };
    }

    try {
      // Check network connectivity
      if (!NetworkService.isOnline()) {
        throw new Error('NETWORK_ERROR');
      }

      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Update progress
      this.updateProgress(requestId, {
        requestId,
        currentAttempt: request.attempts + 1,
        maxAttempts: RetryService.DEFAULT_CONFIG.maxAttempts,
        nextRetryIn: 0,
        status: 'SUCCESS'
      });

      return { success: true, data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update request with error info
      request.attempts += 1;
      request.lastAttempt = new Date().toISOString();
      request.error = errorMessage;

      // Calculate next retry time
      const delay = Math.min(
        RetryService.DEFAULT_CONFIG.baseDelay * Math.pow(RetryService.DEFAULT_CONFIG.backoffMultiplier, request.attempts - 1),
        RetryService.DEFAULT_CONFIG.maxDelay
      );
      request.nextRetry = new Date(Date.now() + delay).toISOString();

      await this.saveRetryQueue();

      // Update progress
      this.updateProgress(requestId, {
        requestId,
        currentAttempt: request.attempts,
        maxAttempts: RetryService.DEFAULT_CONFIG.maxAttempts,
        nextRetryIn: delay,
        status: request.attempts >= RetryService.DEFAULT_CONFIG.maxAttempts ? 'FAILED' : 'PENDING',
        error: errorMessage
      });

      console.error(`❌ Request ${requestId} failed (attempt ${request.attempts}):`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Start the retry processor
   */
  private startRetryProcessor() {
    setInterval(async () => {
      if (this.isProcessing || !NetworkService.isOnline()) {
        return;
      }

      await this.processRetryQueue();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process the retry queue
   */
  private async processRetryQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingRequests = this.retryQueue
        .filter(r => 
          r.attempts < RetryService.DEFAULT_CONFIG.maxAttempts &&
          new Date(r.nextRetry) <= now
        )
        .sort((a, b) => {
          // Sort by priority, then by next retry time
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.nextRetry).getTime() - new Date(b.nextRetry).getTime();
        });

      for (const request of pendingRequests.slice(0, 3)) { // Process max 3 at a time
        console.log(`🔄 Retrying request ${request.id} (attempt ${request.attempts + 1})`);
        
        this.updateProgress(request.id, {
          requestId: request.id,
          currentAttempt: request.attempts + 1,
          maxAttempts: RetryService.DEFAULT_CONFIG.maxAttempts,
          nextRetryIn: 0,
          status: 'RETRYING'
        });

        const result = await this.executeRequest(request.id);
        
        if (result.success) {
          console.log(`✅ Request ${request.id} succeeded on retry`);
          await this.removeFromQueue(request.id);
        }
      }

      // Clean up failed requests
      await this.cleanupFailedRequests();

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update progress for a request
   */
  private updateProgress(requestId: string, progress: RetryProgress) {
    const callback = this.progressCallbacks.get(requestId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Remove a request from the queue
   */
  private async removeFromQueue(requestId: string) {
    this.retryQueue = this.retryQueue.filter(r => r.id !== requestId);
    await this.saveRetryQueue();
    this.progressCallbacks.delete(requestId);
  }

  /**
   * Clean up failed requests that have exceeded max attempts
   */
  private async cleanupFailedRequests() {
    const failedRequests = this.retryQueue.filter(r => r.attempts >= RetryService.DEFAULT_CONFIG.maxAttempts);
    
    for (const request of failedRequests) {
      console.error(`💀 Request ${request.id} permanently failed after ${request.attempts} attempts`);
      this.updateProgress(request.id, {
        requestId: request.id,
        currentAttempt: request.attempts,
        maxAttempts: RetryService.DEFAULT_CONFIG.maxAttempts,
        nextRetryIn: 0,
        status: 'FAILED',
        error: request.error
      });
    }

    // Keep failed requests for 24 hours for debugging
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.retryQueue = this.retryQueue.filter(r => 
      r.attempts < RetryService.DEFAULT_CONFIG.maxAttempts ||
      new Date(r.lastAttempt) > oneDayAgo
    );

    await this.saveRetryQueue();
  }

  /**
   * Get retry queue status
   */
  getQueueStatus(): { pending: number; retrying: number; failed: number } {
    const pending = this.retryQueue.filter(r => r.attempts < RetryService.DEFAULT_CONFIG.maxAttempts).length;
    const failed = this.retryQueue.filter(r => r.attempts >= RetryService.DEFAULT_CONFIG.maxAttempts).length;
    
    return { pending, retrying: 0, failed };
  }

  /**
   * Load retry queue from storage
   */
  private async loadRetryQueue() {
    try {
      const stored = await AsyncStorage.getItem(RetryService.STORAGE_KEY);
      if (stored) {
        this.retryQueue = JSON.parse(stored);
        console.log(`📋 Loaded ${this.retryQueue.length} requests from retry queue`);
      }
    } catch (error) {
      console.error('Failed to load retry queue:', error);
      this.retryQueue = [];
    }
  }

  /**
   * Save retry queue to storage
   */
  private async saveRetryQueue() {
    try {
      await AsyncStorage.setItem(RetryService.STORAGE_KEY, JSON.stringify(this.retryQueue));
    } catch (error) {
      console.error('Failed to save retry queue:', error);
    }
  }

  /**
   * Clear all retry requests (for testing/debugging)
   */
  async clearQueue() {
    this.retryQueue = [];
    this.progressCallbacks.clear();
    await AsyncStorage.removeItem(RetryService.STORAGE_KEY);
    console.log('🗑️ Retry queue cleared');
  }
}

const retryServiceInstance = new RetryService();

// Expose to global scope for debugging
if (typeof window !== 'undefined') {
  (window as any).clearRetryQueue = () => retryServiceInstance.clearQueue();
}

export default retryServiceInstance;
