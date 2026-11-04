import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { fetchProfileImageBlobUrl } from '../app/modules/auth/core/_user_requests';
import { ROLE_ADMIN, ROLE_VERIFIER, ROLE_SERVICE_CENTER, ROLE_AUDITOR, ROLE_USER } from '../app/Constants';
import '../styles/dashboard.css';

const SWIPE_THRESHOLD = 80;

/** SVG path data (24x24, stroke) for menu icons */
const ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  fund: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  people: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  addPerson: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  wallet: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  coin: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  school: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  receipt: 'M9 14l2 2 4-4M7 3h10a2 2 0 012 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z',
  globe: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21v-2a7 7 0 0114 0v2',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  eyeOff: 'M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.563 3.029M6.228 6.228A9.956 9.956 0 002.458 12c1.274 4.057 5.064 7 9.542 7a9.46 9.46 0 005.31-1.617',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
} as const;

type IconName = keyof typeof ICONS;

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

interface NavGroup {
  /** Title of the desktop dropdown / sidebar section */
  label: string;
  items: NavItem[];
}

const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 20 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

const DASHBOARD_ITEM: NavItem = { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' };
const MY_CONTRIBUTIONS_ITEM: NavItem = { to: '/my-contributions', label: 'My Contributions', icon: 'receipt' };
const FUND_ITEM: NavItem = { to: '/fund', label: 'Transparency', icon: 'fund' };
const SELECTED_STUDENTS_ITEM: NavItem = { to: '/selected-students', label: 'Selected Students', icon: 'people' };

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: 'Students',
    items: [
      { to: '/admin/students', label: 'All students', icon: 'people' },
      { to: '/service-center/register-student', label: 'Register student', icon: 'addPerson' },
      { to: '/verifier/pending', label: 'Verify & edit fees', icon: 'check' },
      { to: '/admin/selection', label: 'Selection', icon: 'check' },
      { to: '/admin/reviews', label: 'Annual reviews', icon: 'clipboard' }
    ]
  },
  {
    label: 'Payments',
    items: [
      { to: '/admin/scholarship-payments', label: 'Scholarship payments', icon: 'wallet' },
      { to: '/admin/add-payment', label: 'Record contribution', icon: 'coin' }
    ]
  },
  {
    label: 'Manage',
    items: [
      { to: '/admin/schools', label: 'Schools', icon: 'school' },
      { to: '/admin/users', label: 'Users', icon: 'people' }
    ]
  }
];

const SERVICE_CENTER_ITEMS: NavItem[] = [
  { to: '/service-center/register-student', label: 'Register Student', icon: 'addPerson' },
  { to: '/service-center/my-applications', label: 'My Applications', icon: 'clipboard' }
];

const VERIFIER_ITEMS: NavItem[] = [
  { to: '/verifier/pending', label: 'Verifications', icon: 'check' }
];

const AUDITOR_ITEMS: NavItem[] = [
  { to: '/auditor/dashboard', label: 'Audit', icon: 'fund' }
];

