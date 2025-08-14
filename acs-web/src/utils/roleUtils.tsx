import React from 'react';
import { 
  Shield, 
  Crown, 
  Server, 
  Building2, 
  MapPin, 
  User,
  UserCog,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface RoleConfig {
  icon: React.ComponentType<any>;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  label: string;
  color: string;
}

export const roleConfigs: Record<string, RoleConfig> = {
  ADMIN: {
    icon: Crown,
    variant: 'default',
    label: 'Admin',
    color: 'text-yellow-600'
  },
  BACKEND_USER: {
    icon: Server,
    variant: 'secondary',
    label: 'Backend User',
    color: 'text-blue-600'
  },
  BACKEND: {
    icon: Server,
    variant: 'secondary',
    label: 'Backend',
    color: 'text-blue-600'
  },
  BANK: {
    icon: Building2,
    variant: 'outline',
    label: 'Bank',
    color: 'text-green-600'
  },
  FIELD: {
    icon: MapPin,
    variant: 'outline',
    label: 'Field',
    color: 'text-purple-600'
  },
  FIELD_AGENT: {
    icon: MapPin,
    variant: 'outline',
    label: 'Field Agent',
    color: 'text-purple-600'
  },
  MANAGER: {
    icon: UserCog,
    variant: 'outline',
    label: 'Manager',
    color: 'text-orange-600'
  },
  VIEWER: {
    icon: User,
    variant: 'outline',
    label: 'Viewer',
    color: 'text-gray-600'
  }
};

export const getRoleIcon = (roleName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const config = roleConfigs[roleName] || roleConfigs.VIEWER;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return <Icon className={`${sizeClasses[size]} ${config.color}`} />;
};

export const getRoleBadge = (roleName: string) => {
  const config = roleConfigs[roleName] || roleConfigs.VIEWER;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const getRoleConfig = (roleName: string): RoleConfig => {
  return roleConfigs[roleName] || roleConfigs.VIEWER;
};
