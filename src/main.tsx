import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App.tsx';
import './index.css';
import { setupTabTitleEffect } from './utils/tabTitle';

// Initialize Vercel Web Analytics
inject();

// Setup tab title effect
setupTabTitleEffect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
