import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, KeyRound, Loader2, Eye, EyeOff, Building2, UserPlus, Users } from 'lucide-react';
import { customerAuth, customerUsers } from '../services/api';

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

  // New account user state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

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

  const handleCreateUser = async () => {
    setUserError(null);
    setUserSuccess(null);

    if (!userName.trim() || !userEmail.trim() || !userPassword || !userConfirmPassword) {
      setUserError('Name, email, and both password fields are required');
      return;
    }

    if (userPassword.length < 6) {
      setUserError('Password must be at least 6 characters');
      return;
    }

    if (userPassword !== userConfirmPassword) {
      setUserError('Passwords do not match');
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await customerUsers.create({
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword,
        phone: userPhone.trim() || undefined,
      });
      if (result.success && result.data) {
        setUserSuccess(`${result.data.user.name} can now sign in with ${result.data.user.email}`);
        setUserName('');
        setUserEmail('');
        setUserPhone('');
        setUserPassword('');
        setUserConfirmPassword('');
      } else {
        setUserError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
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
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
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
                placeholder="New password"
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

      <div className="form-section mt-8">
        <h3><Users size={18} /> Account Users</h3>

        <p className="text-muted text-sm">
          Add someone else to this account. They sign in with their own email and
          password and work with the same drivers, vehicles, orders and balance
          you do — nothing is separated.
          {user.isSubUser && ' Anyone you add joins this account alongside you.'}
        </p>

        <div className="form-row mt-4">
          <div className="form-group">
            <label><User size={14} /> Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="e.g. Jane Ops"
            />
          </div>
          <div className="form-group">
            <label><Mail size={14} /> Email *</label>
            <input
              type="email"
              className="form-input"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              placeholder="ops@company.com"
            />
          </div>
        </div>

        <div className="form-group">
          <label><Phone size={14} /> Phone (Optional)</label>
          <input
            type="tel"
            className="form-input"
            value={userPhone}
            onChange={e => setUserPhone(e.target.value)}
            placeholder="0541234567"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password *</label>
            <div className="relative">
              <input
                type={showUserPassword ? 'text' : 'password'}
                className="form-input pr-10"
                value={userPassword}
                onChange={e => setUserPassword(e.target.value)}
                placeholder="Their login password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowUserPassword(!showUserPassword)}
              >
                {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              className="form-input"
              value={userConfirmPassword}
              onChange={e => setUserConfirmPassword(e.target.value)}
              placeholder="Confirm password"
            />
          </div>
        </div>

        {userError && (
          <div className="form-error mt-4">{userError}</div>
        )}

        <div className="action-buttons mt-6">
          <button
            className="btn btn-primary"
            onClick={handleCreateUser}
            disabled={isCreatingUser || !userName.trim() || !userEmail.trim() || !userPassword || !userConfirmPassword}
          >
            {isCreatingUser ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {isCreatingUser ? 'Creating...' : 'Add User'}
          </button>
          {userSuccess && (
            <span className="text-success flex items-center gap-2">
              ✓ {userSuccess}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
