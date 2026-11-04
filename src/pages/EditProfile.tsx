import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import RoleBasedNav from '../components/RoleBasedNav';
import { useAuth } from '../app/modules/auth/core/Auth';
import { fetchProfileImageBlobUrl, updateAccountProfile, uploadProfileImage } from '../app/modules/auth/core/_user_requests';
import '../styles/dashboard.css';
import '../styles/auth.css';

const editProfileSchema = Yup.object({
  firstName: Yup.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .required('First name is required'),
  lastName: Yup.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .required('Last name is required'),
});

const PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EditProfile: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser?.imageUrl) {
      if (currentImageUrlRef.current) URL.revokeObjectURL(currentImageUrlRef.current);
      currentImageUrlRef.current = null;
      setCurrentImageUrl(null);
      return;
    }
    let cancelled = false;
    fetchProfileImageBlobUrl()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        currentImageUrlRef.current = url;
        setCurrentImageUrl(url);
      })
      .catch(() => setCurrentImageUrl(null));
    return () => {
      cancelled = true;
      if (currentImageUrlRef.current) {
        URL.revokeObjectURL(currentImageUrlRef.current);
        currentImageUrlRef.current = null;
      }
    };
  }, [currentUser?.imageUrl]);

  const formik = useFormik({
    initialValues: {
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
    },
    validationSchema: editProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setServerError('');
      try {
        if (pendingImageFile) {
          const { data } = await uploadProfileImage(pendingImageFile);
          if (data) setCurrentUser(data);
          if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
          setPendingImageFile(null);
          setPendingPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
        const { data } = await updateAccountProfile(values.firstName, values.lastName);
        if (data) setCurrentUser(data);
        setShowSuccess(true);
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message || 'Failed to update profile. Please try again.';
        setServerError(msg);
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setServerError('Please choose a JPG, PNG or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setServerError('That image is larger than 5 MB. Please choose a smaller one.');
      e.target.value = '';
      return;
    }
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingImageFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
    setServerError('');
  };

  const clearPendingImage = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingImageFile(null);
    setPendingPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSuccessOk = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content account-modal-overlay">
        <div className="account-page-card account-page-card--edit-profile">
          <div className="account-page-header">
            <div className="account-page-header-icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1>Edit profile</h1>
            <p>Update your name and preferences. Changes are saved when you click Save.</p>
          </div>

          {showSuccess ? (
            <div className="account-success-block">
              <div className="account-success-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Profile updated</h3>
              <p>Your profile has been saved successfully.</p>
              <button type="button" className="account-btn primary" onClick={handleSuccessOk}>
                Done
              </button>
            </div>
          ) : (
          <form onSubmit={formik.handleSubmit} className="account-form account-form--edit-profile">
            {serverError && (
              <div className="account-form-error" role="alert">
                {serverError}
              </div>
            )}

            <section className="account-form-section account-form-section--photo" aria-labelledby="edit-profile-photo-heading">
              <h2 id="edit-profile-photo-heading" className="account-form-section-title">Profile photo</h2>
              <div className="profile-photo-row">
                <div className="profile-photo-row__avatar">
                  {pendingPreviewUrl ? (
                    <img src={pendingPreviewUrl} alt="New profile preview" />
                  ) : currentImageUrl ? (
                    <img src={currentImageUrl} alt="Current profile" />
                  ) : (
                    <span className="profile-photo-row__placeholder">No photo</span>
                  )}
                </div>
                <div className="profile-photo-row__actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="profile-image-input visually-hidden"
                    aria-label="Choose profile photo"
                  />
                  <button
                    type="button"
                    className="account-btn account-btn--outline account-btn--sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {pendingImageFile ? 'Change' : currentUser?.imageUrl || currentImageUrl ? 'Change' : 'Upload'}
                  </button>
                  {pendingImageFile && (
                    <button type="button" className="account-btn account-btn--ghost account-btn--sm" onClick={clearPendingImage}>
                      Cancel
                    </button>
                  )}
                  <p className="profile-photo-row__hint">JPG, PNG or WebP, max 5 MB. Saved when you click Save. Shown beside your contributions on the Fund page only while Mask my info is off.</p>
                </div>
              </div>
            </section>

            <section className="account-form-section" aria-labelledby="edit-profile-details-heading">
              <h2 id="edit-profile-details-heading" className="account-form-section-title">Personal information</h2>
              <div className="account-form-fields">
                <div className="account-form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={currentUser?.email ?? ''}
                    disabled
                    className="account-form-input-disabled"
                    placeholder="your@email.com"
                    aria-describedby="edit-email-hint"
                  />
                </div>
                <div className="account-form-row">
                  <div className="account-form-group">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      autoComplete="given-name"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.firstName && formik.errors.firstName ? 'invalid' : ''}
                      aria-invalid={!!(formik.touched.firstName && formik.errors.firstName)}
                    />
                    {formik.touched.firstName && formik.errors.firstName && (
                      <span className="account-form-error-text" role="alert">{formik.errors.firstName}</span>
                    )}
                  </div>
                  <div className="account-form-group">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      autoComplete="family-name"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={formik.touched.lastName && formik.errors.lastName ? 'invalid' : ''}
                      aria-invalid={!!(formik.touched.lastName && formik.errors.lastName)}
                    />
                    {formik.touched.lastName && formik.errors.lastName && (
                      <span className="account-form-error-text" role="alert">{formik.errors.lastName}</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="account-form-actions">
              <button type="submit" className="account-btn primary" disabled={formik.isSubmitting} aria-busy={formik.isSubmitting}>
                {formik.isSubmitting ? 'Saving…' : 'Save changes'}
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

export default EditProfile;
