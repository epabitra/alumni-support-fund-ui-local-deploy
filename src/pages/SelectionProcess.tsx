import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const SelectionProcess: React.FC = () => {
  return (
    <PublicLayout>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Selection Process</h1>
          <p className="page-subtitle">
            Our selection process is designed to be transparent, fair, and thorough. 
            We follow a structured workflow to ensure every application receives proper consideration.
          </p>
        </div>
      </section>

      {/* Page Content */}
      <div className="page-content">
        {/* Process Steps */}
        <section className="content-block">
          <h2>How It Works</h2>
          <p>
            Our five-step process ensures that every application is thoroughly reviewed 
            and that the most deserving students receive support.
          </p>
          
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-marker">1</div>
              <div className="timeline-content">
                <h3>Application Submission</h3>
                <p>
                  Students visit authorized service centers with all required documents. 
                  Service center staff help register the application in our secure system. 
                  Once submitted, the application cannot be edited to maintain integrity.
                </p>
                <div className="timeline-meta">
                  <span><strong>Where:</strong> Authorized Service Centers</span>
                  <span><strong>Cost:</strong> Free — No application fee</span>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">2</div>
              <div className="timeline-content">
                <h3>Document Verification</h3>
                <p>
                  Qualified verifiers thoroughly review each application to ensure all documents 
                  are authentic and the information provided is accurate.
                </p>
                <ul className="simple-list compact">
                  <li>All documents are verified for authenticity</li>
                  <li>Information is cross-checked against eligibility criteria</li>
                  <li>Financial situation is accurately assessed</li>
                  <li>Academic records are validated</li>
                </ul>
                <div className="timeline-meta">
                  <span><strong>Who:</strong> Authorized Verifiers</span>
                  <span><strong>Outcome:</strong> VALID or INVALID status</span>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">3</div>
              <div className="timeline-content">
                <h3>Committee Review & Selection</h3>
                <p>
                  Administrators review all verified applications and evaluate them based on 
                  established criteria. A maximum of <strong>two students per academic year </strong> 
                  are selected to ensure quality, sustained support.
                </p>
                <div className="timeline-meta">
                  <span><strong>Who:</strong> Admin Committee</span>
                  <span><strong>Limit:</strong> Maximum 2 students per year</span>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">4</div>
              <div className="timeline-content">
                <h3>Notification & Fee Payment</h3>
                <p>
                  Selected students are notified through official channels. Payments for school fees 
                  are made <strong>directly to the educational institution</strong>, not to students or parents.
                </p>
                <div className="timeline-meta">
                  <span><strong>Payment:</strong> Direct to school</span>
                  <span><strong>Frequency:</strong> Annually</span>
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-marker">5</div>
              <div className="timeline-content">
                <h3>Annual Review</h3>
                <p>
                  Selected students undergo annual reviews to ensure continued eligibility and 
                  monitor their progress.
                </p>
                <ul className="simple-list compact">
                  <li>Academic performance and progress assessment</li>
                  <li>Attendance and engagement evaluation</li>
                  <li>Continued financial need verification</li>
                  <li>Overall eligibility review for continued support</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Summary */}
        <section className="content-block">
          <h2>Process Timeline</h2>
          <p>
            The complete process typically takes <strong>4-6 weeks</strong> from application submission 
            to final selection notification.
          </p>
          <div className="timeline-summary">
            <div className="timeline-summary-item">
              <span className="summary-duration">1-2 weeks</span>
              <span className="summary-label">Application Period</span>
            </div>
            <div className="timeline-summary-item">
              <span className="summary-duration">1-2 weeks</span>
              <span className="summary-label">Verification</span>
            </div>
            <div className="timeline-summary-item">
              <span className="summary-duration">1 week</span>
              <span className="summary-label">Committee Review</span>
            </div>
            <div className="timeline-summary-item">
              <span className="summary-duration">1 week</span>
              <span className="summary-label">Notification</span>
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section className="content-block highlight-block">
          <h2>Transparency & Fairness</h2>
          <p>
            We are committed to maintaining the highest standards of fairness and transparency 
            throughout our selection process:
          </p>
          <ul className="simple-list">
            <li>All applications go through the same verification process</li>
            <li>Selection criteria are clearly defined and consistently applied</li>
            <li>No external influence or bias is permitted</li>
            <li>All decisions are documented and auditable</li>
            <li>Annual reviews ensure continued fairness</li>
          </ul>
        </section>
      </div>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start?</h2>
          <p className="cta-description">
            Check if you meet our eligibility criteria or contact us for more information.
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
    </PublicLayout>
  );
};

export default SelectionProcess;
