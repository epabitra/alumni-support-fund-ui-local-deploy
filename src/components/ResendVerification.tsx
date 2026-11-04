import React, { useState } from 'react';
import { resendVerificationEmail } from '../app/modules/auth/core/_requests';

/** Requests a new email verification link. Shows an email box when the address isn't already known. */
const ResendVerification: React.FC<{ email?: string }> = ({ email }) => {
  const [address, setAddress] = useState(email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!address.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setSending(true);
      setError('');
      await resendVerificationEmail(address.trim());
      setSent(true);
    } catch {
      setError('Could not send the link. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <p className="email-verify-note" role="status">
        If this address is waiting for verification, a new link is on its way. Please also check your spam folder.
      </p>
    );
  }

  return (
    <div className="email-verify-resend">
      {!email && (
        <input
          type="email"
          className="form-input"
          placeholder="Your email address"
          aria-label="Your email address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      )}
      <button type="button" className="email-verify-resend-btn" onClick={handleResend} disabled={sending}>
        {sending ? 'Sending…' : 'Send a new verification link'}
      </button>
      {error && <p className="email-verify-error" role="alert">{error}</p>}
    </div>
  );
};

export default ResendVerification;
