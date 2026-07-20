import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fuel, Key, Lock, ArrowLeft, Loader2, CheckCircle2, Building2, User, Truck, Eye, EyeOff } from 'lucide-react';
import { omcAuth, customerAuth, driverAuth } from '../services/api';
import type { UserRole } from '../types';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !token || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (role === 'omc') {
        result = await omcAuth.resetPassword(email, token, newPassword);
      } else if (role === 'customer') {
        result = await customerAuth.resetPassword(email, token, newPassword);
      } else {
        result = await driverAuth.resetPassword(email, token, newPassword);
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-topbar">
          <div className="login-topbar-brand">
            <div className="login-topbar-icon">
              <Fuel size={20} />
            </div>
            <span className="login-topbar-text">Maestro Fuel</span>
          </div>
        </div>

        <div className="login-body">
          <div className="login-container">
            <div className="login-brand">
              <h1>Password Reset!</h1>
              <p>Your password has been changed</p>
            </div>

            <div className="login-card">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={64} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
                  Your password has been reset successfully. Redirecting to login...
                </p>
                <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                  Sign In Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-topbar">
        <div className="login-topbar-brand">
          <div className="login-topbar-icon">
            <Fuel size={20} />
          </div>
          <span className="login-topbar-text">Maestro Fuel</span>
        </div>
      </div>

      <div className="login-body">
        <div className="login-container">
          <div className="login-brand">
            <h1>Reset Password</h1>
            <p>Enter your reset code and new password</p>
          </div>

          <div className="login-card">
            <div className="role-tabs">
              <button
                className={`role-tab ${role === 'omc' ? 'active' : ''}`}
                onClick={() => { setRole('omc'); setError(''); }}
              >
                <Building2 size={18} />
                OMC
              </button>
              <button
                className={`role-tab ${role === 'customer' ? 'active' : ''}`}
                onClick={() => { setRole('customer'); setError(''); }}
              >
                <User size={18} />
                Customer
              </button>
              <button
                className={`role-tab ${role === 'driver' ? 'active' : ''}`}
                onClick={() => { setRole('driver'); setError(''); }}
              >
                <Truck size={18} />
                Driver
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="token">Reset Code</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    id="token"
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Enter reset code from email"
                    style={{ paddingLeft: '40px' }}
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-secondary)',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{ paddingLeft: '40px' }}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Resetting...</>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
