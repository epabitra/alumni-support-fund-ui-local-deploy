import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { getAuth } from '../app/modules/auth/core/AuthHelpers';
import { ROLE_ADMIN, ROLE_VERIFIER, ROLE_SERVICE_CENTER, ROLE_AUDITOR } from '../app/Constants';
import { GET_ACCOUNT_PROFILE_IMAGE } from '../app/Constants';
import '../styles/dashboard.css';

const SWIPE_THRESHOLD = 80;

const RoleBasedNav: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileImageUrlRef = useRef<string | null>(null);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser?.imageUrl) {
      if (profileImageUrlRef.current) {
        URL.revokeObjectURL(profileImageUrlRef.current);
        profileImageUrlRef.current = null;
      }
      setProfileImageUrl(null);
      return;
    }
    const auth = getAuth();
    if (!auth?.api_token) return;
    fetch(GET_ACCOUNT_PROFILE_IMAGE, { headers: { Authorization: `Bearer ${auth.api_token}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) {
          if (profileImageUrlRef.current) URL.revokeObjectURL(profileImageUrlRef.current);
          const url = URL.createObjectURL(blob);
          profileImageUrlRef.current = url;
          setProfileImageUrl(url);
        }
      })
      .catch(() => {});
    return () => {
      if (profileImageUrlRef.current) {
        URL.revokeObjectURL(profileImageUrlRef.current);
        profileImageUrlRef.current = null;
      }
    };
  }, [currentUser?.imageUrl]);

  const hasRole = (role: string) => {
    return currentUser?.authorities?.includes(role) || false;
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  const closeSidebar = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleSidebarTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleSidebarTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current;
    if (diff > SWIPE_THRESHOLD) closeSidebar();
  };

  const userInitials = useMemo(() => {
    const first = currentUser?.firstName?.[0] || '';
    const last = currentUser?.lastName?.[0] || '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || currentUser?.login?.[0]?.toUpperCase() || 'U';
  }, [currentUser?.firstName, currentUser?.lastName, currentUser?.login]);

  const primaryRole = useMemo(() => {
    const role = currentUser?.authorities?.[0] || 'ROLE_USER';
    return role.replace('ROLE_', '').replace('_', ' ');
  }, [currentUser?.authorities]);

  return (
    <>
      <nav className="role-nav">
        <div className="nav-brand">
          <Link to="/dashboard" className="nav-brand-link">
            <span className="nav-brand-icon">🎓</span>
            <span className="nav-brand-text">Alumni Support Fund</span>
          </Link>
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="nav-links nav-desktop">
          <Link to="/" className={`nav-link nav-link-public ${location.pathname === '/' ? 'active' : ''}`} title="Go to public site">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Public Site</span>
          </Link>
          <Link to="/dashboard" className={isActive('/dashboard') ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </Link>
          <Link to="/selected-students" className={isActive('/selected-students') ? 'nav-link active' : 'nav-link'}>
            Selected Students
          </Link>
          {hasRole(ROLE_ADMIN) && (
            <>
              <Link to="/admin/schools" className={isActive('/admin/schools') ? 'nav-link active' : 'nav-link'}>
                Schools
              </Link>
              <Link to="/admin/students" className={isActive('/admin/students') ? 'nav-link active' : 'nav-link'}>
                Students
              </Link>
              <Link to="/admin/selection" className={isActive('/admin/selection') ? 'nav-link active' : 'nav-link'}>
                Selection
              </Link>
              <Link to="/admin/reviews" className={isActive('/admin/reviews') ? 'nav-link active' : 'nav-link'}>
                Reviews
              </Link>
              <Link to="/admin/users" className={isActive('/admin/users') ? 'nav-link active' : 'nav-link'}>
                Users
              </Link>
              <Link to="/admin/add-payment" className={isActive('/admin/add-payment') ? 'nav-link active' : 'nav-link'}>
                Add payment
              </Link>
            </>
          )}

          {hasRole(ROLE_SERVICE_CENTER) && (
            <>
              <Link to="/service-center/register-student" className={isActive('/service-center/register-student') ? 'nav-link active' : 'nav-link'}>
                Register Student
              </Link>
              <Link to="/service-center/my-applications" className={isActive('/service-center/my-applications') ? 'nav-link active' : 'nav-link'}>
                My Applications
              </Link>
            </>
          )}

          {hasRole(ROLE_VERIFIER) && (
            <Link to="/verifier/pending" className={isActive('/verifier/pending') ? 'nav-link active' : 'nav-link'}>
              Pending Verifications
            </Link>
          )}

          {hasRole(ROLE_AUDITOR) && (
            <Link to="/auditor/dashboard" className={isActive('/auditor/dashboard') ? 'nav-link active' : 'nav-link'}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="nav-user nav-desktop nav-user-dropdown" ref={profileRef}>
          <button
            type="button"
            className="nav-user-avatar-btn"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label="Open profile menu"
            aria-expanded={isProfileOpen}
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" className="nav-user-avatar nav-user-avatar-img" />
            ) : (
              <span className="nav-user-avatar">{userInitials}</span>
            )}
          </button>
          {isProfileOpen && (
            <div className="nav-user-dropdown-menu">
              <div className="nav-user-dropdown-header">
                <span className="nav-user-dropdown-name">{currentUser?.firstName} {currentUser?.lastName}</span>
                <span className="nav-user-dropdown-role">{primaryRole}</span>
              </div>
              <Link to="/account/profile" className="nav-user-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                Edit profile
              </Link>
              <Link to="/account/change-password" className="nav-user-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                Change password
              </Link>
              <Link to="/account/mask-my-info" className="nav-user-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                Mask my info
              </Link>
              <button type="button" onClick={() => { handleLogout(); setIsProfileOpen(false); }} className="nav-user-dropdown-item nav-user-dropdown-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${isMenuOpen ? 'show' : ''}`} onClick={closeSidebar} />
      <aside
        className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}
        onTouchStart={handleSidebarTouchStart}
        onTouchEnd={handleSidebarTouchEnd}
      >
        <div className="sidebar-header">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="" className="sidebar-avatar-img" />
              ) : (
                userInitials
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.firstName} {currentUser?.lastName}</div>
              <div className="sidebar-user-role">{primaryRole}</div>
              <div className="sidebar-user-email">{currentUser?.email}</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section sidebar-section-public">
            <div className="sidebar-section-title">Public website</div>
            <Link to="/" className="sidebar-link sidebar-link-public" onClick={closeSidebar}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home & Public Site</span>
            </Link>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            <Link to="/dashboard" className={isActive('/dashboard') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link to="/fund" className={isActive('/fund') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Fund Transparency</span>
            </Link>
            <Link to="/selected-students" className={isActive('/selected-students') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Selected Students</span>
            </Link>
          </div>
          {hasRole(ROLE_ADMIN) && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Admin</div>
              <Link to="/admin/schools" className={isActive('/admin/schools') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Manage Schools</span>
              </Link>
              <Link to="/admin/students" className={isActive('/admin/students') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>All Students</span>
              </Link>
              <Link to="/admin/selection" className={isActive('/admin/selection') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Selection</span>
              </Link>
              <Link to="/admin/reviews" className={isActive('/admin/reviews') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Reviews</span>
              </Link>
              <Link to="/admin/users" className={isActive('/admin/users') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Users</span>
              </Link>
              <Link to="/admin/add-payment" className={isActive('/admin/add-payment') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Add payment</span>
              </Link>
            </div>
          )}

          {hasRole(ROLE_SERVICE_CENTER) && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Service Center</div>
              <Link to="/service-center/register-student" className={isActive('/service-center/register-student') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Register Student</span>
              </Link>
              <Link to="/service-center/my-applications" className={isActive('/service-center/my-applications') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>My Applications</span>
              </Link>
            </div>
          )}

          {hasRole(ROLE_VERIFIER) && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Verifier</div>
              <Link to="/verifier/pending" className={isActive('/verifier/pending') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pending Verifications</span>
              </Link>
            </div>
          )}

          {hasRole(ROLE_AUDITOR) && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Auditor</div>
              <Link to="/auditor/dashboard" className={isActive('/auditor/dashboard') ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setIsMenuOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <Link to="/account/profile" className="sidebar-link sidebar-account-link" onClick={() => setIsMenuOpen(false)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21v-2a7 7 0 0114 0v2" />
            </svg>
            <span>Edit profile</span>
          </Link>
          <Link to="/account/change-password" className="sidebar-link sidebar-account-link" onClick={() => setIsMenuOpen(false)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Change password</span>
          </Link>
          <Link to="/account/mask-my-info" className="sidebar-link sidebar-account-link" onClick={() => setIsMenuOpen(false)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Mask my info</span>
          </Link>
          <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="sidebar-logout">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default RoleBasedNav;
