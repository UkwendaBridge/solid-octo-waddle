import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Save, Mail, Phone, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { driverAuth } from '../services/api';

export default function DriverSettingsPage() {
  const { user } = useAuth();
  
  // For driver role, the user object IS the driver profile
  const [name, setName] = useState(user?.name || '');
  const phone = user?.phone || '';
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user || user.role !== 'driver') {
    return (
      <div className="page">
        <div className="page-header"><h1>Settings</h1></div>
        <p>No driver profile is linked to this account.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await driverAuth.updateProfile({
        name: name.trim(),
        email: email.trim(),
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error || 'Failed to save');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

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
      const result = await driverAuth.changePassword(currentPassword, newPassword);
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
          <p className="text-muted">Manage your profile information</p>
        </div>
      </div>

      <div className="form-section">
        <h3><User size={18} /> Personal Information</h3>

        <div className="form-group">
          <label><User size={14} /> Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label><Mail size={14} /> Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email"
            />
          </div>
          <div className="form-group">
            <label><Phone size={14} /> Phone (read-only)</label>
            <input
              type="tel"
              value={phone}
              disabled
              placeholder="+27 XX XXX XXXX"
            />
          </div>
        </div>

        {error && (
          <div className="form-error mt-4">{error}</div>
        )}

        <div className="action-buttons mt-6">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-success flex items-center gap-2">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>

      <div className="form-section mt-8">
        <h3><KeyRound size={18} /> Change Password</h3>

        <div className="form-group">
          <label>Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
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
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
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
