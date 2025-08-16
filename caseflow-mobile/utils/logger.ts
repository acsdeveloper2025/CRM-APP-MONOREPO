// Production-safe logger utility for caseflow-mobile
// Usage: import { log, warn, error, debug, setEnabled } from './utils/logger'
// In production builds (NODE_ENV === 'production'), debug and log can be disabled.

const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
let enabled = !isProd; // default: disable in production, enable otherwise

// Store original console methods to prevent circular dependency
let originalConsole: any = null;

export function setOriginalConsole(console: any) {
  originalConsole = console;
}

export function setEnabled(value: boolean) {
  enabled = value;
}

export function log(...args: any[]) {
  if (!enabled) return;
  // Use original console.info to prevent circular dependency
  if (originalConsole && originalConsole.info) {
    originalConsole.info(...args);
  } else if (typeof console !== 'undefined' && console.info) {
    console.info(...args);
  }
}

export function debug(...args: any[]) {
  if (!enabled) return;
  if (originalConsole && originalConsole.debug) {
    originalConsole.debug(...args);
  } else if (typeof console !== 'undefined' && console.debug) {
    console.debug(...args);
  }
}

export function warn(...args: any[]) {
  if (originalConsole && originalConsole.warn) {
    originalConsole.warn(...args);
  } else if (typeof console !== 'undefined' && console.warn) {
    console.warn(...args);
  }
}

export function error(...args: any[]) {
  if (originalConsole && originalConsole.error) {
    originalConsole.error(...args);
  } else if (typeof console !== 'undefined' && console.error) {
    console.error(...args);
  }
}

// Optional: provide a grouped logger
export const logger = { log, debug, warn, error, setEnabled };

