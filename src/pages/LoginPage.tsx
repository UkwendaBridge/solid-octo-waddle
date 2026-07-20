import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Fuel, LogIn, Building2, User, Truck, Loader2,
  Mail, Phone, Lock, Eye, EyeOff, Droplets, MapPin, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

const ROLES: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: 'omc',      label: 'OMC',      icon: <Building2 size={15} /> },
  { value: 'customer', label: 'Customer', icon: <User size={15} /> },
  { value: 'driver',   label: 'Driver',   icon: <Truck size={15} /> },
];

export default function LoginPage() {
  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('customer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const roleIndex = ROLES.findIndex(r => r.value === role);

  const handleRoleChange = (r: UserRole) => {
    setRole(r);
    setError('');
    setIdentifier('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError(role === 'driver' ? 'Please enter phone number and password' : 'Please enter email and password');
      return;
    }

    const success = await login(identifier, password, role);
    if (success) {
      if (role === 'omc') navigate('/omc');
      else if (role === 'customer') navigate('/dashboard');
      else if (role === 'driver') navigate('/driver');
    } else {
      setError(authError || 'Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      {/* ── Left panel: form ── */}
      <div className="login-body">
        <div className="login-container">
          {/* Logo lockup */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Fuel size={28} />
            </div>
            <span className="login-logo-name">System Authentication</span>
          </div>

          <div className="login-brand">
            <h1>Sign in</h1>
            <p>Online Fuel Ordering System</p>
          </div>

          <div className="login-card">
            {/* Animated segmented role selector */}
            <div className="role-selector" role="tablist" aria-label="Select your role">
              <div className="role-selector-indicator" data-index={roleIndex} aria-hidden="true" />
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  role="tab"
                  aria-selected={role === r.value}
                  className={`role-option${role === r.value ? ' active' : ''}`}
                  onClick={() => handleRoleChange(r.value)}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Identifier field */}
              <div className="form-group">
                <label htmlFor="identifier">
                  {role === 'driver' ? 'Phone Number' : 'Email Address'}
                </label>
                <div className="input-group">
                  <span className="input-icon">
                    {role === 'driver' ? <Phone size={16} /> : <Mail size={16} />}
                  </span>
                  <input
                    id="identifier"
                    type={role === 'driver' ? 'tel' : 'email'}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={
                      role === 'driver' ? '0551234567'
                      : role === 'omc' ? 'admin@company.com'
                      : 'customer@company.com'
                    }
                    autoComplete={role === 'driver' ? 'tel' : 'email'}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-group">
                  <span className="input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="has-toggle"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="login-forgot">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="login-copyright">© 2026 Maestro Fuel</p>
        </div>
      </div>

      {/* ── Right panel: visual ── */}
      <div className="login-visual" aria-hidden="true">
        <span className="login-visual-dot1" />
        <span className="login-visual-dot2" />

        <div className="login-visual-inner">
          <div className="login-visual-icon-ring">
            <Fuel size={44} />
          </div>

          <div>
            <p className="login-visual-title">Maestro Fuel Desk</p>
            <p className="login-visual-subtitle">
              Seamlessly manage orders, track deliveries, and monitor your
              entire fuel distribution network in real time.
            </p>
          </div>

          <div className="login-visual-features">
            <div className="login-visual-feature">
              <div className="login-visual-feature-icon"><Droplets size={16} /></div>
              <span className="login-visual-feature-text">Real-time tank level monitoring</span>
            </div>
            <div className="login-visual-feature">
              <div className="login-visual-feature-icon"><MapPin size={16} /></div>
              <span className="login-visual-feature-text">Live delivery tracking</span>
            </div>
            <div className="login-visual-feature">
              <div className="login-visual-feature-icon"><ShieldCheck size={16} /></div>
              <span className="login-visual-feature-text">OTP-secured fuel dispensing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
