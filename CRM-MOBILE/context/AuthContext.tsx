import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import AsyncStorage from '../polyfills/AsyncStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (updates: Partial<Pick<User, 'profilePhotoUrl'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          const storedUser = await AsyncStorage.getItem('user');
          if(storedUser) {
            setUser(JSON.parse(storedUser));
          }
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to check auth status", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timeout, setting loading to false');
      setIsLoading(false);
    }, 5000);

    checkAuthStatus().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Simulate network delay
      await new Promise(res => setTimeout(res, 1000));

      // Comprehensive validation for required fields
      if (!username.trim()) {
        setIsLoading(false);
        return { success: false, error: 'Username is required' };
      }

      if (!password.trim()) {
        setIsLoading(false);
        return { success: false, error: 'Password is required' };
      }

      // Additional validation rules
      if (username.length < 3) {
        setIsLoading(false);
        return { success: false, error: 'Username must be at least 3 characters long' };
      }

      if (password.length < 4) {
        setIsLoading(false);
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      // Demo authentication logic - In production, this would make an API call
      // For demo purposes, accept specific test credentials or any valid format
      const isValidDemo = (
        (username.toLowerCase() === 'demo' && password === 'demo123') ||
        (username.toLowerCase() === 'admin' && password === 'admin123') ||
        (username.length >= 3 && password.length >= 4)
      );

      if (!isValidDemo) {
        setIsLoading(false);
        return { success: false, error: 'Invalid credentials. Please check your username and password.' };
      }

      // Create or retrieve user data
      const storedUser = await AsyncStorage.getItem('user');
      let mockUser: User;

      if (storedUser && JSON.parse(storedUser).username === username) {
        mockUser = JSON.parse(storedUser);
      } else {
        mockUser = {
          id: `user-${Date.now()}`,
          name: username === 'demo' ? 'Demo User' : username === 'admin' ? 'Administrator' : 'Field Agent',
          username
        };
      }

      // Store authentication data
      await AsyncStorage.setItem('auth_token', 'mock_jwt_token');
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserProfile = async (updates: Partial<Pick<User, 'profilePhotoUrl'>>) => {
    if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
