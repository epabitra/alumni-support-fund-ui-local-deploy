import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { createUser, login, getUserByToken } from '../app/modules/auth/core/_requests';
import ResendVerification from '../components/ResendVerification';
import { EmailVerifyCard } from './VerifyEmail';
import '../styles/auth.css';

const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

const registerSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('Please enter your first name'),
  lastName: Yup.string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Please enter your last name'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .test('no-alias', 'Email addresses with + are not allowed. Please use your main email address.', (value) => !value?.includes('+'))
    .required('Please enter your email address'),
  password: Yup.string()
    .max(50, 'Password must be less than 50 characters')
    .test('rules', 'Password does not meet the requirements below', (value) => PASSWORD_RULES.every((rule) => rule.test(value ?? '')))
    .required('Please create a password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

/** Common slips in the domain part of an address; the verification email would never arrive */
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.in': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'rediffmai.com': 'rediffmail.com',
};

function suggestEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at <= 0) return null;
  const corrected = EMAIL_DOMAIN_TYPOS[value.slice(at + 1)];
  return corrected ? `${value.slice(0, at)}@${corrected}` : null;
}

const Register: React.FC = () => {
  const { auth, saveAuth, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string>('');
  /** Errors from the server about the address itself are shown under the email field */
  const [emailError, setEmailError] = useState<string>('');
  const [emailExists, setEmailExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const handledSubmit = useRef(0);

  useEffect(() => {
    if (auth) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      revealDetailsInPublicHistory: false,
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      setEmailError('');
      setEmailExists(false);
      setSuccess(false);
      setIsLoading(true);
      setSubmitting(true);
      const email = values.email.trim();

      try {
        const { data: registration } = await createUser(
          email,
          values.firstName.trim(),
          values.lastName.trim(),
          values.password,
          values.revealDetailsInPublicHistory
        );

        // The account stays inactive until the email is verified, so there is nothing to sign in to yet
        if (registration?.verificationRequired) {
          setPendingEmail(email);
          setSubmitting(false);
          setIsLoading(false);
          return;
        }

        // Log the user in directly so they don't have to sign in again
        const authRes = await login(email, values.password);
        saveAuth(authRes.data);
        const userRes = await getUserByToken(authRes.data.api_token);
        if (userRes.data) setCurrentUser(userRes.data);

        setSuccess(true);
        setSubmitting(false);
        setIsLoading(false);

        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (error: any) {
        setSubmitting(false);
        setIsLoading(false);

        const data = error.response?.data;
        const message: string | undefined = data?.fieldErrors?.[0]?.message || data?.message;
        if (error.response?.status === 409) {
          setEmailExists(true);
        } else if (error.response?.status === 400 && message && /email|registered|verification/i.test(message)) {
          setEmailError(message);
        } else if (message) {
          setServerError(message);
        } else if (!error.response) {
          setServerError('We could not reach the server. Please check your connection and try again.');
        } else {
          setServerError('Something went wrong while creating your account. Please try again.');
        }
      }
    },
  });

  // After a failed submit, take the person straight to the first thing that needs fixing.
  // Waits for isSubmitting to clear because formik validates after submitCount changes.
  useEffect(() => {
    if (formik.submitCount === 0 || formik.isSubmitting || handledSubmit.current === formik.submitCount) return;
    handledSubmit.current = formik.submitCount;
    const firstInvalid = ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
      .find((name) => formik.errors[name as keyof typeof formik.errors]);
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.submitCount, formik.isSubmitting]);

  const fieldError = (name: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword') =>
    formik.touched[name] ? formik.errors[name] : undefined;

  const emailSuggestion = suggestEmail(formik.values.email);
  const emailInvalid = !!(fieldError('email') || emailError || emailExists);
  const passwordTouched = formik.touched.password;
  const passwordsMatch = !!formik.values.confirmPassword && formik.values.confirmPassword === formik.values.password;

  if (pendingEmail) {
    return (
      <EmailVerifyCard icon="📧" title="Check your inbox">
        <p>
          We sent a verification link to <strong>{pendingEmail}</strong>. Click it to activate your account, then sign in.
        </p>
        <p className="email-verify-note">
          The link is valid for 24 hours. If you don't see the email, check your spam folder.
        </p>
        <ResendVerification email={pendingEmail} />
        <p className="email-verify-note"><Link to="/login">Back to sign in</Link></p>
      </EmailVerifyCard>
    );
  }

  return (
    <div className="auth-page auth-page--register">
      {/* Back Button - Top Left */}
      <Link to="/" className="auth-back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back to Home</span>
      </Link>

      {/* Info Panel - Left Side */}
      <div className="auth-info-panel">
        <div className="auth-info-content">
          <div className="auth-info-brand">
            <div className="auth-info-brand-icon">🎓</div>
            <span className="auth-info-brand-text">Alumni Support Fund</span>
          </div>

          <h2 className="auth-info-title">
            Join our mission to
            <span className="auth-info-highlight"> empower education</span>
          </h2>

          <p className="auth-info-description">
            Become part of our alumni community and help underprivileged students get a quality education.
          </p>

          <div className="auth-info-features">
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">✅</div>
              <div className="auth-info-feature-text">
                <h4>Fully transparent</h4>
                <p>Members can see every contribution and every scholarship payment</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🎯</div>
              <div className="auth-info-feature-text">
                <h4>Direct impact</h4>
                <p>Your support goes directly towards students' education</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🔐</div>
              <div className="auth-info-feature-text">
                <h4>Your privacy</h4>
                <p>Your name and email stay masked unless you choose to show them</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel - Right Side */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-register-brand" aria-hidden>
            <span className="auth-register-brand-icon">🎓</span>
            <span>Alumni Support Fund</span>
          </div>

          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>
              Already a member? <Link to="/login" className="auth-register-signin">Sign in</Link>
            </p>
          </div>

          {serverError && (
            <div className="server-error" role="alert">
              {serverError}
            </div>
          )}

          {success && (
            <div className="success-message" role="alert">
              Account created successfully! Taking you to your dashboard...
            </div>
          )}

          <form className="auth-register-form" onSubmit={formik.handleSubmit} noValidate>
            <div className="form-row">
              <div className="auth-register-field">
                <label htmlFor="firstName" className="form-label">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={`form-input ${fieldError('firstName') ? 'error' : ''}`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.firstName}
                  disabled={isLoading}
                  autoComplete="given-name"
                  autoFocus
                  aria-invalid={!!fieldError('firstName')}
                  aria-describedby={fieldError('firstName') ? 'firstName-error' : undefined}
                />
                {fieldError('firstName') && (
                  <span id="firstName-error" className="error-message" role="alert">{fieldError('firstName')}</span>
                )}
              </div>
              <div className="auth-register-field">
                <label htmlFor="lastName" className="form-label">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={`form-input ${fieldError('lastName') ? 'error' : ''}`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.lastName}
                  disabled={isLoading}
                  autoComplete="family-name"
                  aria-invalid={!!fieldError('lastName')}
                  aria-describedby={fieldError('lastName') ? 'lastName-error' : undefined}
                />
                {fieldError('lastName') && (
                  <span id="lastName-error" className="error-message" role="alert">{fieldError('lastName')}</span>
                )}
              </div>
            </div>

            <div className="auth-register-field">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                className={`form-input ${emailInvalid ? 'error' : ''}`}
                onChange={(e) => {
                  setEmailError('');
                  setEmailExists(false);
                  formik.handleChange(e);
                }}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={emailInvalid}
                aria-describedby="email-help"
              />
              <div id="email-help">
                {fieldError('email') ? (
                  <span className="error-message" role="alert">{fieldError('email')}</span>
                ) : emailError ? (
                  <span className="error-message" role="alert">{emailError}</span>
                ) : emailExists ? (
                  <span className="error-message auth-register-exists" role="alert">
                    <span>An account with this email already exists.</span>{' '}
                    <span><Link to="/login">Sign in</Link> or <Link to="/forgot-password">reset your password</Link></span>
                  </span>
                ) : emailSuggestion ? (
                  <button
                    type="button"
                    className="auth-register-suggestion"
                    onClick={() => formik.setFieldValue('email', emailSuggestion)}
                  >
                    Did you mean <strong>{emailSuggestion}</strong>?
                  </button>
                ) : (
                  <p className="form-hint">We'll email a link here to confirm it's you. Please use your regular email, not a temporary one.</p>
                )}
              </div>
            </div>

            <div className="auth-register-field">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${fieldError('password') ? 'error' : ''}`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-invalid={!!fieldError('password')}
                  aria-describedby="password-rules"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <ul id="password-rules" className="auth-password-rules">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(formik.values.password);
                  return (
                    <li key={rule.label} className={met ? 'met' : passwordTouched ? 'unmet' : ''}>
                      <span aria-hidden>{met ? '✓' : '•'}</span>
                      {rule.label}
                      <span className="auth-visually-hidden">{met ? ' (done)' : ' (not done yet)'}</span>
                    </li>
                  );
                })}
              </ul>
              {formik.values.password.length > 50 && (
                <span className="error-message" role="alert">Password must be less than 50 characters</span>
              )}
            </div>

            <div className="auth-register-field">
              <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${fieldError('confirmPassword') ? 'error' : ''}`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
                aria-invalid={!!fieldError('confirmPassword')}
                aria-describedby={fieldError('confirmPassword') ? 'confirmPassword-error' : undefined}
              />
              {fieldError('confirmPassword') ? (
                <span id="confirmPassword-error" className="error-message" role="alert">{fieldError('confirmPassword')}</span>
              ) : passwordsMatch ? (
                <span className="auth-register-match" role="status">✓ Passwords match</span>
              ) : null}
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || formik.isSubmitting || success}
              aria-busy={isLoading}
              // Keeps focus in the field: otherwise its error appears on mouse down, moves this button, and the click misses
              onMouseDown={(e) => e.preventDefault()}
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
