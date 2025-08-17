// Role enum for consistent usage
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BACKEND = 'BACKEND',
  BANK = 'BANK',
  FIELD = 'FIELD',
  FIELD_AGENT = 'FIELD_AGENT' // UUID-based authentication for mobile app
}

export interface LoginRequest {
  username: string;
  password: string;
  deviceId?: string; // For FIELD agents (required on web+mobile)
  macAddress?: string; // For non-field users (required on web)
}

// UUID-based authentication for FIELD_AGENT mobile users only
export interface FieldAgentUuidLoginRequest {
  authUuid: string; // UUID authentication token for field agents
  deviceId: string; // Required for mobile app identification
  platform?: 'IOS' | 'ANDROID'; // Mobile platform
  appVersion?: string; // CaseFlow mobile app version
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      role: Role;
      employeeId: string;
      designation: string;
      department: string;
      profilePhotoUrl?: string;
      deviceId?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface DeviceRegistrationRequest {
  deviceId: string;
  platform: 'IOS' | 'ANDROID';
  model: string;
  osVersion: string;
  appVersion: string;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    deviceId: string;
    registeredAt: string;
  };
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
  deviceId?: string;
  authMethod?: 'PASSWORD' | 'UUID'; // Authentication method used
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  deviceId?: string;
  authMethod?: 'PASSWORD' | 'UUID'; // Authentication method used
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: Role;
    deviceId?: string;
  };
}
