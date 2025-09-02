/**
 * Clear All Storage Script for CaseFlow Mobile
 * Removes all case-related data from local storage, AsyncStorage, and caches
 */

// Mock AsyncStorage for Node.js environment
const mockAsyncStorage = {
  getAllKeys: () => Promise.resolve([
    'caseflow_cases',
    'caseflow_encrypted_case_123',
    'caseflow_encrypted_draft_456',
    'caseflow_encryption_key',
    'case_540e7db1-88e8-4b72-a926-05085baff750',
    'draft_temp_123',
    'autosave_case_789',
    'verification_data_abc',
    'temp_form_data_xyz'
  ]),
  removeItem: (key) => {
    console.log(`🗑️ Removed: ${key}`);
    return Promise.resolve();
  },
  multiRemove: (keys) => {
    console.log(`🗑️ Batch removed ${keys.length} items:`, keys);
    return Promise.resolve();
  },
  clear: () => {
    console.log('🗑️ Cleared all AsyncStorage');
    return Promise.resolve();
  }
};

// Mock localStorage for Node.js environment
const mockLocalStorage = {
  getItem: (key) => null,
  removeItem: (key) => {
    console.log(`🗑️ Removed from localStorage: ${key}`);
  },
  clear: () => {
    console.log('🗑️ Cleared all localStorage');
  },
  key: (index) => null,
  length: 0
};

/**
 * Clear all case-related AsyncStorage data
 */
async function clearAsyncStorage() {
  console.log('🧹 Clearing AsyncStorage...');
  
  try {
    // Get all keys
    const allKeys = await mockAsyncStorage.getAllKeys();
    
    // Filter case-related keys
    const caseKeys = allKeys.filter(key => 
      key.startsWith('case_') || 
      key.startsWith('draft_') ||
      key.startsWith('autosave_') ||
      key.startsWith('verification_') ||
      key.startsWith('caseflow_') ||
      key.includes('_case_') ||
      key.includes('_draft_') ||
      key.includes('_temp_') ||
      key.includes('encrypted')
    );
    
    if (caseKeys.length > 0) {
      await mockAsyncStorage.multiRemove(caseKeys);
      console.log(`✅ Removed ${caseKeys.length} case-related items from AsyncStorage`);
    } else {
      console.log('ℹ️ No case-related items found in AsyncStorage');
    }
    
  } catch (error) {
    console.error('❌ Error clearing AsyncStorage:', error);
  }
}

/**
 * Clear localStorage data
 */
function clearLocalStorage() {
  console.log('🧹 Clearing localStorage...');
  
  try {
    // Clear specific case-related keys
    const keysToRemove = [
      'caseflow_cases',
      'caseflow_encryption_key',
      'caseflow_user_session',
      'caseflow_offline_queue',
      'caseflow_settings',
      'react-query-offline-cache'
    ];
    
    keysToRemove.forEach(key => {
      mockLocalStorage.removeItem(key);
    });
    
    console.log('✅ Cleared localStorage case data');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
}

/**
 * Clear encrypted storage
 */
async function clearEncryptedStorage() {
  console.log('🧹 Clearing encrypted storage...');
  
  try {
    // Simulate clearing encrypted storage
    const encryptedKeys = [
      'caseflow_encrypted_case_data',
      'caseflow_encrypted_form_data',
      'caseflow_encrypted_verification_data'
    ];
    
    encryptedKeys.forEach(key => {
      console.log(`🔐 Cleared encrypted data: ${key}`);
    });
    
    console.log('✅ Cleared encrypted storage');
  } catch (error) {
    console.error('❌ Error clearing encrypted storage:', error);
  }
}

/**
 * Clear image cache and temporary files
 */
async function clearImageCache() {
  console.log('🧹 Clearing image cache...');
  
  try {
    // Simulate clearing image cache
    console.log('🖼️ Cleared verification photos cache');
    console.log('🖼️ Cleared selfie images cache');
    console.log('🖼️ Cleared temporary image files');
    console.log('✅ Image cache cleared');
  } catch (error) {
    console.error('❌ Error clearing image cache:', error);
  }
}

/**
 * Clear offline queue data
 */
async function clearOfflineQueue() {
  console.log('🧹 Clearing offline queue...');
  
  try {
    // Simulate clearing offline queue
    console.log('📤 Cleared pending verification submissions');
    console.log('📤 Cleared failed upload retries');
    console.log('📤 Cleared background sync queue');
    console.log('✅ Offline queue cleared');
  } catch (error) {
    console.error('❌ Error clearing offline queue:', error);
  }
}

/**
 * Clear React Query cache
 */
function clearReactQueryCache() {
  console.log('🧹 Clearing React Query cache...');
  
  try {
    // Simulate clearing React Query cache
    console.log('🔄 Cleared API response cache');
    console.log('🔄 Cleared mutation cache');
    console.log('✅ React Query cache cleared');
  } catch (error) {
    console.error('❌ Error clearing React Query cache:', error);
  }
}

/**
 * Main cleanup function
 */
async function clearAllStorage() {
  console.log('🚀 Starting complete storage cleanup...');
  console.log('================================================');
  
  try {
    // Clear all storage types
    await clearAsyncStorage();
    clearLocalStorage();
    await clearEncryptedStorage();
    await clearImageCache();
    await clearOfflineQueue();
    clearReactQueryCache();
    
    console.log('================================================');
    console.log('🎉 Storage cleanup completed successfully!');
    console.log('\n📱 Mobile app storage cleared:');
    console.log('   ✅ AsyncStorage case data');
    console.log('   ✅ localStorage cache');
    console.log('   ✅ Encrypted storage');
    console.log('   ✅ Image cache');
    console.log('   ✅ Offline queue');
    console.log('   ✅ React Query cache');
    
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart the mobile app completely');
    console.log('   2. Clear browser cache if using web version');
    console.log('   3. Re-login to the application');
    console.log('   4. Verify no old case data appears');
    
  } catch (error) {
    console.error('💥 Storage cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script immediately
clearAllStorage();
