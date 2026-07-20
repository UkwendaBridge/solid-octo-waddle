import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DevBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="dev-banner">
      <AlertTriangle size={16} />
      <span>This page uses demo data — API integration pending.</span>
      <button className="dev-banner-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
