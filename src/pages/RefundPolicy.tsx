import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const RefundPolicy: React.FC = () => {
  return (
    <PublicLayout>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">Refund Policy</h1>
          <p className="page-subtitle">
            Our policy regarding refunds for contributions made to the Alumni Student Support Fund.
          </p>
          <p className="page-subtitle" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      <div className="page-content">
        <section className="content-block">
          <h2>1. Overview</h2>
          <p>
            The Alumni Student Support Fund accepts voluntary contributions from alumni and supporters 
            to fund educational expenses for underprivileged students. This Refund Policy explains 
            under what circumstances we may process refunds and how to request one.
          </p>
        </section>

        <section className="content-block">
          <h2>2. General Policy</h2>
          <p>
            <strong>Contributions are generally non-refundable.</strong> When you contribute to the 
            fund, the amount is allocated toward student support (school fees, educational materials, 
            etc.). We operate as a non-profit; funds are committed based on planned support for 
            selected students.
          </p>
        </section>

        <section className="content-block">
          <h2>3. When Refunds May Be Considered</h2>
          <p>We may consider refund requests in the following circumstances:</p>
          <ul className="simple-list">
            <li><strong>Duplicate payment:</strong> You accidentally made the same contribution twice.</li>
            <li><strong>Wrong amount:</strong> You entered an incorrect amount due to a technical error and contacted us promptly (within 24–48 hours).</li>
            <li><strong>Unauthorized transaction:</strong> You did not authorize the payment (e.g., card fraud, account compromise). In such cases, report to your bank and to us immediately.</li>
          </ul>
          <p>
            Refund requests are evaluated on a case-by-case basis. Approval is at our discretion and 
            subject to fund availability and verification.
          </p>
        </section>

        <section className="content-block">
          <h2>4. How to Request a Refund</h2>
          <p>
            To request a refund, please contact us through our <Link to="/contact">Contact</Link> page 
            with the following information:
          </p>
          <ul className="simple-list">
            <li>Transaction ID or payment reference (from your contribution confirmation)</li>
            <li>Date and amount of the contribution</li>
            <li>Reason for the refund request</li>
            <li>Your registered email address</li>
          </ul>
          <p>
            We will respond within 5–7 business days. If your request is approved, refunds will be 
            processed to the original payment method within 7–14 business days, depending on your 
            bank or payment provider.
          </p>
        </section>

        <section className="content-block">
          <h2>5. Payment Gateway</h2>
          <p>
            Payments are processed through Razorpay. Refunds, when approved, are processed via Razorpay 
            to the original payment method. Razorpay's terms and refund processing timelines apply:{' '}
            <a href="https://razorpay.com/terms" target="_blank" rel="noopener noreferrer">razorpay.com/terms</a>
          </p>
        </section>

        <section className="content-block">
          <h2>6. Non-Refundable Situations</h2>
          <p>Refunds will typically not be granted for:</p>
          <ul className="simple-list">
            <li>Change of mind after contribution</li>
            <li>Contributions made more than 30 days prior to the request (except in cases of fraud or duplicate payment)</li>
            <li>Requests where we cannot verify the transaction or the requester's identity</li>
          </ul>
        </section>

        <section className="content-block highlight-block">
          <h2>7. Contact</h2>
          <p>
            For refund-related queries, please use our <Link to="/contact">Contact</Link> page. 
            We are committed to handling all requests fairly and responsibly.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};

export default RefundPolicy;
