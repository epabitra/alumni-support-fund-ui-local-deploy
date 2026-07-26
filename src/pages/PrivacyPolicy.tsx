import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const PrivacyPolicy: React.FC = () => {
  return (
    <PublicLayout>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="page-subtitle">
            How we collect, use, and protect your personal information when you use our platform.
          </p>
          <p className="page-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <div className="page-content">
        <section className="content-block">
          <h2>1. Introduction</h2>
          <p>
            Alumni Student Support Fund ("we", "us", or "our") operates the SSVM Alumni Support platform 
            at ssvmalumnisupport.online. We are committed to protecting your privacy and handling your 
            personal data in an open and transparent manner. This Privacy Policy explains how we collect, 
            use, store, and protect your information when you use our website and services.
          </p>
          <p>
            We are a non-profit, non-political initiative driven by humanitarian values. We do not sell 
            or rent your personal information to third parties.
          </p>
        </section>

        <section className="content-block">
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="simple-list">
            <li><strong>Account Information:</strong> Name, email address, contact details when you register as an agent or contribute.</li>
            <li><strong>Student Application Data:</strong> Information submitted by service centers for scholarship applications (e.g., student details, family information, documents).</li>
            <li><strong>Payment Information:</strong> Transaction details when you contribute to the fund. Payment processing is handled securely by Razorpay; we do not store full card or bank account numbers.</li>
            <li><strong>Usage Data:</strong> Log data such as IP address, browser type, and pages visited to improve our platform.</li>
          </ul>
        </section>

        <section className="content-block">
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="simple-list">
            <li>Process scholarship applications and manage student support</li>
            <li>Process contributions and maintain fund records</li>
            <li>Authenticate users and provide access to relevant features</li>
            <li>Communicate with you about applications, contributions, or support matters</li>
            <li>Improve our platform, security, and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="content-block">
          <h2>4. Payment Processing & Razorpay</h2>
          <p>
            Contributions are processed through Razorpay, a Payment Card Industry (PCI) compliant payment 
            gateway. When you make a contribution:
          </p>
          <ul className="simple-list">
            <li>Payment details (card/UPI/bank info) are entered directly on Razorpay's secure checkout</li>
            <li>We receive only transaction identifiers, amounts, and status—not full payment credentials</li>
            <li>Razorpay's privacy policy applies to how they handle payment data: <a href="https://razorpay.com/privacy" target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a></li>
          </ul>
        </section>

        <section className="content-block">
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data 
            against unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
            secure hosting, and access controls. Sensitive data is stored in encrypted form.
          </p>
        </section>

        <section className="content-block">
          <h2>6. Data Retention</h2>
          <p>
            We retain your information only for as long as necessary to fulfill the purposes outlined in 
            this policy, to comply with legal obligations, or to resolve disputes. Student application 
            data may be retained for audit and support purposes as required by our scholarship process.
          </p>
        </section>

        <section className="content-block">
          <h2>7. Your Rights</h2>
          <p>You may have the right to:</p>
          <ul className="simple-list">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
            <li>Request restriction of processing in certain circumstances</li>
          </ul>
          <p>
            To exercise these rights, please contact us through the <Link to="/contact">Contact</Link> page.
          </p>
        </section>

        <section className="content-block">
          <h2>8. Cookies and Tracking</h2>
          <p>
            We may use essential cookies and similar technologies to maintain your session and ensure 
            the platform functions correctly. We do not use third-party advertising or tracking cookies 
            for marketing purposes.
          </p>
        </section>

        <section className="content-block">
          <h2>9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites (e.g., Razorpay). We are not 
            responsible for the privacy practices of these external sites. We encourage you to read 
            their privacy policies before sharing any personal information.
          </p>
        </section>

        <section className="content-block">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes 
            by posting the updated policy on this page and updating the "Last updated" date. Continued 
            use of the platform after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="content-block highlight-block">
          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us 
            through our <Link to="/contact">Contact</Link> page.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;
