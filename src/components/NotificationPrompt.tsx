import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { isPushSupported, getNotificationPermission, setupPushNotifications } from '../services/pushNotifications';
import { getToken } from '../services/api';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // Only show if push is supported and permission not yet decided
    const token = getToken();
    if (!token) return;
    
    if (!isPushSupported()) return;
    
    const permission = getNotificationPermission();
    if (permission === 'default') {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    const token = getToken();
    if (token) {
      await setupPushNotifications(token);
    }
    setIsEnabling(false);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="notification-prompt">
      <div className="notification-prompt-icon">
        <Bell size={20} />
      </div>
      <div className="notification-prompt-content">
        <p className="notification-prompt-title">Enable Notifications</p>
        <p className="notification-prompt-text">Get alerts for fuel price updates and order status</p>
      </div>
      <div className="notification-prompt-actions">
        <button 
          className="btn btn-sm btn-primary" 
          onClick={handleEnable}
          disabled={isEnabling}
        >
          {isEnabling ? 'Enabling...' : 'Enable'}
        </button>
        <button 
          className="notification-prompt-close" 
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
