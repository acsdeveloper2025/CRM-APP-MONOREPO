import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import AsyncStorage from '../polyfills/AsyncStorage';

export interface DeviceRegistrationInfo {
  deviceId: string; // UUID format for backend
  deviceFingerprint: string; // Unique device fingerprint
  platform: string;
  model?: string;
  osVersion?: string;
  appVersion: string;
  registeredAt: number;
  lastUsed: number;
}

class DeviceService {
  private static instance: DeviceService;
  private deviceInfo: DeviceRegistrationInfo | null = null;
  private readonly DEVICE_UUID_KEY = 'caseflow_device_uuid';
  private readonly DEVICE_REGISTRATION_KEY = 'caseflow_device_registration';

  private constructor() {}

  public static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  /**
   * Generate a standard UUID v4 for device registration
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a unique device fingerprint for identification
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const components: string[] = [];

    try {
      if (Capacitor.isNativePlatform()) {
        // Native platform - use Capacitor Device API
        const deviceInfo = await Device.getInfo();
        const deviceId = await Device.getId();
        
        components.push(deviceInfo.platform || 'unknown');
        components.push(deviceInfo.model || 'unknown');
        components.push(deviceInfo.operatingSystem || 'unknown');
        components.push(deviceInfo.osVersion || 'unknown');
        components.push(deviceId.identifier || 'unknown');
        
        // Add manufacturer if available
        if (deviceInfo.manufacturer) {
          components.push(deviceInfo.manufacturer);
        }
      } else {
        // Web platform - use browser fingerprinting
        if (typeof window !== 'undefined') {
          components.push(navigator.userAgent || 'unknown');
          components.push(navigator.language || 'unknown');
          components.push(screen.width + 'x' + screen.height);
          components.push(screen.colorDepth.toString());
          components.push(new Date().getTimezoneOffset().toString());
          components.push(navigator.platform || 'unknown');
          
          // Add hardware info if available
          if (navigator.hardwareConcurrency) {
            components.push(navigator.hardwareConcurrency.toString());
          }
          
          if (navigator.deviceMemory) {
            components.push(navigator.deviceMemory.toString());
          }
        }
      }
    } catch (error) {
      console.warn('Error generating device fingerprint:', error);
      components.push('fallback-' + Math.random().toString(36).substr(2, 9));
    }

    // Create hash from components
    const fingerprint = components.join('|');
    return this.simpleHash(fingerprint);
  }

  /**
   * Simple hash function for creating consistent fingerprint
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get platform information
   */
  private async getPlatformInfo(): Promise<{ platform: string; model?: string; osVersion?: string }> {
    try {
      if (Capacitor.isNativePlatform()) {
        const deviceInfo = await Device.getInfo();
        return {
          platform: deviceInfo.platform || 'native',
          model: deviceInfo.model,
          osVersion: deviceInfo.osVersion
        };
      } else {
        return {
          platform: 'web',
          model: navigator.userAgent,
          osVersion: navigator.appVersion
        };
      }
    } catch (error) {
      console.warn('Error getting platform info:', error);
      return { platform: 'unknown' };
    }
  }

