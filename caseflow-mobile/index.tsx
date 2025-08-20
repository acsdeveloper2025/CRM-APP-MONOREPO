import './index.css';
import { setEnabled as setLogEnabled } from './utils/logger';

// Polyfill Alert for web compatibility
import AlertPolyfill from './polyfills/Alert';
import * as ReactNative from 'react-native';
if (typeof window !== 'undefined') {
  // Patch React Native's Alert for web
  if (ReactNative && ReactNative.Alert) {
    ReactNative.Alert.alert = AlertPolyfill.alert;
  }
}
// Store original console methods before overriding
const originalConsole = {
  log: console.log.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

// Disable verbose logs in production
if (import.meta && import.meta.env && import.meta.env.PROD) {
  setLogEnabled(false);
} else {
  setLogEnabled(true);
}

// Route console.* through our logger (no-op in prod for log/debug)
import * as MobileLogger from './utils/logger';
// Pass original console methods to logger to prevent circular dependency
MobileLogger.setOriginalConsole(originalConsole);

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

const container = document.getElementById('root');
if (!container) {
  console.error('Root container not found!');
  throw new Error('Root container not found');
}

const root = createRoot(container);

try {
  root.render(<App />);
} catch (error) {
  console.error('Error rendering App:', error);
  throw error;
}
