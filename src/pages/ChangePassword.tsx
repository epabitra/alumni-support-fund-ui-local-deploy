import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import RoleBasedNav from '../components/RoleBasedNav';
import { changePassword } from '../app/modules/auth/core/_user_requests';
import '../styles/dashboard.css';
import '../styles/auth.css';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .matches(passwordRegex, 'Password must contain uppercase, lowercase, and number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosed = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      setServerError('');
      try {
        await changePassword(values.currentPassword, values.newPassword);
        setShowSuccess(true);
      } catch (error: any) {
        const data = error.response?.data;
        let msg = 'Failed to change password. Please try again.';
        if (data) {
          if (data.fieldErrors && Array.isArray(data.fieldErrors) && data.fieldErrors.length > 0) {
            msg = data.fieldErrors[0].message || msg;
          } else if (data.message) {
            msg = data.message;
          }
        } else if (error.message) {
          msg = error.message;
        }
        setServerError(msg);
      }
    },
  });

  const handleSuccessOk = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content account-modal-overlay">
        <div className="account-page-card">
          <div className="account-page-header">
            <div className="account-page-header-icon" aria-hidden>🔐</div>
            <h1>Change password</h1>
            <p>Enter your current password and choose a new one.</p>
          </div>

          {showSuccess ? (
            <div className="account-success-block">
              <div className="account-success-icon" aria-hidden>✓</div>
              <h3>Password updated</h3>
              <p>Your password has been changed successfully. You can now sign in with your new password.</p>
              <button type="button" className="account-btn primary" onClick={handleSuccessOk}>
                OK
              </button>
            </div>
          ) : (
          <form onSubmit={formik.handleSubmit} className="account-form">
            {serverError && (
              <div className="account-form-error" role="alert">
                {serverError}
              </div>
            )}
            <div className="account-form-group">
              <label htmlFor="currentPassword">Current password</label>
              <div className="password-input-wrapper">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  value={formik.values.currentPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.currentPassword && formik.errors.currentPassword ? 'invalid' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {formik.touched.currentPassword && formik.errors.currentPassword && (
                <span className="account-form-error-text">{formik.errors.currentPassword}</span>
              )}
            </div>
            <div className="account-form-group">
              <label htmlFor="newPassword">New password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.newPassword && formik.errors.newPassword ? 'invalid' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              <p className="account-form-hint account-form-rules">At least 8 characters, with uppercase, lowercase and a number.</p>
              {formik.touched.newPassword && formik.errors.newPassword && (
                <span className="account-form-error-text">{formik.errors.newPassword}</span>
              )}
            </div>
            <div className="account-form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'invalid' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <span className="account-form-error-text">{formik.errors.confirmPassword}</span>
              )}
            </div>
            <div className="account-form-actions">
              <button type="submit" className="account-btn primary" disabled={formik.isSubmitting}>
                {formik.isSubmitting ? 'Updating…' : 'Update password'}
              </button>
              <Link to="/dashboard" className="account-btn secondary">Cancel</Link>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChangePassword;
