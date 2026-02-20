import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update notifications
registerSW({
  onNeedRefresh() {
    console.log('✨ New version available! Auto-updating...');
    // Show a brief notification before reload
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      font-family: system-ui;
      font-size: 14px;
      font-weight: 500;
    `;
    banner.textContent = '✨ Update available! Refreshing...';
    document.body.appendChild(banner);

    // Auto-reload after showing notification
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  },
  onOfflineReady() {
    console.log('✓ App ready to work offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