  /**
   * Get or generate device UUID for backend authentication
   */
  public async getDeviceUUID(): Promise<string> {
    try {
      // Check if device UUID already exists
      const existingUUID = await AsyncStorage.getItem(this.DEVICE_UUID_KEY);
      if (existingUUID && this.isValidUUID(existingUUID)) {
        // Update last used timestamp
        await this.updateLastUsed();
        return existingUUID;
      }

      // Generate new device UUID
      const deviceUUID = this.generateUUID();
      
      // Store device UUID
      await AsyncStorage.setItem(this.DEVICE_UUID_KEY, deviceUUID);
      
      // Create device registration info
      await this.createDeviceRegistration(deviceUUID);
      
      return deviceUUID;
    } catch (error) {
      console.error('Error getting device UUID:', error);
      // Return a temporary UUID that won't be stored
      return this.generateUUID();
    }
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Create device registration information
   */
  private async createDeviceRegistration(deviceUUID: string): Promise<void> {
    try {
      const platformInfo = await this.getPlatformInfo();
      const fingerprint = await this.generateDeviceFingerprint();
      const now = Date.now();

      this.deviceInfo = {
        deviceId: deviceUUID,
        deviceFingerprint: fingerprint,
        platform: platformInfo.platform,
        model: platformInfo.model,
        osVersion: platformInfo.osVersion,
        appVersion: '1.0.0', // You can get this from your app config
        registeredAt: now,
        lastUsed: now
      };

      // Store device registration info
      await AsyncStorage.setItem(this.DEVICE_REGISTRATION_KEY, JSON.stringify(this.deviceInfo));
    } catch (error) {
      console.error('Error creating device registration:', error);
    }
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(): Promise<void> {
    try {
      const registrationData = await AsyncStorage.getItem(this.DEVICE_REGISTRATION_KEY);
      if (registrationData) {
        const registration = JSON.parse(registrationData);
        registration.lastUsed = Date.now();
        await AsyncStorage.setItem(this.DEVICE_REGISTRATION_KEY, JSON.stringify(registration));
        this.deviceInfo = registration;
      }
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }

  /**
   * Get device registration information
   */
  public async getDeviceRegistrationInfo(): Promise<DeviceRegistrationInfo | null> {
    try {
      if (this.deviceInfo) {
        return this.deviceInfo;
      }

      const storedInfo = await AsyncStorage.getItem(this.DEVICE_REGISTRATION_KEY);
      if (storedInfo) {
        this.deviceInfo = JSON.parse(storedInfo);
        return this.deviceInfo;
      }

      // If no registration info exists, create it
      const deviceUUID = await this.getDeviceUUID();
      return this.deviceInfo;
    } catch (error) {
      console.error('Error getting device registration info:', error);
      return null;
    }
  }

  /**
   * Set a specific device UUID (for testing purposes)
   */
  public async setDeviceUUID(deviceUUID: string): Promise<void> {
    try {
      if (!this.isValidUUID(deviceUUID)) {
        throw new Error('Invalid UUID format');
      }

      await AsyncStorage.setItem(this.DEVICE_UUID_KEY, deviceUUID);
      await this.createDeviceRegistration(deviceUUID);
      console.log('Device UUID set for testing:', deviceUUID);
    } catch (error) {
      console.error('Error setting device UUID:', error);
      throw error;
    }
  }

  /**
   * Reset device registration (for admin/testing purposes)
   */
  public async resetDeviceRegistration(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.DEVICE_UUID_KEY);
      await AsyncStorage.removeItem(this.DEVICE_REGISTRATION_KEY);
      this.deviceInfo = null;
    } catch (error) {
      console.error('Error resetting device registration:', error);
    }
  }

  /**
   * Check if device is registered (has UUID)
   */
  public async isDeviceRegistered(): Promise<boolean> {
    try {
      const deviceUUID = await AsyncStorage.getItem(this.DEVICE_UUID_KEY);
      return deviceUUID !== null && this.isValidUUID(deviceUUID);
    } catch (error) {
      console.error('Error checking device registration:', error);
      return false;
    }
  }

  /**
   * Copy device UUID to clipboard
   */
  public async copyDeviceUUIDToClipboard(): Promise<boolean> {
    try {
      const deviceUUID = await this.getDeviceUUID();
      
      // Use web clipboard API for both web and native platforms
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(deviceUUID);
        return true;
      } else if (typeof document !== 'undefined') {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = deviceUUID;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      } else {
        console.warn('Clipboard not supported in this environment');
        return false;
      }
    } catch (error) {
      console.error('Error copying device UUID to clipboard:', error);
      return false;
    }
  }
}

export default DeviceService;
