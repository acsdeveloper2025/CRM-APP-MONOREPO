import { apiService } from './api';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

interface UuidLoginRequest {
  authUuid: string; // This is the device UUID from mobile app pattern
  deviceId: string; // Same as authUuid for consistency
  platform?: string;
  appVersion?: string;
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse['data']>('/auth/login', credentials);

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
    }

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  }

  async uuidLogin(credentials: UuidLoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse['data']>('/auth/uuid-login', credentials);

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      localStorage.setItem('authUser', JSON.stringify(response.data.user));
    }

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('authUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  async refreshUserData(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          localStorage.setItem('authUser', JSON.stringify(result.data));
          return result.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
