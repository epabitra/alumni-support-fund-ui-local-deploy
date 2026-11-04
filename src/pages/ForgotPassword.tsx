import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../app/modules/auth/core/_requests';
import { EmailVerifyCard } from './VerifyEmail';
import '../styles/auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setSending(true);
      setError('');
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send the link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <EmailVerifyCard icon="📧" title="Check your inbox">
        <p>If <strong>{email.trim()}</strong> has an active account, we've sent a link to reset your password.</p>
        <p className="email-verify-note">The link is valid for 1 hour. If you don't see the email, check your spam folder.</p>
        <p className="email-verify-note"><Link to="/login">Back to sign in</Link></p>
      </EmailVerifyCard>
    );
  }

  return (
    <EmailVerifyCard icon="🔑" title="Forgot your password?">
      <p>Enter your email address and we'll send you a link to set a new password.</p>
      <form className="email-verify-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="forgot-email">Email address</label>
          <input
            id="forgot-email"
            type="email"
            className="form-input"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoFocus
          />
        </div>
        {error && <p className="email-verify-error" role="alert">{error}</p>}
        <button type="submit" className="submit-button" disabled={sending}>
          {sending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="email-verify-note"><Link to="/login">Back to sign in</Link></p>
    </EmailVerifyCard>
  );
};

export default ForgotPassword;
