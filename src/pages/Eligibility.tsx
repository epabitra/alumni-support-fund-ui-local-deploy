import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const Eligibility: React.FC = () => {
  return (
    <PublicLayout>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Eligibility Criteria</h1>
          <p className="page-subtitle">
            To ensure fair and transparent selection, we have established clear eligibility criteria. 
            Please review the requirements before submitting an application.
          </p>
        </div>
      </section>

      {/* Page Content */}
      <div className="page-content">
        {/* General Requirements */}
        <section className="content-block">
          <h2>General Requirements</h2>
          <p>
            To be considered for our scholarship program, applicants must meet the following basic criteria:
          </p>
          <ul className="simple-list">
            <li>Student must be currently enrolled in a recognized educational institution</li>
            <li>Student must be studying in Classes 1 through 10</li>
            <li>Must demonstrate genuine financial hardship</li>
            <li>Must maintain satisfactory academic performance</li>
            <li>Family income must be below the threshold indicating financial need</li>
            <li>Student must not be receiving similar support from other sources</li>
          </ul>
        </section>

        {/* Documentation Required */}
        <section className="content-block">
          <h2>Documentation Required</h2>
          <p>
            All documents must be authentic and verifiable. Please prepare the following before visiting a service center:
          </p>
          <div className="doc-list">
            <div className="doc-item">
              <strong>School Enrollment Proof</strong>
              <span>Current admission certificate or school ID card</span>
            </div>
            <div className="doc-item">
              <strong>Academic Records</strong>
              <span>Recent report cards or academic transcripts</span>
            </div>
            <div className="doc-item">
              <strong>Financial Documentation</strong>
              <span>Income certificates, family financial statements</span>
            </div>
            <div className="doc-item">
              <strong>Parent/Guardian Identification</strong>
              <span>Valid government ID (Aadhaar, Voter ID, etc.)</span>
            </div>
            <div className="doc-item">
              <strong>Address Proof</strong>
              <span>Current residential address documentation</span>
            </div>
            <div className="doc-item">
              <strong>Bank Details</strong>
              <span>School's bank account for fee payment (if selected)</span>
            </div>
          </div>
        </section>

        {/* Selection Criteria */}
        <section className="content-block">
          <h2>Selection Criteria</h2>
          <p>
            Selection is based on a comprehensive evaluation of multiple factors to ensure 
            the most deserving students receive support:
          </p>
          <div className="criteria-grid">
            <div className="criteria-item">
              <div className="criteria-percent">40%</div>
              <div className="criteria-info">
                <h4>Financial Need</h4>
                <p>Assessment of family's financial situation and genuine hardship</p>
              </div>
            </div>
            <div className="criteria-item">
              <div className="criteria-percent">30%</div>
              <div className="criteria-info">
                <h4>Academic Performance</h4>
                <p>Current academic standing and potential for improvement</p>
              </div>
            </div>
            <div className="criteria-item">
              <div className="criteria-percent">20%</div>
              <div className="criteria-info">
                <h4>Family Circumstances</h4>
                <p>Family size, dependents, and socio-economic factors</p>
              </div>
            </div>
            <div className="criteria-item">
              <div className="criteria-percent">10%</div>
              <div className="criteria-info">
                <h4>Future Potential</h4>
                <p>Student's attitude, commitment, and educational goals</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Duration */}
        <section className="content-block">
          <h2>Support Duration</h2>
          <p>
            Selected students will receive continuous support for school fees until any of the following conditions are met:
          </p>
          <ul className="simple-list">
            <li>Student completes Class 10 successfully</li>
            <li>Family's financial condition improves significantly</li>
            <li>Student discontinues education</li>
            <li>Student fails to maintain satisfactory academic performance (as determined by annual review)</li>
          </ul>
        </section>

        {/* Important Notes */}
        <section className="content-block highlight-block">
          <h2>Important Notes</h2>
          <ul className="simple-list">
            <li>Applications can only be submitted through authorized service centers</li>
            <li>All information provided must be accurate and verifiable</li>
            <li>False or misleading information will result in immediate disqualification</li>
            <li>Selected students must maintain eligibility throughout the support period</li>
            <li><strong>There is no application fee</strong> — the entire process is completely free</li>
          </ul>
        </section>
      </div>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Apply?</h2>
          <p className="cta-description">
            Visit your nearest authorized service center to submit an application.
          </p>
          <div className="cta-actions">
            <Link to="/selection-process" className="btn btn-primary btn-lg">
              View Selection Process
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

export default Eligibility;
