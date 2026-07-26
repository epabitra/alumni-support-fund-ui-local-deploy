import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  actions?: React.ReactNode;
  variant?: 'admin' | 'service-center' | 'verifier' | 'default';
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions,
  variant = 'default'
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'admin':
        return 'page-header-admin';
      case 'service-center':
        return 'page-header-service-center';
      case 'verifier':
        return 'page-header-verifier';
      default:
        return 'page-header-default';
    }
  };

  return (
    <div className={`page-header ${getVariantClass()}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.path ? (
                <a href={crumb.path} className="breadcrumb-link">
                  {crumb.label}
                </a>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="breadcrumb-separator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
