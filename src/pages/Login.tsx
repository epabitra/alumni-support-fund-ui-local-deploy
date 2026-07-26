import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { login } from '../app/modules/auth/core/_requests';
import '../styles/auth.css';

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(4, 'Password must be at least 4 characters')
    .required('Password is required'),
});

const Login: React.FC = () => {
  const { saveAuth, setCurrentUser, auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (auth) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth, navigate]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      setIsLoading(true);
      setSubmitting(true);

      try {
        const { data: authData } = await login(values.email, values.password);
        saveAuth(authData);

        const { getUserByToken } = await import('../app/modules/auth/core/_requests');
        const { data: user } = await getUserByToken(authData.api_token);
        if (user) {
          setCurrentUser(user);
        }

        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } catch (error: any) {
        setSubmitting(false);
        setIsLoading(false);
        
        if (error.response?.status === 401) {
          setServerError('Invalid email or password. Please try again.');
        } else if (error.response?.data?.message) {
          setServerError(error.response.data.message);
        } else if (error.message) {
          setServerError(error.message);
        } else {
          setServerError('An error occurred during login. Please try again.');
        }
      }
    },
  });

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
            Welcome back to
            <span className="auth-info-highlight"> your portal</span>
          </h2>

          <p className="auth-info-description">
            Access your dashboard to manage applications, track student progress, 
            and contribute to our mission of supporting underprivileged students.
          </p>

          <div className="auth-info-features">
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🔒</div>
              <div className="auth-info-feature-text">
                <h4>Secure Access</h4>
                <p>Your data is protected with industry-standard encryption</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">📊</div>
              <div className="auth-info-feature-text">
                <h4>Real-time Dashboard</h4>
                <p>Monitor applications and student progress instantly</p>
              </div>
            </div>
            <div className="auth-info-feature">
              <div className="auth-info-feature-icon">🤝</div>
              <div className="auth-info-feature-text">
                <h4>Role-based Access</h4>
                <p>Customized interface based on your responsibilities</p>
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
            <h1>Sign In</h1>
            <p>Enter your credentials to access your account</p>
          </div>

          {serverError && (
            <div className="server-error" role="alert">
              {serverError}
            </div>
          )}

          <form className="auth-form" onSubmit={formik.handleSubmit} autoComplete="off">
            {/* Fake hidden fields to trick Chrome autofill */}
            <input type="text" name="fake-username" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} />
            <input type="password" name="fake-password" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} />
            
            <div className="form-group">
              <label htmlFor="email" className="form-label required">
                Email Address
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
              />
              {formik.touched.email && formik.errors.email && (
                <span className="error-message">{formik.errors.email}</span>
              )}
            </div>

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
                  placeholder="Enter your password"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  disabled={isLoading}
                  autoComplete="new-password"
                  data-form-type="other"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <span className="error-message">{formik.errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || formik.isSubmitting}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register">Create an account</Link>
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

export default Login;
