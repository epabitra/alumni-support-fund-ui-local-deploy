import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import LoadingSpinner from '../components/LoadingSpinner';
import ReceiptContainer from '../components/Receipt/ReceiptContainer';
import { getMyContributions, getMyHistory, getReceipt } from '../app/modules/payment/core/_requests';
import type { UserContributionSummaryDTO, PaymentTransactionDTO, ReceiptDTO } from '../app/modules/payment/core/_models';
import '../styles/dashboard.css';
import '../styles/payment.css';

const PAGE_SIZE = 10;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Shorter date for table cells so they don’t wrap on small screens */
function formatDateShort(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function statusBadge(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SUCCESS' || s === 'PAID') return 'success';
  if (s === 'FAILED') return 'failed';
  if (s === 'PENDING' || s === 'CREATED') return 'pending';
  return 'cancelled';
}

const MyContributions: React.FC = () => {
  const [summary, setSummary] = useState<UserContributionSummaryDTO | null>(null);
  const [history, setHistory] = useState<PaymentTransactionDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getMyContributions();
      setSummary(data);
    } catch (e) {
      setError((e as any)?.response?.data?.message || 'Failed to load contribution summary.');
    }
  }, []);

  const loadHistory = useCallback(async (pageNum: number) => {
    try {
      const result = await getMyHistory(pageNum, PAGE_SIZE);
      setHistory(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setPage(result.number);
    } catch (e) {
      setError((e as any)?.response?.data?.message || 'Failed to load payment history.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadSummary(), loadHistory(0)])
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadSummary, loadHistory]);

  const goToPage = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    setLoading(true);
    loadHistory(p).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!receiptOrderId) {
      setReceipt(null);
      setReceiptError(null);
      return;
    }
    let cancelled = false;
    setReceiptLoading(true);
    setReceiptError(null);
    getReceipt(receiptOrderId)
      .then((data) => {
        if (!cancelled) {
          setReceipt(data);
          setReceiptLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setReceiptError(err.response?.data?.message || err.message || 'Failed to load receipt.');
          setReceiptLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [receiptOrderId]);

  if (loading && !summary && history.length === 0) {
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
      <main className="payment-main dashboard-content">
        <div className="private-page-title-block">
          <h1>My Contributions</h1>
          <p>Your contribution summary and payment history.</p>
        </div>

        {error && (
          <div className="payment-message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {summary && (
          <div className="contribution-summary">
            <div className="contribution-stat">
              <div className="contribution-stat-label">Total contributed</div>
              <div className="contribution-stat-value amount">{formatCurrency(summary.totalContributed)}</div>
            </div>
            <div className="contribution-stat">
              <div className="contribution-stat-label">Number of payments</div>
              <div className="contribution-stat-value">{summary.transactionCount}</div>
            </div>
            {summary.firstContributionDate && (
              <div className="contribution-stat">
                <div className="contribution-stat-label">First contribution</div>
                <div className="contribution-stat-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {formatDate(summary.firstContributionDate)}
                </div>
              </div>
            )}
            {summary.lastContributionDate && (
              <div className="contribution-stat">
                <div className="contribution-stat-label">Last contribution</div>
                <div className="contribution-stat-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {formatDate(summary.lastContributionDate)}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="payment-card">
          <h2>Payment history</h2>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>No payments yet.</p>
              <Link to="/contribute" className="payment-submit" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-block' }}>
                Contribute to the fund
              </Link>
            </div>
          ) : (
            <>
              <div className="table-scroll-wrap">
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx.id}>
                        <td className="payment-date-cell" title={formatDate(tx.paymentDate || tx.createdDate)}>{formatDateShort(tx.paymentDate || tx.createdDate)}</td>
                        <td className="transaction-id-cell">{tx.transactionId}</td>
                        <td className="amount-cell">{formatCurrency(tx.amount)}</td>
                        <td>{tx.paymentMethod || tx.paymentGateway || '—'}</td>
                        <td>
                          <span className={`status-badge ${statusBadge(tx.status)}`}>{tx.status}</span>
                        </td>
                        <td>
                          {tx.orderId ? (
                            <button
                              type="button"
                              className="payment-receipt-btn"
                              onClick={() => setReceiptOrderId(tx.orderId!)}
                            >
                              Download receipt
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
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

        {receiptOrderId && (
          <div className="payment-card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Receipt</h2>
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                onClick={() => { setReceiptOrderId(null); setReceipt(null); }}
              >
                Close
              </button>
            </div>
            {receiptLoading && <p>Loading receipt…</p>}
            {receiptError && <div className="payment-message error">{receiptError}</div>}
            {receipt && (
              <ReceiptContainer
                data={receipt}
                showLinks={false}
              />
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--ink-500)', marginTop: '1rem' }}>
          <Link to="/contribute" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>
            Contribute again
          </Link>
          {' · '}
          <Link to="/fund" style={{ color: 'var(--ink-500)' }}>
            Fund balance & transparency
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

export default MyContributions;
