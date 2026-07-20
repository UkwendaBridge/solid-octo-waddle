import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-overlay">
      <div className="offline-content">
        <div className="offline-icon">
          <WifiOff size={64} />
        </div>
        <h1 className="offline-title">CONNECT TO INTERNET</h1>
        <p className="offline-message">Please check your connection and try again</p>
      </div>
    </div>
  );
}
