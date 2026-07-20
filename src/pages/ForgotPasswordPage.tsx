import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Fuel, Mail, ArrowLeft, Loader2, CheckCircle2, Building2, User, Truck } from 'lucide-react';
import { omcAuth, customerAuth, driverAuth } from '../services/api';
import type { UserRole } from '../types';

export default function ForgotPasswordPage() {
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email');
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (role === 'omc') {
        result = await omcAuth.forgotPassword(email);
      } else if (role === 'customer') {
        result = await customerAuth.forgotPassword(email);
      } else {
        result = await driverAuth.forgotPassword(email);
      }

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset instructions');
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
              <h1>Check Your Email</h1>
              <p>Password reset instructions sent</p>
            </div>

            <div className="login-card">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={64} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
                  We've sent password reset instructions to {email}. Check your inbox.
                </p>
                <Link to="/reset-password" className="btn btn-primary" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                  Enter Reset Code
                </Link>
                <br />
                <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Back to Sign In
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
            <h1>Forgot Password</h1>
            <p>Enter your email to reset your password</p>
          </div>

          <div className="login-card">
            <div className="role-tabs">
              <button
                className={`role-tab ${role === 'omc' ? 'active' : ''}`}
                onClick={() => { setRole('omc'); setError(''); setEmail(''); }}
              >
                <Building2 size={18} />
                OMC
              </button>
              <button
                className={`role-tab ${role === 'customer' ? 'active' : ''}`}
                onClick={() => { setRole('customer'); setError(''); setEmail(''); }}
              >
                <User size={18} />
                Customer
              </button>
              <button
                className={`role-tab ${role === 'driver' ? 'active' : ''}`}
                onClick={() => { setRole('driver'); setError(''); setEmail(''); }}
              >
                <Truck size={18} />
                Driver
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ paddingLeft: '40px' }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Sending...</>
                ) : (
                  'Send Reset Instructions'
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
