import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import { useAuth } from '../app/modules/auth/core/Auth';
import { updateAccountProfile } from '../app/modules/auth/core/_user_requests';
import '../styles/dashboard.css';

const MASK_INFO_TOOLTIP =
  "When enabled, your name and email are hidden in the organization's public payment history (shown as masked). When disabled, they are visible.";

const MaskMyInfo: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const maskEnabled = currentUser?.revealDetailsInPublicHistory === false;

  const handleToggle = async () => {
    if (!currentUser) return;
    const newReveal = !currentUser.revealDetailsInPublicHistory;
    setServerError('');
    setSaving(true);
    try {
      const { data } = await updateAccountProfile(
        currentUser.firstName ?? '',
        currentUser.lastName ?? '',
        newReveal
      );
      if (data) setCurrentUser(data);
      setShowSuccess(true);
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Could not update setting. Please try again.';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content account-modal-overlay">
        <div className="account-page-card">
          <div className="account-page-header">
            <div className="account-page-header-icon" aria-hidden>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1>Mask my info</h1>
            <p>
              Control whether your name and email are visible in the public payment history.
            </p>
          </div>

          {showSuccess ? (
            <div className="account-success-block">
              <div className="account-success-icon" aria-hidden>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Setting updated</h3>
              <p>Your preference has been saved.</p>
              <Link to="/dashboard" className="account-btn primary">
                Done
              </Link>
            </div>
          ) : (
            <div className="account-form account-form--edit-profile">
              {serverError && (
                <div className="account-form-error" role="alert">
                  {serverError}
                </div>
              )}
              <section className="account-form-section">
                <div className="account-form-group account-form-toggle-group">
                  <label className="account-form-toggle-label account-form-toggle-label--standalone">
                    <input
                      type="checkbox"
                      checked={maskEnabled}
                      onChange={handleToggle}
                      disabled={saving}
                      className="account-form-toggle-input"
                      aria-describedby="mask-info-desc"
                    />
                    <span className="account-form-toggle-text">Mask my name and email in public payment history</span>
                    <span
                      id="mask-info-desc"
                      className="account-form-info-icon"
                      title={MASK_INFO_TOOLTIP}
                      aria-label="More information"
                    >
                      ⓘ
                    </span>
                  </label>
                </div>
                <p className="account-form-hint">
                  When on, your name and email are hidden in the organization&apos;s public payment history. When off, they are shown.
                </p>
              </section>
              <div className="account-form-actions">
                <Link to="/dashboard" className="account-btn secondary">
                  Cancel
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MaskMyInfo;
