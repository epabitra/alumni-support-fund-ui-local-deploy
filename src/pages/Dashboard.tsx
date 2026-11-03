import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { ROLE_ADMIN, ROLE_SERVICE_CENTER, ROLE_VERIFIER, ROLE_AUDITOR } from '../app/Constants';
import RoleBasedNav from '../components/RoleBasedNav';
import { getFundBalance, getMyHistory } from '../app/modules/payment/core/_requests';
import type { FundBalanceDTO, PaymentTransactionDTO } from '../app/modules/payment/core/_models';
import '../styles/dashboard.css';
import '../styles/payment.css';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function statusBadge(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAILED') return 'failed';
  if (s === 'PENDING' || s === 'CREATED') return 'pending';
  return 'cancelled';
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [fundBalance, setFundBalance] = useState<FundBalanceDTO | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<PaymentTransactionDTO[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    getFundBalance().then(setFundBalance).catch(() => {});
    
    // Load recent transactions for the user
    setLoadingTransactions(true);
    getMyHistory(0, 5)
      .then((result) => {
        setRecentTransactions(result.content);
      })
      .catch(() => {
        setRecentTransactions([]);
      })
      .finally(() => {
        setLoadingTransactions(false);
      });
  }, []);

  const hasRole = (role: string) => {
    return currentUser?.authorities?.includes(role) || false;
  };

  const getRoleColor = () => {
    if (hasRole(ROLE_ADMIN)) return 'admin';
    if (hasRole(ROLE_SERVICE_CENTER)) return 'service-center';
    if (hasRole(ROLE_VERIFIER)) return 'verifier';
    return 'default';
  };

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content">
        <section className={`dashboard-hero ${getRoleColor()}`}>
          <div className="dashboard-hero-content">
            <div className="hero-greeting">
              <span className="hero-welcome">WELCOME BACK</span>
              <h1 className="hero-title">
                {currentUser?.firstName} {currentUser?.lastName}
              </h1>
              <p className="hero-subtitle">
                Together we're building a transparent scholarship program that changes lives.
              </p>
            </div>

            {fundBalance != null && (
              <div className="dashboard-fund-overview">
                <div className="fund-overview-header">
                  <h2 className="fund-overview-title">Organization fund</h2>
                  <Link to="/fund" className="fund-overview-link">View fund transparency →</Link>
                </div>
                <div className="fund-overview-stats">
                  <div className="stat-card fund-stat">
                    <div className="stat-card-icon">📥</div>
                    <div className="stat-card-label">Total collected</div>
                    <div className="stat-card-value">{formatCurrency(fundBalance.totalContributions ?? 0)}</div>
                  </div>
                  <div className="stat-card fund-stat fund-stat-available">
                    <div className="stat-card-icon">💰</div>
                    <div className="stat-card-label">Available balance</div>
                    <div className="stat-card-value">{formatCurrency(fundBalance.totalBalance ?? 0)}</div>
                  </div>
                  <div className="stat-card fund-stat">
                    <div className="stat-card-icon">📤</div>
                    <div className="stat-card-label">Total disbursed</div>
                    <div className="stat-card-value">{formatCurrency(fundBalance.totalDisbursements ?? 0)}</div>
                  </div>
                  <div className="stat-card fund-stat fund-stat-students">
                    <div className="stat-card-icon">🎓</div>
                    <div className="stat-card-label">Students supported</div>
                    <div className="stat-card-value">{fundBalance.selectedStudentsCount ?? 0}</div>
                    <Link to="/selected-students" className="fund-stat-link">View recipients →</Link>
                  </div>
                </div>
              </div>
            )}

            <div className="hero-quick-actions">
              <Link to="/contribute" className="hero-action-btn primary-cta">
                <span className="hero-action-icon">💳</span>
                <div className="btn-text-group">
                  <span className="btn-main-text">Make a Contribution</span>
                  <span className="btn-sub-text">Support students' education</span>
                </div>
              </Link>
              <Link to="/my-contributions" className="hero-action-btn">
                <span className="hero-action-icon">📊</span>
                <div className="btn-text-group">
                  <span className="btn-main-text">My Payment History</span>
                  <span className="btn-sub-text">Track your contributions</span>
                </div>
              </Link>
              {hasRole(ROLE_ADMIN) && (
                <Link to="/admin/students" className="hero-action-btn">
                  <span className="hero-action-icon">🎓</span>
                  <div className="btn-text-group">
                    <span className="btn-main-text">Manage Students</span>
                    <span className="btn-sub-text">View and track all applications</span>
                  </div>
                </Link>
              )}
              {hasRole(ROLE_SERVICE_CENTER) && (
                <Link to="/service-center/register-student" className="hero-action-btn">
                  <span className="hero-action-icon">📝</span>
                  <div className="btn-text-group">
                    <span className="btn-main-text">Register New Student</span>
                    <span className="btn-sub-text">Add student application</span>
                  </div>
                </Link>
              )}
              {hasRole(ROLE_VERIFIER) && (
                <Link to="/verifier/pending" className="hero-action-btn">
                  <span className="hero-action-icon">✅</span>
                  <div className="btn-text-group">
                    <span className="btn-main-text">Verify Applications</span>
                    <span className="btn-sub-text">Review pending students</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="dashboard-workspace">

          {hasRole(ROLE_ADMIN) && (
            <div className="workspace-section admin">
              <div className="workspace-header">
                <div className="workspace-icon">🎯</div>
                <div className="workspace-info">
                  <h3>Admin Workspace</h3>
                  <span className="workspace-subtitle">Full access controls</span>
                </div>
              </div>
              <div className="workspace-links">
                <Link to="/admin/schools" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Manage Schools</span>
                </Link>
                <Link to="/admin/students" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>View All Students</span>
                </Link>
                <Link to="/admin/selection" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Student Selection</span>
                </Link>
                <Link to="/admin/scholarship-payments" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Scholarship Payments</span>
                </Link>
                <Link to="/verifier/pending" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Verify Applications</span>
                </Link>
                <Link to="/service-center/register-student" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Register Student</span>
                </Link>
                <Link to="/admin/reviews" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span>Annual Reviews</span>
                </Link>
              </div>
            </div>
          )}

          {hasRole(ROLE_SERVICE_CENTER) && (
            <div className="workspace-section service-center">
              <div className="workspace-header">
                <div className="workspace-icon">📋</div>
                <div className="workspace-info">
                  <h3>Service Center</h3>
                  <span className="workspace-subtitle">Student registration desk</span>
                </div>
              </div>
              <div className="workspace-links">
                <Link to="/service-center/register-student" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Register Student</span>
                </Link>
                <Link to="/service-center/my-applications" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>My Applications</span>
                </Link>
              </div>
            </div>
          )}

          {hasRole(ROLE_VERIFIER) && (
            <div className="workspace-section verifier">
              <div className="workspace-header">
                <div className="workspace-icon">✅</div>
                <div className="workspace-info">
                  <h3>Verifier Desk</h3>
                  <span className="workspace-subtitle">Application verification</span>
                </div>
              </div>
              <div className="workspace-links">
                <Link to="/verifier/pending" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pending Verifications</span>
                </Link>
              </div>
            </div>
          )}

          {hasRole(ROLE_AUDITOR) && (
            <div className="workspace-section auditor">
              <div className="workspace-header">
                <div className="workspace-icon">📊</div>
                <div className="workspace-info">
                  <h3>Auditor Workspace</h3>
                  <span className="workspace-subtitle">Compliance & reporting</span>
                </div>
              </div>
              <div className="workspace-links">
                <Link to="/auditor/dashboard" className="workspace-link">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Audit Dashboard</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* My Recent Contributions section - after all other sections */}
        <div className="dashboard-recent-transactions">
          <div className="section-header-inline">
            <h2 className="section-title-inline">My Recent Contributions</h2>
            <Link to="/my-contributions" className="section-link-inline">View all →</Link>
          </div>
          
          {loadingTransactions ? (
            <div className="transactions-loading">
              <div className="spinner-small"></div>
              <span>Loading your contributions...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="transactions-empty">
              <div className="empty-icon">💳</div>
              <h3>No contributions yet</h3>
              <p>Your contribution history will appear here once you make your first payment.</p>
              <Link to="/contribute" className="empty-cta-btn">
                Make your first contribution
              </Link>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="transaction-card">
                  <div className="transaction-icon">
                    <span className={`transaction-status-icon ${statusBadge(tx.status)}`}>
                      {tx.status === 'SUCCESS' ? '✓' : tx.status === 'FAILED' ? '✗' : '⏳'}
                    </span>
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-amount">{formatCurrency(tx.amount)}</div>
                    <div className="transaction-meta">
                      {formatDate(tx.paymentDate || tx.createdDate)} • {tx.paymentMethod || 'Payment'}
                    </div>
                  </div>
                  <div className="transaction-badge">
                    <span className={`status-badge ${statusBadge(tx.status)}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

