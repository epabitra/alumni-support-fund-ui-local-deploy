import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/theme.css';
import '../styles/public-modern.css';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 80;

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const touchStartX = useRef<number>(0);
  
  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Swipe-to-close: swipe right on drawer to close (drawer slides in from right)
  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current; // positive = swipe right
    if (diff > SWIPE_THRESHOLD) {
      closeMenu();
    }
  };

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  return (
    <div className="page-wrapper">
      {/* Professional Navbar */}
      <header className="public-header">
        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMenu}></div>
        )}
        <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="brand-icon">🎓</div>
            <div className="brand-text">
              <span className="brand-name">Alumni Support Fund</span>
              <span className="brand-tagline">Empowering Education</span>
            </div>
          </Link>
          
          <div
            className="navbar-mobile-drawer"
            onTouchStart={handleDrawerTouchStart}
            onTouchEnd={handleDrawerTouchEnd}
          >
            <div className="navbar-nav" onClick={(e) => e.stopPropagation()}>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
              <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={closeMenu}>About</Link>
              <Link to="/eligibility" className={`nav-link ${isActive('/eligibility') ? 'active' : ''}`} onClick={closeMenu}>Eligibility</Link>
              <Link to="/selection-process" className={`nav-link ${isActive('/selection-process') ? 'active' : ''}`} onClick={closeMenu}>Process</Link>
              <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={closeMenu}>Contact</Link>
            </div>
            <div className="navbar-cta" onClick={(e) => e.stopPropagation()}>
              <Link to="/login" className="btn-nav-secondary" onClick={closeMenu}>Agent Sign In</Link>
              <Link to="/register" className="btn-nav-primary" onClick={closeMenu}>Agent Registration</Link>
            </div>
          </div>
          
          <button
            type="button"
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
            aria-label="Toggle menu"
            onClick={toggleMenu}
          >
            <span></span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      {children}

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-about">
              <div className="footer-brand">
                <div className="footer-brand-icon">🎓</div>
                <span className="footer-brand-name">Alumni Support Fund</span>
              </div>
              <p className="footer-description">
                A non-profit initiative driven by humanitarian values, supporting deserving 
                students in their educational journey.
              </p>
            </div>
            
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/eligibility">Eligibility</Link></li>
                <li><Link to="/selection-process">Selection Process</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>For Agents</h4>
              <ul className="footer-links">
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/login">Agent Login</Link></li>
                <li><Link to="/register">Agent Register</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/refund-policy">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Alumni Student Support Fund. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
