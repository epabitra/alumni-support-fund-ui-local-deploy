import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../app/modules/auth/core/_requests';
import ResendVerification from '../components/ResendVerification';
import '../styles/auth.css';

/** Centered card used by the verification screens */
export const EmailVerifyCard: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="email-verify-page">
    <div className="email-verify-card">
      <div className="email-verify-icon" aria-hidden>{icon}</div>
      <h1>{title}</h1>
      {children}
    </div>
  </div>
);

type Status = 'verifying' | 'verified' | 'failed';

/** Opened from the link in the verification email (/verify-email?key=...). */
const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const key = params.get('key') ?? '';
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  // A key works only once, so it must not be sent twice when React re-runs effects in development
  const submittedKey = useRef<string | null>(null);

  useEffect(() => {
    if (submittedKey.current === key) return;
    submittedKey.current = key;
    if (!key) {
      setMessage('This verification link is incomplete. Please open the link from your email again.');
      setStatus('failed');
      return;
    }
    verifyEmail(key)
      .then(() => setStatus('verified'))
      .catch((err: any) => {
        setMessage(err?.response?.data?.message || 'Could not verify your email. Please try again.');
        setStatus('failed');
      });
  }, [key]);

  if (status === 'verifying') {
    return (
      <EmailVerifyCard icon="⏳" title="Verifying your email…">
        <p>Please wait a moment.</p>
      </EmailVerifyCard>
    );
  }

  if (status === 'verified') {
    return (
      <EmailVerifyCard icon="✅" title="Email verified">
        <p>Your account is active. You can now sign in.</p>
        <Link to="/login" className="submit-button email-verify-action">Sign in</Link>
      </EmailVerifyCard>
    );
  }

  return (
    <EmailVerifyCard icon="⚠️" title="We couldn't verify your email">
      <p>{message}</p>
      <ResendVerification />
      <p className="email-verify-note"><Link to="/login">Back to sign in</Link></p>
    </EmailVerifyCard>
  );
};

export default VerifyEmail;
