import './index.css';
import { setEnabled as setLogEnabled } from './utils/logger';
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

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
