import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../app/modules/auth/core/_requests';
import { EmailVerifyCard } from './VerifyEmail';
import '../styles/auth.css';

/** Same rule as registration: uppercase, lowercase and a number, 8 to 50 characters */
function passwordProblem(password: string): string {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 50) return 'Password must be less than 50 characters';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return '';
}

/** Opened from the link in the password reset email (/reset-password?key=...). */
const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const key = params.get('key') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password) || (password !== confirm ? 'Passwords must match' : '');
    if (problem) {
      setError(problem);
      return;
    }
    try {
      setSaving(true);
      setError('');
      await resetPassword(key, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.fieldErrors?.[0]?.message || err?.response?.data?.message || 'Could not reset your password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!key) {
    return (
      <EmailVerifyCard icon="⚠️" title="This link is incomplete">
        <p>Please open the link from your email again, or request a new one.</p>
        <p className="email-verify-note"><Link to="/forgot-password">Request a new link</Link></p>
      </EmailVerifyCard>
    );
  }

  if (done) {
    return (
      <EmailVerifyCard icon="✅" title="Password changed">
        <p>You can now sign in with your new password.</p>
        <Link to="/login" className="submit-button email-verify-action">Sign in</Link>
      </EmailVerifyCard>
    );
  }

  return (
    <EmailVerifyCard icon="🔑" title="Set a new password">
      <p>Use at least 8 characters with an uppercase letter, a lowercase letter and a number.</p>
      <form className="email-verify-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="reset-password">New password</label>
          <input
            id="reset-password"
            type="password"
            className="form-input"
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="reset-confirm">Confirm new password</label>
          <input
            id="reset-confirm"
            type="password"
            className="form-input"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          />
        </div>
        {error && <p className="email-verify-error" role="alert">{error}</p>}
        <button type="submit" className="submit-button" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
      <p className="email-verify-note"><Link to="/forgot-password">Request a new link</Link></p>
    </EmailVerifyCard>
  );
};

export default ResetPassword;
