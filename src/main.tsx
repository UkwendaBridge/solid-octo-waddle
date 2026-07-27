import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Keep the splash up long enough to read the brand, but no longer than that:
// it goes as soon as the app has painted, or at 800ms, whichever is later.
const SPLASH_MIN_MS = 800;

const hideSplash = () => {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  requestAnimationFrame(() => {
    // performance.now() is ms since navigation started, i.e. how long the
    // splash has actually been on screen.
    const remaining = Math.max(0, SPLASH_MIN_MS - performance.now());
    setTimeout(() => {
      splash.classList.add('hidden');
      // Remove from DOM after the fade-out
      setTimeout(() => splash.remove(), 400);
    }, remaining);
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide splash after initial render
hideSplash();
