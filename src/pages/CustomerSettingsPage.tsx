import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, KeyRound, Loader2, Eye, EyeOff, Building2 } from 'lucide-react';
import { customerAuth } from '../services/api';

export default function CustomerSettingsPage() {
  const { user } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user || user.role !== 'customer') {
    return (
      <div className="page">
        <div className="page-header"><h1>Settings</h1></div>
        <p>Access denied.</p>
      </div>
    );
  }

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await customerAuth.changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p className="text-muted">Manage your account information</p>
        </div>
      </div>

      <div className="form-section">
        <h3><Building2 size={18} /> Account Information</h3>

        <div className="form-row">
          <div className="form-group">
            <label><User size={14} /> Name</label>
            <input
              type="text"
              value={user.name || ''}
              disabled
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label><Mail size={14} /> Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              placeholder="Your email"
            />
          </div>
        </div>

        <div className="form-group">
          <label><Phone size={14} /> Phone</label>
          <input
            type="tel"
            value={user.phone || ''}
            disabled
            placeholder="Your phone number"
          />
        </div>

        <p className="text-muted mt-2 text-sm">
          Contact your OMC administrator to update account information.
        </p>
      </div>

      <div className="form-section mt-8">
        <h3><KeyRound size={18} /> Change Password</h3>

        <div className="form-group">
          <label>Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              className="form-input pr-10"
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                className="form-input pr-10"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {passwordError && (
          <div className="form-error mt-4">{passwordError}</div>
        )}

        <div className="action-buttons mt-6">
          <button
            className="btn btn-primary"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </button>
          {passwordSuccess && (
            <span className="text-success flex items-center gap-2">
              ✓ Password changed successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
