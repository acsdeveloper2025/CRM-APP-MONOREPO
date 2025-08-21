/**
 * WebSocket Service for CaseFlow Mobile
 * Handles real-time communication with the backend server
 */

import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { caseService } from './caseService';
import { getEnvironmentConfig } from '../config/environment';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  timeout: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}

export interface CaseAssignmentNotification {
  type: 'CASE_ASSIGNED';
  case: any;
  timestamp: string;
  priority: string;
  requiresImmediate: boolean;
}

export interface CaseStatusChangeNotification {
  type: 'CASE_STATUS_CHANGED';
  caseId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  timestamp: string;
}

export interface CasePriorityChangeNotification {
  type: 'CASE_PRIORITY_CHANGED';
  caseId: string;
  oldPriority: number;
  newPriority: number;
  updatedBy: string;
  timestamp: string;
  requiresImmediate: boolean;
}

export interface WebSocketEventHandlers {
  onConnected?: (data: any) => void;
  onDisconnected?: (reason: string) => void;
  onError?: (error: string) => void;
  onCaseAssigned?: (notification: CaseAssignmentNotification) => void;
  onCaseStatusChanged?: (notification: CaseStatusChangeNotification) => void;
  onCasePriorityChanged?: (notification: CasePriorityChangeNotification) => void;
  onSyncCompleted?: (data: any) => void;
  onSyncTrigger?: (data: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private state: WebSocketState;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private deviceInfo: any = null;

  constructor() {
    const envConfig = getEnvironmentConfig();
    
    this.config = {
      url: envConfig.api.baseUrl.replace(/^http/, 'ws'),
      autoConnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      timeout: 10000,
    };

    this.state = {
      isConnected: false,
      isConnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    };

    this.initializeDeviceInfo();
    this.setupAppStateListeners();
  }

  /**
   * Initialize device information for WebSocket authentication
   */
  private async initializeDeviceInfo(): Promise<void> {
    try {
      this.deviceInfo = await Device.getInfo();
    } catch (error) {
      console.error('Failed to get device info:', error);
      this.deviceInfo = { platform: 'unknown', model: 'unknown' };
    }
  }

  /**
   * Set up app state listeners for connection management
   */
  private setupAppStateListeners(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App became active - reconnecting WebSocket');
        this.connect();
      } else {
        console.log('📱 App became inactive - maintaining WebSocket connection');
        // Keep connection alive in background for notifications
      }
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const token = await authService.getAccessToken();
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.state.isConnecting = true;
      this.state.error = null;

      // Ensure device info is available
      if (!this.deviceInfo) {
        await this.initializeDeviceInfo();
      }

      this.socket = io(this.config.url, {
        auth: {
          token,
          platform: 'mobile',
          deviceId: this.deviceInfo?.identifier || 'unknown',
        },
        transports: ['websocket'],
        timeout: this.config.timeout,
        forceNew: true,
      });

      this.setupEventListeners();

      this.socket.on('connect', () => {
        this.state.isConnected = true;
        this.state.isConnecting = false;
        this.state.lastConnected = new Date();
        this.state.reconnectAttempts = 0;
        
        console.log('✅ WebSocket connected successfully');
        this.eventHandlers.onConnected?.({
          message: 'Connected to CaseFlow WebSocket server',
          timestamp: new Date().toISOString(),
        });
        
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        this.state.isConnecting = false;
        this.state.error = error.message;
        
        console.error('❌ WebSocket connection error:', error.message);
        this.eventHandlers.onError?.(error.message);
        
        if (this.state.reconnectAttempts < this.config.reconnectAttempts) {
          this.scheduleReconnect();
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Set up event listeners for WebSocket events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.state.isConnected = false;
      console.log('🔌 WebSocket disconnected:', reason);
      this.eventHandlers.onDisconnected?.(reason);
      
      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    // Case assignment notifications
    this.socket.on('mobile:case:assigned', (data: CaseAssignmentNotification & { notificationId?: string }) => {
      console.log('📋 New case assigned:', data.case.caseId);

      // Send acknowledgment
      if (data.notificationId) {
        this.acknowledgeNotification(data.notificationId);
      }

      this.eventHandlers.onCaseAssigned?.(data);

      // Trigger case list refresh
      caseService.syncCases().catch(console.error);
    });

    // Case status change notifications
    this.socket.on('mobile:case:status:changed', (data: CaseStatusChangeNotification & { notificationId?: string }) => {
      console.log('📊 Case status changed:', data.caseId, data.oldStatus, '->', data.newStatus);

      // Send acknowledgment
      if (data.notificationId) {
        this.acknowledgeNotification(data.notificationId);
      }

      this.eventHandlers.onCaseStatusChanged?.(data);

      // Update local case data
      caseService.syncCases().catch(console.error);
    });

    // Case priority change notifications
    this.socket.on('mobile:case:priority:changed', (data: CasePriorityChangeNotification) => {
      console.log('⚡ Case priority changed:', data.caseId, data.oldPriority, '->', data.newPriority);
      this.eventHandlers.onCasePriorityChanged?.(data);
      
      // Update local case data
      caseService.syncCases().catch(console.error);
    });

    // Sync events
    this.socket.on('mobile:sync:completed', (data: any) => {
      console.log('🔄 Sync completed:', data);
      this.eventHandlers.onSyncCompleted?.(data);
    });

    this.socket.on('mobile:sync:trigger', (data: any) => {
      console.log('🔄 Sync trigger received:', data);
      this.eventHandlers.onSyncTrigger?.(data);
      
      // Trigger automatic sync
      caseService.syncCases().catch(console.error);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.state.reconnectAttempts++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.state.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.state.isConnected = false;
    this.state.isConnecting = false;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get connection state
   */
  getState(): WebSocketState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected && this.socket?.connected === true;
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected, cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Subscribe to case updates
   */
  subscribeToCase(caseId: string): void {
    this.emit('subscribe:case', caseId);
  }

  /**
   * Unsubscribe from case updates
   */
  unsubscribeFromCase(caseId: string): void {
    this.emit('unsubscribe:case', caseId);
  }

  /**
   * Send app state change notification
   */
  notifyAppStateChange(state: 'foreground' | 'background' | 'inactive'): void {
    this.emit('mobile:app:state', { state });
  }

  /**
   * Send connectivity status update
   */
  notifyConnectivityChange(isOnline: boolean, connectionType: string, pendingSync: number): void {
    this.emit('mobile:connectivity', { isOnline, connectionType, pendingSync });
  }

  /**
   * Send notification acknowledgment
   */
  acknowledgeNotification(notificationId: string): void {
    this.emit('mobile:notification:ack', { notificationId });
    console.log('✅ Notification acknowledged:', notificationId);
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
