import { Role } from './auth';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  phone?: string;
  role: Role;
  role_id?: string;
  role_name?: string;
  employeeId: string;
  designation: string;
  department?: string; // Legacy field for backward compatibility
  department_id?: string;
  department_name?: string;
  profilePhotoUrl?: string;
  isActive?: boolean;
  is_active?: boolean; // API uses snake_case
  lastLoginAt?: string;
  last_login?: string; // API uses snake_case
  createdAt?: string;
  created_at?: string; // API uses snake_case
  updatedAt?: string;
  updated_at?: string; // API uses snake_case
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: Role;
  employeeId?: string;
  designation?: string;
  department?: string;
  profilePhotoUrl?: string;
  isActive?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  userId: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  timestamp: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    role: Role;
    count: number;
  }[];
  usersByDepartment: {
    department: string;
    count: number;
  }[];
  recentLogins: {
    userId: string;
    userName: string;
    lastLoginAt: string;
  }[];
}

// Role and Department Management Types
export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  users: Permission;
  roles: Permission;
  departments: Permission;
  locations: Permission;
  clients: Permission;
  cases: Permission;
  reports: Permission;
  settings: Permission;
}

export interface RoleData {
  id: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_name?: string;
  updated_by_name?: string;
  user_count: number;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  department_head_id?: string;
  department_head_name?: string;
  parent_department_id?: string;
  parent_department_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  created_by_name?: string;
  updated_by_name?: string;
  user_count: number;
  subdepartment_count: number;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: RolePermissions;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
  is_active?: boolean;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  department_head_id?: string;
  parent_department_id?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  department_head_id?: string;
  parent_department_id?: string;
  is_active?: boolean;
}

// Designation types
export interface Designation {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CreateDesignationRequest {
  name: string;
  description?: string;
  department_id?: string;
  is_active?: boolean;
}

export interface UpdateDesignationRequest {
  name?: string;
  description?: string;
  department_id?: string;
  is_active?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
}

export interface RolePermission {
  role: Role;
  permissions: UserPermission[];
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  profilePhotoUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  stats: {
    totalCases: number;
    completedCases: number;
    pendingCases: number;
    averageRating: number;
    totalCommissions: number;
  };
  recentActivity: UserActivity[];
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_role';
  data?: {
    role?: Role;
    reason?: string;
  };
}

export interface UserImportData {
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  password?: string;
}

export interface UserExportData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  employeeId: string;
  designation: string;
  department: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  totalCases: number;
  completedCases: number;
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}
