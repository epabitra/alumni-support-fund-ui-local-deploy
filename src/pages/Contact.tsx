import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const Contact: React.FC = () => {
  return (
    <PublicLayout>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Contact & Support</h1>
          <p className="page-subtitle">
            We are here to help you throughout the application and support process. 
            Please use the appropriate channel based on your needs.
          </p>
        </div>
      </section>

      {/* Page Content */}
      <div className="page-content">
        {/* How to Reach Us */}
        <section className="content-block">
          <h2>How to Reach Us</h2>
          <p>
            Our support channels are designed to assist you at every stage of the application process:
          </p>
          <div className="contact-info-grid">
            <div className="contact-info-item">
              <div className="contact-info-icon">📍</div>
              <div className="contact-info-details">
                <h4>Service Centers</h4>
                <p>
                  For application submission, eligibility queries, and general information, 
                  please visit your nearest authorized service center.
                </p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">📋</div>
              <div className="contact-info-details">
                <h4>Application Support</h4>
                <p>
                  Service center staff are trained to assist with the entire application process, 
                  including form filling and document verification.
                </p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">🔒</div>
              <div className="contact-info-details">
                <h4>Privacy & Security</h4>
                <p>
                  We take data privacy seriously. All personal information is protected with 
                  industry-standard security measures.
                </p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon">⏰</div>
              <div className="contact-info-details">
                <h4>Office Hours</h4>
                <p>
                  Service centers operate during standard business hours. Contact your local 
                  center for specific operating hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Important Information */}
        <section className="content-block">
          <h2>Important Information</h2>
          <div className="info-list">
            <div className="info-list-item">
              <h4>Application Submission</h4>
              <p>
                Applications can only be submitted through authorized service centers. 
                Online direct submissions are not available at this time.
              </p>
            </div>
            <div className="info-list-item">
              <h4>Status Inquiries</h4>
              <p>
                Check your application status through your service center. 
                Updates are provided at each stage of the process.
              </p>
            </div>
            <div className="info-list-item">
              <h4>Document Requirements</h4>
              <p>
                Ensure all documents are authentic and current. 
                False information will result in immediate disqualification.
              </p>
            </div>
            <div className="info-list-item">
              <h4>No Fees</h4>
              <p>
                The application process is completely free. We do not charge any fees 
                for application, processing, or support services.
              </p>
            </div>
          </div>
        </section>

        {/* Our Commitment */}
        <section className="content-block highlight-block">
          <h2>Our Commitment</h2>
          <p>
            We are committed to providing transparent, fair, and respectful service to all applicants. 
            Our goal is to support deserving students while maintaining the highest standards of 
            integrity, privacy, and human dignity.
          </p>
          <p className="commitment-emphasis">
            This is a non-profit, non-political initiative driven purely by humanitarian values.
          </p>
        </section>
      </div>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Apply?</h2>
          <p className="cta-description">
            Check our eligibility criteria or learn about the selection process.
          </p>
          <div className="cta-actions">
            <Link to="/eligibility" className="btn btn-primary btn-lg">
              Check Eligibility
            </Link>
            <Link to="/selection-process" className="btn btn-secondary btn-lg">
              Selection Process
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
