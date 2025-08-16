// Production-safe logger utility for caseflow-mobile
// Usage: import { log, warn, error, debug, setEnabled } from './utils/logger'
// In production builds (NODE_ENV === 'production'), debug and log can be disabled.

const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
let enabled = !isProd; // default: disable in production, enable otherwise

export function setEnabled(value: boolean) {
  enabled = value;
}

export function log(...args: any[]) {
  if (!enabled) return;
  // Use console.info to distinguish from stray console.log
  if (typeof console !== 'undefined' && console.info) console.info(...args);
}

export function debug(...args: any[]) {
  if (!enabled) return;
  if (typeof console !== 'undefined' && console.debug) console.debug(...args);
}

export function warn(...args: any[]) {
  if (typeof console !== 'undefined' && console.warn) console.warn(...args);
}

export function error(...args: any[]) {
  if (typeof console !== 'undefined' && console.error) console.error(...args);
}

// Optional: provide a grouped logger
export const logger = { log, debug, warn, error, setEnabled };

