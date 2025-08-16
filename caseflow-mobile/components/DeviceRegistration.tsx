import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import DeviceService, { DeviceRegistrationInfo } from '../services/deviceService';

interface DeviceRegistrationProps {
  style?: any;
  onRegistrationComplete?: (deviceId: string) => void;
}

const DeviceRegistration: React.FC<DeviceRegistrationProps> = ({ 
  style, 
  onRegistrationComplete 
}) => {
  const [deviceUUID, setDeviceUUID] = useState<string>('');
  const [registrationInfo, setRegistrationInfo] = useState<DeviceRegistrationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [showDeviceId, setShowDeviceId] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  const deviceService = DeviceService.getInstance();

  useEffect(() => {
    initializeDeviceRegistration();
  }, []);

  const initializeDeviceRegistration = async () => {
    try {
      setIsLoading(true);
      
      // Check if device is already registered
      const registered = await deviceService.isDeviceRegistered();
      setIsRegistered(registered);
      
      // Get device UUID
      const uuid = await deviceService.getDeviceUUID();
      setDeviceUUID(uuid);
      
      // Get registration info
      const info = await deviceService.getDeviceRegistrationInfo();
      setRegistrationInfo(info);
      
      // Notify parent component if registration is complete
      if (registered && onRegistrationComplete) {
        onRegistrationComplete(uuid);
      }
    } catch (error) {
      console.error('Error initializing device registration:', error);
      setDeviceUUID('Error generating device UUID');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDeviceId = () => {
    if (!deviceUUID || deviceUUID.startsWith('Error')) {
      Alert.alert('Error', 'Device UUID not available');
      return;
    }
    setShowDeviceId(true);
  };

  const handleCopyDeviceId = async () => {
    if (!deviceUUID || deviceUUID.startsWith('Error')) {
      Alert.alert('Error', 'No valid device UUID to copy');
      return;
    }

    setIsCopying(true);
    setCopyFeedback('');

    try {
      const success = await deviceService.copyDeviceUUIDToClipboard();

      if (success) {
        setCopyFeedback('Copied!');
        // Clear feedback after 2 seconds
        setTimeout(() => setCopyFeedback(''), 2000);
      } else {
        // Fallback: show device UUID in alert for manual copy
        Alert.alert(
          'Device UUID',
          deviceUUID,
          [
            {
              text: 'Close',
              style: 'cancel'
            }
          ]
        );
        setCopyFeedback('UUID shown above');
        setTimeout(() => setCopyFeedback(''), 3000);
      }
    } catch (error) {
      console.error('Error copying device UUID:', error);
      Alert.alert('Error', 'Failed to copy device UUID');
    } finally {
      setIsCopying(false);
    }
  };

  const handleSetTestDeviceId = async () => {
    try {
      // Set the device ID to match the one in the database for mobileuser1
      const testDeviceId = 'c665a14e-408b-4fb1-81c3-b941d5bced8d';
      await deviceService.setDeviceUUID(testDeviceId);

      // Refresh the component
      await initializeDeviceRegistration();

      setCopyFeedback('Test Device ID set!');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (error) {
      console.error('Error setting test device ID:', error);
      setCopyFeedback('Error setting test Device ID');
      setTimeout(() => setCopyFeedback(''), 3000);
    }
  };

  const handleRegenerateDeviceId = async () => {
    Alert.alert(
      'Regenerate Device UUID',
      'This will create a new device UUID. Your administrator will need to re-authenticate this device. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deviceService.resetDeviceRegistration();
              await initializeDeviceRegistration();
              Alert.alert('Success', 'New device UUID generated');
            } catch (error) {
              console.error('Error regenerating device UUID:', error);
              Alert.alert('Error', 'Failed to regenerate device UUID');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatDeviceUUID = (uuid: string) => {
    // Format UUID for better readability
    if (uuid.length === 36 && uuid.includes('-')) {
      return uuid.toUpperCase();
    }
    return uuid;
  };

  return (
    <View style={[{
      backgroundColor: '#1F2937',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    }, style]}>
      
      {/* Section Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          📱 Device Registration
        </Text>
        {isRegistered && (
          <View style={{
            backgroundColor: '#10b981',
            borderRadius: 12,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 8
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              ✓ REGISTERED
            </Text>
          </View>
        )}
      </View>

      {/* Registration Status */}
      {registrationInfo && (
        <View style={{
          backgroundColor: isRegistered ? '#065f46' : '#7c2d12',
          borderRadius: 6,
          padding: 8,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isRegistered ? '#10b981' : '#ea580c'
        }}>
          <Text style={{
            color: isRegistered ? '#d1fae5' : '#fed7aa',
            fontSize: 11,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 4
          }}>
            {isRegistered ? '✅ Device Authenticated' : '⚠️ Pending Authentication'}
          </Text>
          <Text style={{
            color: isRegistered ? '#a7f3d0' : '#fdba74',
            fontSize: 10,
            textAlign: 'center'
          }}>
            Platform: {registrationInfo.platform} | Last Used: {new Date(registrationInfo.lastUsed).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Show Device UUID Button or UUID Display */}
      {!showDeviceId ? (
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#374151',
              borderRadius: 6,
              padding: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#4B5563',
              minHeight: 40
            }}
            onPress={handleShowDeviceId}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Show Device UUID
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6
          }}>
            <Text style={{
              color: '#E5E7EB',
              fontSize: 12,
              fontWeight: '600'
            }}>
              Device UUID (Standard Format)
            </Text>
            <TouchableOpacity
              onPress={() => setShowDeviceId(false)}
              style={{ padding: 2 }}
            >
              <Text style={{
                color: '#9CA3AF',
                fontSize: 11
              }}>
                Hide
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{
            backgroundColor: '#374151',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#4B5563',
            position: 'relative'
          }}>
            <TextInput
              style={{
                padding: 8,
                color: '#ffffff',
                fontSize: 12,
                fontFamily: 'monospace',
                minHeight: 36,
                textAlign: 'center'
              }}
              value={formatDeviceUUID(deviceUUID)}
              editable={false}
              multiline={false}
              textAlignVertical="center"
            />

            {/* Copy Feedback Overlay */}
            {copyFeedback && (
              <View style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#10b981',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderTopRightRadius: 6,
                borderBottomLeftRadius: 6
              }}>
                <Text style={{
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}>
                  {copyFeedback}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons - Only show when device UUID is visible */}
      {showDeviceId && (
        <View style={{
          flexDirection: 'row',
          gap: 8,
          marginBottom: 12
        }}>
          {/* Copy Button */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: isCopying ? '#6B7280' : '#3b82f6',
              borderRadius: 6,
              padding: 10,
              alignItems: 'center',
              minHeight: 36
            }}
            onPress={handleCopyDeviceId}
            disabled={isLoading || isCopying || deviceUUID.startsWith('Error')}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {isCopying ? 'Copying...' : 'Copy UUID'}
            </Text>
          </TouchableOpacity>

          {/* Test Device ID Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#10b981',
              borderRadius: 6,
              padding: 10,
              alignItems: 'center',
              minWidth: 70
            }}
            onPress={handleSetTestDeviceId}
            disabled={isLoading}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 11,
              fontWeight: '600'
            }}>
              Set Test ID
            </Text>
          </TouchableOpacity>

          {/* Regenerate Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#6B7280',
              borderRadius: 6,
              padding: 10,
              alignItems: 'center',
              minWidth: 70
            }}
            onPress={handleRegenerateDeviceId}
            disabled={isLoading}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 11,
              fontWeight: '600'
            }}>
              Regenerate
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={{
        backgroundColor: '#1e40af',
        borderRadius: 6,
        padding: 8,
        borderWidth: 1,
        borderColor: '#3b82f6'
      }}>
        <Text style={{
          color: '#dbeafe',
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
          textAlign: 'center'
        }}>
          🔐 Field Agent Authentication
        </Text>
        <Text style={{
          color: '#bfdbfe',
          fontSize: 10,
          lineHeight: 14,
          textAlign: 'center'
        }}>
          {showDeviceId
            ? 'Copy the UUID above and provide it to your administrator for device authentication in the user management system.'
            : 'Click "Show Device UUID" to get your unique device identifier for administrator approval.'
          }
        </Text>
      </View>
    </View>
  );
};

export default DeviceRegistration;
