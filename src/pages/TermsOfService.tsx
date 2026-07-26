import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const TermsOfService: React.FC = () => {
  return (
    <PublicLayout>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-subtitle">
            Terms and conditions governing the use of the Alumni Student Support Fund platform.
          </p>
          <p className="page-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <div className="page-content">
        <section className="content-block">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Alumni Student Support Fund platform ("Platform") at 
            ssvmalumnisupport.online, you agree to be bound by these Terms of Service ("Terms"). 
            If you do not agree to these Terms, please do not use our Platform.
          </p>
        </section>

        <section className="content-block">
          <h2>2. Description of Service</h2>
          <p>
            The Alumni Student Support Fund is a non-profit, non-political initiative that supports 
            underprivileged students in their educational journey. The Platform provides:
          </p>
          <ul className="simple-list">
            <li>A portal for authorized service centers to register and manage scholarship applications</li>
            <li>A system for alumni and contributors to support the fund through voluntary contributions</li>
            <li>Tools for administrators and verifiers to review applications and manage student support</li>
          </ul>
          <p>
            <strong>This is not a donation platform.</strong> We are committed to transparent, ethical, 
            and sustainable student support. Contributions go directly toward funding school fees and 
            essential educational needs for selected students.
          </p>
        </section>

        <section className="content-block">
          <h2>3. User Accounts and Roles</h2>
          <p>
            Access to the Platform is role-based. You may register as an Agent (contributor), and 
            certain roles such as Service Center, Verifier, or Admin are assigned by the platform 
            administrators. You are responsible for:
          </p>
          <ul className="simple-list">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information during registration</li>
          </ul>
        </section>

        <section className="content-block">
          <h2>4. Contributions and Payments</h2>
          <p>
            Contributions to the fund are voluntary and processed through Razorpay, our payment 
            gateway. By making a contribution:
          </p>
          <ul className="simple-list">
            <li>You confirm that you are authorized to use the payment method</li>
            <li>You agree to our <Link to="/refund-policy">Refund Policy</Link></li>
            <li>You understand that contributions support scholarship and educational expenses</li>
          </ul>
          <p>
            Payment processing is subject to Razorpay's terms: <a href="https://razorpay.com/terms" target="_blank" rel="noopener noreferrer">razorpay.com/terms</a>
          </p>
        </section>

        <section className="content-block">
          <h2>5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="simple-list">
            <li>Use the Platform for any unlawful purpose or in violation of applicable laws</li>
            <li>Submit false or misleading information in applications or registrations</li>
            <li>Attempt to gain unauthorized access to the Platform, other accounts, or systems</li>
            <li>Interfere with or disrupt the Platform's operation or security</li>
            <li>Use the Platform to harass, harm, or defraud others</li>
          </ul>
        </section>

        <section className="content-block">
          <h2>6. Intellectual Property</h2>
          <p>
            The Platform, including its design, content, and software, is owned by the Alumni 
            Student Support Fund or its licensors. You may not copy, modify, distribute, or 
            create derivative works without prior written permission.
          </p>
        </section>

        <section className="content-block">
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            The Platform is provided "as is" and "as available" without warranties of any kind, 
            either express or implied. We do not warrant that the Platform will be uninterrupted, 
            error-free, or free of harmful components.
          </p>
        </section>

        <section className="content-block">
          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, the Alumni Student Support Fund and its 
            organizers shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages arising from your use of the Platform.
          </p>
        </section>

        <section className="content-block">
          <h2>9. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our <Link to="/privacy-policy">Privacy Policy</Link>. 
            By using the Platform, you consent to the collection and use of information as described therein.
          </p>
        </section>

        <section className="content-block">
          <h2>10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify users of material changes by 
            posting the updated Terms on this page and updating the "Last updated" date. Your 
            continued use of the Platform after such changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="content-block highlight-block">
          <h2>11. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us through our{' '}
            <Link to="/contact">Contact</Link> page.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};

export default TermsOfService;
