import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/theme.css';
import '../styles/public-modern.css';

const SWIPE_THRESHOLD = 80;

const Home: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const touchStartX = useRef<number>(0);
  const heroImages = [
    '/images/ssvm images/Full-School.jpg',
    '/images/ssvm images/Welcome-to-SSVM-Digapahandi.jpg',
    '/images/ssvm images/SSVM-Digapahandi-admission2026.jpg',
    '/images/ssvm images/park.jpg',
    '/images/ssvm images/ama-gourab.jpg'
  ].map((src) => encodeURI(src));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX.current; // positive = swipe right
    if (diff > SWIPE_THRESHOLD) closeMenu();
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [heroImages.length]);

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
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`} 
            aria-label="Toggle menu"
            onClick={toggleMenu}
          >
            <span></span>
          </button>
        </nav>
      </header>

      {/* Hero Section - Premium Design */}
      <section className="hero-section-premium">
        <div className="hero-background">
          <div className="hero-gradient"></div>
        </div>

        <div className="hero-container">
          <div className="hero-main">
            <div className="hero-badge-premium">
              <span className="badge-dot"></span>
              <span>Non-Profit</span>
              <span className="badge-divider"></span>
              <span>Non-Political</span>
              <span className="badge-divider"></span>
              <span>Humanitarian</span>
            </div>
            
            <h1 className="hero-headline">
              <span className="headline-line">
                <span className="headline-group">SSVM Alumni Students&nbsp;Fund</span>
              </span>
              <span className="headline-line headline-highlight">Keeping Dreams in Class</span>
            </h1>
            
            <p className="hero-subtext">
              We are former students of SSVM Digapahandi working together to support students
              who face financial hardship. Through a transparent alumni-led process, we
              sponsor school fees and essential learning needs until Class 10 so every child
              can stay in school with dignity.
            </p>
            
            <div className="hero-cta-group">
              <Link to="/eligibility" className="hero-cta-primary">
                <span>Check Eligibility</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/selection-process" className="hero-cta-secondary">
                <span>How It Works</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-gallery">
              <div
                className="hero-gallery-frame"
                style={
                  {
                    '--hero-image': `url("${heroImages[activeImageIndex]}")`
                  } as React.CSSProperties
                }
              >
                <img
                  key={`active-${activeImageIndex}`}
                  className="hero-gallery-image is-active"
                  src={heroImages[activeImageIndex]}
                  alt="SSVM campus and student activities"
                />
                <div className="hero-gallery-glow"></div>
              </div>
              <div className="hero-gallery-dots" role="tablist" aria-label="SSVM highlights">
                {heroImages.map((_, index) => (
                  <button
                    key={`hero-dot-${index}`}
                    type="button"
                    className={`hero-gallery-dot ${index === activeImageIndex ? 'is-active' : ''}`}
                    aria-label={`Show image ${index + 1}`}
                    onClick={() => setActiveImageIndex(index)}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Mission Section - Premium Design */}
      <section className="mission-section-premium">
        <div className="mission-container">
          <div className="mission-visual">
            <div className="mission-icon-block">
              <div className="mission-icon-inner">
                <span className="mission-emoji">🎯</span>
              </div>
              <div className="mission-icon-ring mission-icon-ring-1"></div>
              <div className="mission-icon-ring mission-icon-ring-2"></div>
            </div>
          </div>
          
          <div className="mission-content-block">
            <div className="mission-label">Our Purpose</div>
            <h2 className="mission-headline">Our Mission</h2>
            <p className="mission-description">
              We believe that every child deserves quality education regardless of their 
              family's financial situation. Through transparent processes, secure data 
              management, and ethical decision-making, we ensure that financial hardship 
              never becomes a barrier to learning.
            </p>
            <div className="mission-highlights">
              <div className="mission-highlight-item">
                <div className="highlight-icon">✓</div>
                <span>Transparent Process</span>
              </div>
              <div className="mission-highlight-item">
                <div className="highlight-icon">✓</div>
                <span>Secure Data</span>
              </div>
              <div className="mission-highlight-item">
                <div className="highlight-icon">✓</div>
                <span>Ethical Decisions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">What We Offer</span>
            <h2 className="section-title">Comprehensive Support System</h2>
            <p className="section-subtitle">
              Our program is designed to provide sustainable, long-term support while maintaining 
              the highest standards of transparency and security.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3 className="feature-title">Continuous Support</h3>
              <p className="feature-description">
                School fees paid annually until Class 10 completion or until the family's financial condition improves.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3 className="feature-title">Fair & Transparent</h3>
              <p className="feature-description">
                Structured application process with verification and selection by an independent committee.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-description">
                All student data is protected with industry-standard security. We respect dignity and privacy.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3 className="feature-title">Direct to Schools</h3>
              <p className="feature-description">
                Payments made directly to educational institutions. No cash handling. Completely free application.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Annual Review</h3>
              <p className="feature-description">
                Continuous monitoring of academic progress with annual reviews to ensure students benefit.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3 className="feature-title">Long-Term Impact</h3>
              <p className="feature-description">
                Sustainable model focused on long-term student success rather than one-time assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="principles-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Our Values</span>
            <h2 className="section-title">Core Principles</h2>
            <p className="section-subtitle">
              Every decision we make is guided by these fundamental principles.
            </p>
          </div>
          
          <div className="principles-grid">
            <div className="principle-card">
              <div className="principle-number">1</div>
              <div className="principle-content">
                <h4>Transparency</h4>
                <p>Clear rules, limited selection, and an open process that anyone can understand.</p>
              </div>
            </div>
            
            <div className="principle-card">
              <div className="principle-number">2</div>
              <div className="principle-content">
                <h4>Security</h4>
                <p>Protected student data with robust security measures and privacy safeguards.</p>
              </div>
            </div>
            
            <div className="principle-card">
              <div className="principle-number">3</div>
              <div className="principle-content">
                <h4>Fairness</h4>
                <p>No bias, no influence, no shortcuts. Every applicant is treated equally.</p>
              </div>
            </div>
            
            <div className="principle-card">
              <div className="principle-number">4</div>
              <div className="principle-content">
                <h4>Dignity</h4>
                <p>Respectful approach without public exposure of personal hardship.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Apply?</h2>
          <p className="cta-description">
            Visit your nearest authorized service center to submit an application. 
            Our team is here to help you through every step of the process.
          </p>
          <div className="cta-actions">
            <Link to="/eligibility" className="btn btn-primary btn-lg">
              Check Eligibility
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

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

export default Home;
