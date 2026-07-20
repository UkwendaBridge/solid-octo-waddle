import { useState } from 'react';
import { Fuel, LogIn, Loader2, Lock, Eye, EyeOff, User } from 'lucide-react';

interface AttendantLoginPageProps {
  onLogin: (attendantId: string) => void;
}

export default function AttendantLoginPage({ onLogin }: AttendantLoginPageProps) {
  const [attendantId, setAttendantId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!attendantId || !pin) {
      setError('Please enter your attendant ID and PIN');
      return;
    }

    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin(attendantId);
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-body">
        <div className="login-container">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Fuel size={28} />
            </div>
            <span className="login-logo-name">Attendant Authentication</span>
          </div>

          <div className="login-brand">
            <h1>Attendant Sign In</h1>
            <p>Enter your credentials to authorize the order</p>
          </div>

          <div className="login-card">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="attendantId">Attendant ID</label>
                <div className="input-with-icon">
                  <User className="input-icon-left" size={18} />
                  <input
                    id="attendantId"
                    type="text"
                    value={attendantId}
                    onChange={(e) => setAttendantId(e.target.value)}
                    placeholder="Enter your attendant ID"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pin">PIN</label>
                <div className="input-with-icon">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter your PIN"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPin(!showPin)}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Authorize Order
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