/** Desktop dropdown menu for a group of links */
const NavDropdown: React.FC<{ group: NavGroup; isActive: (path: string) => boolean }> = ({ group, isActive }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const groupActive = group.items.some((i) => isActive(i.to));

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button
        type="button"
        className={`nav-link nav-dropdown-toggle ${groupActive ? 'active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {group.label}
        <svg className="nav-dropdown-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="nav-dropdown-menu" role="menu">
          {group.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              className={`nav-dropdown-item ${isActive(item.to) ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

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
    let cancelled = false;
    fetchProfileImageBlobUrl()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        profileImageUrlRef.current = url;
        setProfileImageUrl(url);
      })
      .catch(() => setProfileImageUrl(null));
    return () => {
      cancelled = true;
      if (profileImageUrlRef.current) {
        URL.revokeObjectURL(profileImageUrlRef.current);
        profileImageUrlRef.current = null;
      }
    };
  }, [currentUser?.imageUrl]);

  const hasRole = (role: string) => {
    return currentUser?.authorities?.includes(role) || false;
  };

  const isAdmin = hasRole(ROLE_ADMIN);
  // Admin reaches registration and verification through the Students menu, so these are only for the other roles
  const showServiceCenter = hasRole(ROLE_SERVICE_CENTER) && !isAdmin;
  const showVerifier = hasRole(ROLE_VERIFIER) && !isAdmin;
  const canContribute = hasRole(ROLE_USER) || isAdmin;

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

  /** Sections of the mobile sidebar, same structure as the desktop bar */
  const sidebarGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        DASHBOARD_ITEM,
        ...(canContribute ? [MY_CONTRIBUTIONS_ITEM] : []),
        { ...FUND_ITEM, label: 'Fund transparency' },
        SELECTED_STUDENTS_ITEM
      ]
    },
    ...(isAdmin ? ADMIN_GROUPS : []),
    ...(showServiceCenter ? [{ label: 'Service Center', items: SERVICE_CENTER_ITEMS }] : []),
    ...(showVerifier ? [{ label: 'Verifier', items: VERIFIER_ITEMS }] : []),
    ...(hasRole(ROLE_AUDITOR) ? [{ label: 'Auditor', items: AUDITOR_ITEMS }] : [])
  ];

  const topLinks: NavItem[] = [
    DASHBOARD_ITEM,
    ...(canContribute ? [MY_CONTRIBUTIONS_ITEM] : []),
    FUND_ITEM,
    SELECTED_STUDENTS_ITEM,
    ...(showServiceCenter ? SERVICE_CENTER_ITEMS : []),
    ...(showVerifier ? VERIFIER_ITEMS : []),
    ...(hasRole(ROLE_AUDITOR) ? AUDITOR_ITEMS : [])
  ];

  const closeProfile = () => setIsProfileOpen(false);

  return (
    <>
      <nav className={`role-nav ${isAdmin ? 'role-nav--admin' : ''}`}>
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
          {topLinks.map((item) => (
            <Link key={item.to} to={item.to} className={isActive(item.to) ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </Link>
          ))}
          {isAdmin && ADMIN_GROUPS.map((group) => <NavDropdown key={group.label} group={group} isActive={isActive} />)}
        </div>

        <div className="nav-user nav-desktop">
          {canContribute && (
            <Link to="/contribute" className={`nav-cta ${isActive('/contribute') ? 'active' : ''}`} aria-label="Contribute">
              <Icon name="heart" size={16} />
              <span>Contribute</span>
            </Link>
          )}

          <div className="nav-user-dropdown" ref={profileRef}>
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
                <Link to="/" className="nav-user-dropdown-item nav-user-dropdown-public" onClick={closeProfile}>
                  <Icon name="globe" size={16} />
                  <span>Visit public website</span>
                </Link>
                <div className="nav-user-dropdown-divider" />
                <Link to="/account/profile" className="nav-user-dropdown-item" onClick={closeProfile}>
                  <Icon name="user" size={16} />
                  <span>Edit profile</span>
                </Link>
                <Link to="/account/change-password" className="nav-user-dropdown-item" onClick={closeProfile}>
                  <Icon name="lock" size={16} />
                  <span>Change password</span>
                </Link>
                <Link to="/account/mask-my-info" className="nav-user-dropdown-item" onClick={closeProfile}>
                  <Icon name="eyeOff" size={16} />
                  <span>Mask my info</span>
                </Link>
                <div className="nav-user-dropdown-divider" />
                <button type="button" onClick={() => { handleLogout(); closeProfile(); }} className="nav-user-dropdown-item nav-user-dropdown-logout">
                  <Icon name="logout" size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
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
          {canContribute && (
            <Link to="/contribute" className="nav-cta sidebar-cta" onClick={closeSidebar}>
              <Icon name="heart" size={16} />
              <span>Contribute</span>
            </Link>
          )}
        </div>

        <div className="sidebar-nav">
          {sidebarGroups.map((group) => (
            <div className="sidebar-section" key={group.label}>
              <div className="sidebar-section-title">{group.label}</div>
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={isActive(item.to) ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={closeSidebar}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link sidebar-account-link" onClick={closeSidebar}>
            <Icon name="globe" />
            <span>Visit public website</span>
          </Link>
          <Link to="/account/profile" className="sidebar-link sidebar-account-link" onClick={closeSidebar}>
            <Icon name="user" />
            <span>Edit profile</span>
          </Link>
          <Link to="/account/change-password" className="sidebar-link sidebar-account-link" onClick={closeSidebar}>
            <Icon name="lock" />
            <span>Change password</span>
          </Link>
          <Link to="/account/mask-my-info" className="sidebar-link sidebar-account-link" onClick={closeSidebar}>
            <Icon name="eyeOff" />
            <span>Mask my info</span>
          </Link>
          <button onClick={() => { handleLogout(); closeSidebar(); }} className="sidebar-logout">
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default RoleBasedNav;
