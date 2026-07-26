import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { createUser, login, getUserByToken } from '../app/modules/auth/core/_requests';
import { uploadProfileImage } from '../app/modules/auth/core/_user_requests';
import '../styles/auth.css';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const registerSchema = Yup.object({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .matches(passwordRegex, 'Password must contain uppercase, lowercase, and number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type PasswordStrength = 'weak' | 'medium' | 'strong' | '';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return '';
  if (password.length < 8) return 'weak';
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (strength <= 2) return 'weak';
  if (strength === 3) return 'medium';
  return 'strong';
};

const Register: React.FC = () => {
  const { auth, saveAuth, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSuccess(false);
      setIsLoading(true);
      setSubmitting(true);

      try {
        await createUser(
          values.email,
          values.firstName,
          values.lastName,
          values.password,
          values.revealDetailsInPublicHistory
        );

        // Log the user in directly so they don't have to sign in again
        const authRes = await login(values.email, values.password);
        saveAuth(authRes.data);
        const userRes = await getUserByToken(authRes.data.api_token);
        if (userRes.data) setCurrentUser(userRes.data);

        if (profileImageFile) {
          try {
            await uploadProfileImage(profileImageFile);
            const userRes2 = await getUserByToken(authRes.data.api_token);
            if (userRes2.data) setCurrentUser(userRes2.data);
          } catch {
            // Account created and logged in; they can add photo later in Edit profile
          }
        }

        setSuccess(true);
        setSubmitting(false);
        setIsLoading(false);

        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (error: any) {
        setSubmitting(false);
        setIsLoading(false);
        
        if (error.response?.status === 400) {
          const errorData = error.response.data;
          if (errorData.fieldErrors) {
            setServerError(errorData.fieldErrors[0]?.message || 'Validation error');
          } else if (errorData.message) {
            setServerError(errorData.message);
          } else {
            setServerError('Invalid input. Please check your information.');
          }
        } else if (error.response?.status === 409) {
          setServerError('An account with this email already exists.');
        } else if (error.response?.data?.message) {
          setServerError(error.response.data.message);
        } else {
          setServerError('An error occurred during registration. Please try again.');
        }
      }
    },
  });

  const passwordStrength = getPasswordStrength(formik.values.password);

  return (
    <div className="auth-page">
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
            Create an account to become part of our community. Help us support 
            underprivileged students and make quality education accessible to all.
          </p>

          <div className="auth-info-features">
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">✅</div>
              <div className="auth-info-feature-text">
                <h4>Transparent Process</h4>
                <p>Clear, documented selection process with no hidden criteria</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🎯</div>
              <div className="auth-info-feature-text">
                <h4>Direct Impact</h4>
                <p>100% of support goes directly to school fees for students</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">📈</div>
              <div className="auth-info-feature-text">
                <h4>Long-term Support</h4>
                <p>Continuous assistance until Class 10 completion</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🔐</div>
              <div className="auth-info-feature-text">
                <h4>Privacy First</h4>
                <p>Student data is never publicly disclosed</p>
              </div>
            </div>
          </div>

          <div className="auth-info-stats">
            <div className="auth-info-stat">
              <div className="auth-info-stat-value">2</div>
              <div className="auth-info-stat-label">Students/Year</div>
            </div>
            <div className="auth-info-stat">
              <div className="auth-info-stat-value">100%</div>
              <div className="auth-info-stat-label">Fee Coverage</div>
            </div>
            <div className="auth-info-stat">
              <div className="auth-info-stat-value">10</div>
              <div className="auth-info-stat-label">Years Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel - Right Side */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Create Account</h1>
            <p>Sign up to get started with Alumni Student Support Fund</p>
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

          <form className="auth-form auth-form--register" onSubmit={formik.handleSubmit} autoComplete="off">
            <section className="auth-form-section" aria-labelledby="register-personal-heading">
              <h2 id="register-personal-heading" className="auth-form-section-title">Personal details</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label required">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`form-input ${formik.touched.firstName && formik.errors.firstName ? 'error' : ''}`}
                    placeholder="John"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.firstName}
                    disabled={isLoading}
                    autoComplete="given-name"
                    aria-invalid={!!(formik.touched.firstName && formik.errors.firstName)}
                    aria-describedby={formik.touched.firstName && formik.errors.firstName ? 'firstName-error' : undefined}
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <span id="firstName-error" className="error-message" role="alert">{formik.errors.firstName}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label required">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className={`form-input ${formik.touched.lastName && formik.errors.lastName ? 'error' : ''}`}
                    placeholder="Doe"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.lastName}
                    disabled={isLoading}
                    autoComplete="family-name"
                    aria-invalid={!!(formik.touched.lastName && formik.errors.lastName)}
                    aria-describedby={formik.touched.lastName && formik.errors.lastName ? 'lastName-error' : undefined}
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <span id="lastName-error" className="error-message" role="alert">{formik.errors.lastName}</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label required">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${formik.touched.email && formik.errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  disabled={isLoading}
                  autoComplete="email"
                  data-form-type="other"
                  aria-invalid={!!(formik.touched.email && formik.errors.email)}
                  aria-describedby={formik.touched.email && formik.errors.email ? 'email-error' : undefined}
                />
                {formik.touched.email && formik.errors.email && (
                  <span id="email-error" className="error-message" role="alert">{formik.errors.email}</span>
                )}
              </div>
            </section>

            <section className="auth-form-section" aria-labelledby="register-security-heading">
              <h2 id="register-security-heading" className="auth-form-section-title">Security</h2>
              <div className="form-group">
                <label htmlFor="password" className="form-label required">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
                    placeholder="Create a strong password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    disabled={isLoading}
                    autoComplete="new-password"
                    data-form-type="other"
                    aria-invalid={!!(formik.touched.password && formik.errors.password)}
                    aria-describedby={formik.touched.password && formik.errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                {formik.touched.password && formik.errors.password && (
                  <span id="password-error" className="error-message" role="alert">{formik.errors.password}</span>
                )}
                {formik.values.password && passwordStrength && (
                  <div className="password-strength" role="status" aria-live="polite">
                    <span className={`password-strength-label password-strength-label--${passwordStrength}`}>
                      Strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                    <div className="password-strength-indicator">
                      <div className={`password-strength-bar ${passwordStrength}`} aria-hidden />
                      <div className={`password-strength-bar ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength : ''}`} aria-hidden />
                      <div className={`password-strength-bar ${passwordStrength === 'strong' ? passwordStrength : ''}`} aria-hidden />
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label required">
                  Confirm password
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter your password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                    disabled={isLoading}
                    autoComplete="new-password"
                    aria-invalid={!!(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                    aria-describedby={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <span id="confirmPassword-error" className="error-message" role="alert">{formik.errors.confirmPassword}</span>
                )}
              </div>
            </section>

            <section className="auth-form-section" aria-labelledby="register-profile-heading">
              <h2 id="register-profile-heading" className="auth-form-section-title">Profile photo <span className="auth-form-optional">(optional)</span></h2>
              <div className="form-group">
                <div
                  className={`auth-file-zone ${profileImageFile ? 'auth-file-zone--has-file' : ''}`}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Choose profile photo"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)}
                    disabled={isLoading}
                    className="auth-file-input"
                    aria-hidden
                  />
                  {profileImageFile ? (
                    <>
                      <span className="auth-file-zone-icon" aria-hidden>✓</span>
                      <span className="auth-file-zone-text">{profileImageFile.name}</span>
                      <span className="auth-file-zone-hint">Click to change</span>
                    </>
                  ) : (
                    <>
                      <span className="auth-file-zone-icon" aria-hidden>📷</span>
                      <span className="auth-file-zone-text">Click to upload or drag and drop</span>
                      <span className="auth-file-zone-hint">JPG, PNG or WebP — max 5 MB</span>
                    </>
                  )}
                </div>
                <p className="form-hint">You can add or change your photo later in Edit profile.</p>
              </div>
            </section>

            <div className="auth-form-submit">
              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || formik.isSubmitting || success}
                aria-busy={isLoading}
              >
                {isLoading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="auth-form-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
            <Link to="/" className="back-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
