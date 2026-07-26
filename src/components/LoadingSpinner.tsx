import React from 'react';
import '../styles/auth.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div className="submit-button loading" style={{ width: '48px', height: '48px' }}></div>
      <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
    </div>
  );
};

export default LoadingSpinner;

