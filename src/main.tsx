import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline and Installability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Ensure worker is activated
        if (reg.installing) console.log('[PWA] Service Worker installing');
        else if (reg.waiting) console.log('[PWA] Service Worker waiting');
        else if (reg.active) console.log('[PWA] Service Worker active');
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration error:', err);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('DOMContentLoaded', registerSW);
    window.addEventListener('load', registerSW);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
