import './index.css';
import { setEnabled as setLogEnabled } from './utils/logger';

// Polyfill Alert for web compatibility
import AlertPolyfill from './polyfills/Alert';
if (typeof window !== 'undefined') {
  // Patch React Native's Alert for web
  const ReactNative = require('react-native');
  if (ReactNative && ReactNative.Alert) {
    ReactNative.Alert.alert = AlertPolyfill.alert;
  }
}
// Disable verbose logs in production
if (import.meta && import.meta.env && import.meta.env.PROD) {
  setLogEnabled(false);
} else {
  setLogEnabled(true);
}
// Route console.* through our logger (no-op in prod for log/debug)
import * as MobileLogger from './utils/logger';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bind = (fn?: (...args: any[]) => void, fallback?: (...args: any[]) => void) => (...args: any[]) => (fn || fallback)?.(...args);
console.log = bind((...a) => MobileLogger.log(...a));
console.debug = bind((...a) => MobileLogger.debug(...a));
console.info = bind((...a) => MobileLogger.log(...a));
console.warn = bind((...a) => MobileLogger.warn(...a));
console.error = bind((...a) => MobileLogger.error(...a));


import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🚀 CaseFlow Mobile: Starting application...');

const container = document.getElementById('root');
if (!container) {
  console.error('❌ Root container not found!');
  throw new Error('Root container not found');
}

console.log('✅ Root container found, creating React root...');
const root = createRoot(container);

try {
  console.log('✅ Rendering App component...');
  root.render(<App />);
  console.log('✅ App component rendered successfully!');
} catch (error) {
  console.error('❌ Error rendering App:', error);
  throw error;
}
