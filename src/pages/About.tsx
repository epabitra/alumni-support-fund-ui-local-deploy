import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

const About: React.FC = () => {
  return (
    <PublicLayout>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-title">About Us</h1>
          <p className="page-subtitle">
            Learn about our mission, values, and commitment to supporting 
            underprivileged students in their educational journey.
          </p>
        </div>
      </section>

      {/* Page Content */}
      <div className="page-content">
        {/* Background Section */}
        <section className="content-block">
          <h2>Background & Motivation</h2>
          <p>
            As former students who have experienced the transformative power of education, 
            we have made a commitment to give back to society. We recognize that many children 
            face serious financial hardship that prevents them from continuing their education. 
            This initiative is our response to that challenge.
          </p>
          <p>
            <strong>Every year, we identify and support two underprivileged students</strong> by 
            paying their school fees continuously until they complete Class 10 or until their 
            family's financial condition improves.
          </p>
          <p>
            This initiative is <strong>non-profit, non-political, and driven purely by humanitarian values</strong>.
          </p>
        </section>

        {/* Problem Section */}
        <section className="content-block">
          <h2>The Problem We Are Solving</h2>
          <p>
            Before this platform, identifying and supporting deserving students was challenging because:
          </p>
          <ul className="simple-list">
            <li>Applications were informal and unstructured</li>
            <li>There was no transparent selection process</li>
            <li>Student data was not securely stored</li>
            <li>Verification was manual and inconsistent</li>
            <li>Long-term tracking was difficult</li>
          </ul>
          <p>
            Our digital platform solves these challenges by creating a secure, structured, and 
            transparent system for managing scholarship applications and student support.
          </p>
        </section>

        {/* Objectives Section */}
        <section className="content-block">
          <h2>Our Objectives</h2>
          <div className="objectives-list">
            <div className="objective-item">
              <span className="objective-number">01</span>
              <div className="objective-text">
                <h4>Centralized Portal</h4>
                <p>Create a single, secure platform for scholarship applications.</p>
              </div>
            </div>
            <div className="objective-item">
              <span className="objective-number">02</span>
              <div className="objective-text">
                <h4>Fair Selection</h4>
                <p>Ensure unbiased and transparent student selection process.</p>
              </div>
            </div>
            <div className="objective-item">
              <span className="objective-number">03</span>
              <div className="objective-text">
                <h4>Secure Data</h4>
                <p>Maintain student information with highest security standards.</p>
              </div>
            </div>
            <div className="objective-item">
              <span className="objective-number">04</span>
              <div className="objective-text">
                <h4>Annual Monitoring</h4>
                <p>Track student progress year-by-year for continued support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Are Not Section */}
        <section className="content-block">
          <h2>What This Project Is NOT</h2>
          <ul className="not-list">
            <li>Not a donation collection platform</li>
            <li>Not politically or religiously affiliated</li>
            <li>Not a public voting or popularity system</li>
            <li>Not a cash-distribution program</li>
          </ul>
        </section>

        {/* Vision Section */}
        <section className="content-block highlight-block">
          <h2>Our Vision</h2>
          <p>
            This project is not just about technology. It is about <strong>responsibility, dignity, 
            and long-term impact</strong>. Our goal is to ensure that financial hardship never becomes 
            a reason for a child to stop learning.
          </p>
          <p>
            We believe every child deserves the opportunity to learn, grow, and build a better future 
            regardless of their family's financial circumstances.
          </p>
        </section>
      </div>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Learn More?</h2>
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

export default About;
