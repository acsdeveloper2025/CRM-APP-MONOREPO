/**
 * React Hook for WebSocket functionality in CaseFlow Mobile
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService, WebSocketEventHandlers, WebSocketState } from '../services/websocketService';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';
import { caseService } from '../services/caseService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  onCaseAssigned?: (notification: any) => void;
  onCaseStatusChanged?: (notification: any) => void;
  onCasePriorityChanged?: (notification: any) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToCase: (caseId: string) => void;
  unsubscribeFromCase: (caseId: string) => void;
  notifyAppStateChange: (state: 'foreground' | 'background' | 'inactive') => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    enableNotifications = true,
    onCaseAssigned,
    onCaseStatusChanged,
    onCasePriorityChanged,
    onError,
  } = options;

  const { isAuthenticated } = useAuth();
  const { fetchCases } = useCases();
  const [state, setState] = useState<WebSocketState>(webSocketService.getState());
  const stateUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Show local notification for case assignment
   */
  const showCaseAssignmentNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'New Case Assigned',
            body: `Case ${notification.case.caseId}: ${notification.case.customerName}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.case.caseId,
              type: 'case_assigned',
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show case assignment notification:', error);
    }
  }, [enableNotifications]);

  /**
   * Show local notification for case status change
   */
  const showCaseStatusChangeNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Case Status Updated',
            body: `Case ${notification.caseId} status changed to ${notification.newStatus}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.caseId,
              type: 'case_status_changed',
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show case status change notification:', error);
    }
  }, [enableNotifications]);

  /**
   * Show local notification for case priority change
   */
  const showCasePriorityChangeNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    // Only show notification for high priority cases
    if (notification.newPriority < 3) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'High Priority Case',
            body: `Case ${notification.caseId} priority changed to ${notification.newPriority === 3 ? 'HIGH' : 'URGENT'}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.caseId,
              type: 'case_priority_changed',
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show case priority change notification:', error);
    }
  }, [enableNotifications]);

  /**
   * Set up WebSocket event handlers
   */
  const setupEventHandlers = useCallback(() => {
    const handlers: WebSocketEventHandlers = {
      onConnected: (data) => {
        console.log('✅ WebSocket connected:', data);
        setState(webSocketService.getState());
      },

      onDisconnected: (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setState(webSocketService.getState());
      },

      onError: (error) => {
        console.error('❌ WebSocket error:', error);
        setState(webSocketService.getState());
        onError?.(error);
      },

      onCaseAssigned: async (notification) => {
        console.log('📋 Case assigned notification received:', notification);

        // Show local notification
        await showCaseAssignmentNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await fetchCases();

        // Call custom handler
        onCaseAssigned?.(notification);
      },

      onCaseStatusChanged: async (notification) => {
        console.log('📊 Case status changed notification received:', notification);

        // Show local notification
        await showCaseStatusChangeNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await fetchCases();

        // Call custom handler
        onCaseStatusChanged?.(notification);
      },

      onCasePriorityChanged: async (notification) => {
        console.log('⚡ Case priority changed notification received:', notification);

        // Show local notification for high priority cases
        await showCasePriorityChangeNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await fetchCases();

        // Call custom handler
        onCasePriorityChanged?.(notification);
      },

      onSyncCompleted: async (data) => {
        console.log('🔄 Sync completed notification:', data);

        // Trigger intelligent sync
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Sync result:', syncResult);

        // Refresh case list in UI
        await fetchCases();
      },

      onSyncTrigger: async (data) => {
        console.log('🔄 Sync trigger received:', data);

        // Trigger intelligent sync
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Triggered sync result:', syncResult);

        // Refresh case list in UI
        await fetchCases();
      },
    };

    webSocketService.setEventHandlers(handlers);
  }, [
    onCaseAssigned,
    onCaseStatusChanged,
    onCasePriorityChanged,
    onError,
    fetchCases,
    showCaseAssignmentNotification,
    showCaseStatusChangeNotification,
    showCasePriorityChangeNotification,
  ]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Cannot connect to WebSocket: not authenticated');
      return;
    }

    try {
      await webSocketService.connect();
      setState(webSocketService.getState());
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setState(webSocketService.getState());
    }
  }, [isAuthenticated]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setState(webSocketService.getState());
  }, []);

  /**
   * Subscribe to case updates
   */
  const subscribeToCase = useCallback((caseId: string) => {
    webSocketService.subscribeToCase(caseId);
  }, []);

  /**
   * Unsubscribe from case updates
   */
  const unsubscribeFromCase = useCallback((caseId: string) => {
    webSocketService.unsubscribeFromCase(caseId);
  }, []);

  /**
   * Notify app state change
   */
  const notifyAppStateChange = useCallback((appState: 'foreground' | 'background' | 'inactive') => {
    webSocketService.notifyAppStateChange(appState);
  }, []);

  /**
   * Set up periodic state updates
   */
  useEffect(() => {
    stateUpdateInterval.current = setInterval(() => {
      setState(webSocketService.getState());
    }, 1000);

    return () => {
      if (stateUpdateInterval.current) {
        clearInterval(stateUpdateInterval.current);
      }
    };
  }, []);

  /**
   * Initialize WebSocket connection and event handlers
   */
  useEffect(() => {
    setupEventHandlers();

    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      if (!autoConnect) {
        disconnect();
      }
    };
  }, [setupEventHandlers, autoConnect, isAuthenticated, connect, disconnect]);

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    if (!isAuthenticated && webSocketService.isConnected()) {
      disconnect();
    } else if (isAuthenticated && autoConnect && !webSocketService.isConnected()) {
      connect();
    }
  }, [isAuthenticated, autoConnect, connect, disconnect]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastConnected: state.lastConnected,
    reconnectAttempts: state.reconnectAttempts,
    connect,
    disconnect,
    subscribeToCase,
    unsubscribeFromCase,
    notifyAppStateChange,
  };
};
