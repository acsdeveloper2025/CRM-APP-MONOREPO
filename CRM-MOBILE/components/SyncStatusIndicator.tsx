import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CaseStatusService from '../services/caseStatusService';
import AuditService from '../services/auditService';
import CaseCounterService from '../services/caseCounterService';
import NetworkService from '../services/networkService';

/**
 * Sync Status Indicator Component
 * Shows pending case status updates and audit logs that need to be synced
 */

interface SyncStatus {
  pendingStatusUpdates: number;
  pendingAuditLogs: number;
  isOnline: boolean;
  lastSyncAttempt?: string;
  isSyncing: boolean;
}

const SyncStatusIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingStatusUpdates: 0,
    pendingAuditLogs: 0,
    isOnline: true,
    isSyncing: false,
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    updateSyncStatus();
    
    // Update sync status every 30 seconds
    const interval = setInterval(updateSyncStatus, 30000);
    
    // Listen for network changes
    const handleNetworkChange = (networkState: any) => {
      setSyncStatus(prev => {
        const newState = {
          ...prev,
          isOnline: networkState.isOnline,
        };

        // Trigger sync when coming back online
        if (networkState.isOnline && !prev.isOnline) {
          setTimeout(() => handleManualSync(), 1000);
        }

        return newState;
      });
    };

    NetworkService.addNetworkListener(handleNetworkChange);

    return () => {
      clearInterval(interval);
      NetworkService.removeNetworkListener(handleNetworkChange);
    };
  }, []);

  const updateSyncStatus = async () => {
    try {
      // Clean up duplicate audit logs first
      await AuditService.cleanupDuplicateAuditLogs();

      const [pendingUpdates, pendingLogs] = await Promise.all([
        CaseStatusService.getPendingUpdatesCount(),
        AuditService.getUnsyncedLogsCount(),
      ]);

      setSyncStatus(prev => ({
        ...prev,
        pendingStatusUpdates: pendingUpdates,
        pendingAuditLogs: pendingLogs,
        isOnline: NetworkService.isOnline(),
      }));
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  };

  const handleManualSync = async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      console.log('🔄 Starting manual sync...');

      // Sync pending status updates
      const statusSyncResult = await CaseStatusService.syncPendingUpdates();
      console.log(`📊 Status sync: ${statusSyncResult.synced} synced, ${statusSyncResult.failed} failed`);

      // Sync pending audit logs
      const auditSyncResult = await AuditService.syncAuditLogs();
      console.log(`📝 Audit sync: ${auditSyncResult.synced} synced, ${auditSyncResult.failed} failed`);

      // Update sync status
      await updateSyncStatus();

      setSyncStatus(prev => ({
        ...prev,
        lastSyncAttempt: new Date().toISOString(),
      }));

      console.log('✅ Manual sync completed');
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const getTotalPending = () => {
    return syncStatus.pendingStatusUpdates + syncStatus.pendingAuditLogs;
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return '#dc3545'; // Red - offline
    if (getTotalPending() > 0) return '#fd7e14'; // Orange - pending sync
    return '#28a745'; // Green - all synced
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (getTotalPending() > 0) return `${getTotalPending()} pending`;
    return 'Synced';
  };

  const shouldShowIndicator = () => {
    // Show if offline, has pending items, or currently syncing
    return !syncStatus.isOnline || getTotalPending() > 0 || syncStatus.isSyncing;
  };

  if (!shouldShowIndicator()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.indicator, { backgroundColor: getStatusColor() }]}
        onPress={() => setShowDetails(!showDetails)}
        disabled={syncStatus.isSyncing}
      >
        <View style={styles.indicatorContent}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
          
          {syncStatus.isOnline && getTotalPending() > 0 && !syncStatus.isSyncing && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleManualSync}
            >
              <Text style={styles.syncButtonText}>↻</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>Sync Status Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network:</Text>
            <Text style={[styles.detailValue, { color: syncStatus.isOnline ? '#28a745' : '#dc3545' }]}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          {syncStatus.pendingStatusUpdates > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pending Status Updates:</Text>
              <Text style={styles.detailValue}>{syncStatus.pendingStatusUpdates}</Text>
            </View>
          )}

          {syncStatus.pendingAuditLogs > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pending Audit Logs:</Text>
              <Text style={styles.detailValue}>{syncStatus.pendingAuditLogs}</Text>
            </View>
          )}

          {syncStatus.lastSyncAttempt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Sync:</Text>
              <Text style={styles.detailValue}>
                {new Date(syncStatus.lastSyncAttempt).toLocaleTimeString()}
              </Text>
            </View>
          )}

          <Text style={styles.helpText}>
            {syncStatus.isOnline 
              ? 'Tap the sync button to manually sync pending changes.'
              : 'Changes will sync automatically when you come back online.'
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  indicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  details: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 14,
  },
});

export default SyncStatusIndicator;
