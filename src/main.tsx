import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Hide splash screen after app mounts (minimum 6 seconds)
const hideSplash = () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    // Wait at least 6 seconds before hiding
    setTimeout(() => {
      splash.classList.add('hidden');
      // Remove from DOM after animation
      setTimeout(() => splash.remove(), 400);
    }, 6000);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide splash after initial render
hideSplash();
