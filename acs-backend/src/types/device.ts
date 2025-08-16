export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  deviceName?: string | null;
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  pushToken?: string | null;
  notificationsEnabled?: boolean | null;
  notificationPreferences?: any | null;
  isActive: boolean;
  isApproved?: boolean | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  authCode?: string | null;
  authCodeExpiresAt?: Date | null;
  registeredAt?: Date | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  lastActiveAt?: Date | null;
  lastUsed?: Date | null;
  createdAt: Date;
}

