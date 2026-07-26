import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFundBalance, getPublicHistory } from '../app/modules/payment/core/_requests';
import type { FundBalanceDTO, PublicPaymentHistoryDTO } from '../app/modules/payment/core/_models';
import '../styles/dashboard.css';
import '../styles/payment.css';

const PAGE_SIZE = 15;

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

const Fund: React.FC = () => {
  const [balance, setBalance] = useState<FundBalanceDTO | null>(null);
  const [history, setHistory] = useState<PublicPaymentHistoryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = useCallback(async () => {
    try {
      const data = await getFundBalance();
      setBalance(data);
    } catch (e) {
      setError((e as any)?.response?.data?.message || 'Failed to load fund balance.');
    }
  }, []);

  const loadHistory = useCallback(async (pageNum: number) => {
    try {
      const result = await getPublicHistory(pageNum, PAGE_SIZE);
      setHistory(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setPage(result.number);
    } catch (e) {
      setError((e as any)?.response?.data?.message || 'Failed to load contribution history.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadBalance(), loadHistory(0)])
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadBalance, loadHistory]);

  const goToPage = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    setLoading(true);
    loadHistory(p).finally(() => setLoading(false));
  };

  if (loading && !balance && history.length === 0) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="fund-main dashboard-content">
        <div className="private-page-title-block">
          <h1>Fund balance & transparency</h1>
          <p>Current fund balance and recent contributions (donor details are masked for privacy).</p>
        </div>

        {error && (
          <div className="payment-message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {balance && (
          <div className="fund-balance-hero">
            <h2>Current fund balance</h2>
            <div className="balance-amount">{formatCurrency(balance.totalBalance)}</div>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.9375rem' }}>
              Total contributions: {formatCurrency(balance.totalContributions)}
              {balance.totalDisbursements > 0 && ` · Disbursements: ${formatCurrency(balance.totalDisbursements)}`}
            </p>
          </div>
        )}

        <div className="payment-card">
          <h2>Recent contributions</h2>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <p>No contributions yet.</p>
              <Link to="/contribute" className="payment-submit" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-block' }}>
                Be the first to contribute
              </Link>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrap">
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Contributor</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className="contributor-name" title={row.fullName ? undefined : 'Name masked for privacy'}>
                            {row.fullName ?? row.maskedName ?? '—'}
                          </span>
                          <br />
                          <small className="contributor-email">{row.fullEmail ?? row.maskedEmail ?? '—'}</small>
                        </td>
                        <td>{formatDate(row.paymentDate)}</td>
                        <td className="amount-cell">{formatCurrency(row.amount)}</td>
                        <td>{row.paymentMethod || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <span className="pagination-info">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements}
                  </span>
                  <div className="pagination-btns">
                    <button type="button" onClick={() => goToPage(page - 1)} disabled={page === 0 || loading}>
                      Previous
                    </button>
                    <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1 || loading}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--ink-500)', marginTop: '1rem' }}>
          <Link to="/contribute" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>
            Contribute to the fund
          </Link>
          {' · '}
          <Link to="/my-contributions" style={{ color: 'var(--ink-500)' }}>
            My contributions
          </Link>
          {' · '}
          <Link to="/dashboard" style={{ color: 'var(--ink-500)' }}>
            Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Fund;
