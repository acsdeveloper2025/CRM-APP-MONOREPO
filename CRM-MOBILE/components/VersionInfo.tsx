/**
 * Version Information Component
 * Displays app version, build info, and update status in profile/settings
 */

import React, { useState, useEffect } from 'react';
import {
  SmartphoneIcon,
  InfoIcon,
  RefreshIcon,
  DownloadIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  CalendarIcon,
  HashIcon,
  GlobeIcon,
  SettingsIcon,
  EyeIcon,
  ClockIcon
} from './Icons';
import versionService, { VersionInfo, UpdateInfo } from '../services/versionService';

interface VersionInfoProps {
  showDetailed?: boolean;
  showUpdateButton?: boolean;
  className?: string;
}

export const VersionInfoComponent: React.FC<VersionInfoProps> = ({
  showDetailed = true,
  showUpdateButton = true,
  className = '',
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    loadVersionInfo();
    loadUpdateInfo();
  }, []);

  const loadVersionInfo = () => {
    const info = versionService.getCurrentVersion();
    setVersionInfo(info);
  };

  const loadUpdateInfo = () => {
    const info = versionService.getLastUpdateInfo();
    setUpdateInfo(info);
  };

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      const update = await versionService.checkForUpdates(true);
      setUpdateInfo(update);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatBuildDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getUpdateStatus = () => {
    if (!updateInfo) {
      return {
        icon: <CheckCircle2Icon width={20} height={20} color="#10b981" />,
        text: 'Up to date',
        color: 'text-green-600',
      };
    }

    if (updateInfo.required) {
      return {
        icon: <AlertTriangleIcon width={20} height={20} color="#ef4444" />,
        text: 'Update required',
        color: 'text-red-600',
      };
    }

    return {
      icon: <DownloadIcon width={20} height={20} color="#3b82f6" />,
      text: 'Update available',
      color: 'text-blue-600',
    };
  };

  if (!versionInfo) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const updateStatus = getUpdateStatus();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SmartphoneIcon width={24} height={24} color="#4b5563" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">App Version</h3>
              <p className="text-sm text-gray-600">
                {versionService.formatVersion(versionInfo.current, versionInfo.buildNumber)}
              </p>
            </div>
          </div>
          
          {/* Update Status Badge */}
          <div className={`flex items-center space-x-2 ${updateStatus.color}`}>
            {updateStatus.icon}
            <span className="text-sm font-medium">{updateStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetailed && (
        <div className="p-4 space-y-4">
          {/* Version Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <HashIcon width={16} height={16} color="#9ca3af" />
              <div>
                <p className="text-gray-600">Build Number</p>
                <p className="font-medium text-gray-900">{versionInfo.buildNumber}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <GlobeIcon width={16} height={16} color="#9ca3af" />
              <div>
                <p className="text-gray-600">Environment</p>
                <p className="font-medium text-gray-900 capitalize">{versionInfo.environment}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 col-span-2">
              <CalendarIcon width={16} height={16} color="#9ca3af" />
              <div>
                <p className="text-gray-600">Build Date</p>
                <p className="font-medium text-gray-900">{formatBuildDate(versionInfo.buildDate)}</p>
              </div>
            </div>
          </div>

          {/* Update Information */}
          {updateInfo && (
            <div className="bg-gray-50 rounded-md p-3">
              <h4 className="font-medium text-gray-900 mb-2">Available Update</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latest Version:</span>
                  <span className="font-medium text-gray-900">{updateInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Release Date:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(updateInfo.releaseDate).toLocaleDateString()}
                  </span>
                </div>
                {updateInfo.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Download Size:</span>
                    <span className="font-medium text-gray-900">{updateInfo.size}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Update Check */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <ClockIcon width={16} height={16} color="#6b7280" />
              <span>
                Last checked: {lastChecked ? formatLastChecked(lastChecked) : 'Never'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showUpdateButton && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check for Updates
                </>
              )}
            </button>
            
            {updateInfo && (
              <button
                onClick={() => {
                  if (updateInfo.downloadUrl) {
                    window.open(updateInfo.downloadUrl, '_blank');
                  }
                }}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white ${
                  updateInfo.required 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                {updateInfo.required ? 'Update Now' : 'Download Update'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CompactVersionInfoProps {
  className?: string;
  onClick?: () => void;
}

export const CompactVersionInfo: React.FC<CompactVersionInfoProps> = ({
  className = '',
  onClick,
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const info = versionService.getCurrentVersion();
    setVersionInfo(info);
    
    const update = versionService.getLastUpdateInfo();
    setUpdateInfo(update);
  }, []);

  if (!versionInfo) return null;

  const hasUpdate = updateInfo?.available;

  return (
    <div 
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <InfoIcon width={20} height={20} color="#9ca3af" />
        <div>
          <p className="text-sm font-medium text-gray-900">App Version</p>
          <p className="text-xs text-gray-600">
            {versionService.formatVersion(versionInfo.current)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {hasUpdate && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
        <EyeIcon width={16} height={16} color="#9ca3af" />
      </div>
    </div>
  );
};
