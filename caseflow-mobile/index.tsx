import './index.css';
import { setEnabled as setLogEnabled } from './utils/logger';
// Disable verbose logs in production
if (import.meta && import.meta.env && import.meta.env.PROD) {
  setLogEnabled(false);
} else {
  setLogEnabled(true);
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
