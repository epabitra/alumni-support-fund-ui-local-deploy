import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/modules/auth/core/Auth';
import { ROLE_ADMIN, ROLE_USER } from '../app/Constants';
import RoleBasedNav from '../components/RoleBasedNav';
import { getFundBalance, getPublicHistory } from '../app/modules/payment/core/_requests';
import type { FundBalanceDTO, PublicPaymentHistoryDTO } from '../app/modules/payment/core/_models';
import { fetchStudentImageBlobUrl, getScholarshipPaymentHistory } from '../app/modules/scholarship/core/_requests';
import type { ScholarshipPaymentDTO } from '../app/modules/scholarship/core/_models';
import { formatLocalDate } from '../components/ScholarshipPaymentModal';
import { ReceiptList } from '../components/ScholarshipReceipts';
import ImageViewer from '../components/ImageViewer';
import { DataTableToolbar, DataTablePagination, SortHeader, TableQuery } from '../components/DataTable';
import '../styles/dashboard.css';
import '../styles/payment.css';

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'NETBANKING', label: 'Net banking' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'EMI', label: 'EMI' },
  { value: 'ADMIN', label: 'Paid to admin' }
];

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

function methodLabel(method?: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || method || '—';
}

/**
 * Loads a page whenever any part of the query (including extra filters) changes;
 * a slower, older response never overwrites a newer one.
 */
function useServerTable<T, Q extends TableQuery>(query: Q, load: (q: Q) => Promise<{ content: T[]; totalElements: number; totalPages: number }>) {
  const [rows, setRows] = useState<T[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    if (query.from && query.to && query.from > query.to) return;
    const id = ++requestId.current;
    setLoading(true);
    load(query)
      .then((res) => {
        if (id !== requestId.current) return;
        setRows(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
        setError('');
      })
      .catch((e) => id === requestId.current && setError(e?.response?.data?.message || 'Failed to load data.'))
      .finally(() => id === requestId.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  return { rows, totalElements, totalPages, loading, error };
}

const DEFAULT_QUERY: TableQuery = { page: 0, size: 10, search: '', from: '', to: '', sortBy: 'date', sortDir: 'desc' };

/** Each photo is fetched once per visit, however many rows that contributor has */
const avatarCache = new Map<string, Promise<string>>();

function loadAvatar(imageUrl: string): Promise<string> {
  let request = avatarCache.get(imageUrl);
  if (!request) {
    request = fetchStudentImageBlobUrl(imageUrl);
    request.catch(() => avatarCache.delete(imageUrl));
    avatarCache.set(imageUrl, request);
  }
  return request;
}

/** Photo opens in the zoom viewer. Masked contributors get a neutral icon, so nothing identifies them. */
const ContributorAvatar: React.FC<{ name?: string; imageUrl?: string }> = ({ name, imageUrl }) => {
  const [src, setSrc] = useState('');
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc('');
    if (imageUrl) {
      loadAvatar(imageUrl).then((url) => !cancelled && setSrc(url)).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [imageUrl]);

  if (src && imageUrl) {
    return (
      <>
        <button type="button" className="contributor-avatar contributor-avatar-btn" onClick={() => setViewing(true)} aria-label={`View photo of ${name || 'contributor'}`}>
          <img src={src} alt="" />
        </button>
        {viewing && (
          <ImageViewer images={[{ contentUrl: imageUrl }]} title={name} downloadName="member-photo" onClose={() => setViewing(false)} />
        )}
      </>
    );
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    return <span className="contributor-avatar contributor-avatar-initials" aria-hidden>{initials}</span>;
  }
  return (
    <span className="contributor-avatar contributor-avatar-masked" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
};

const ContributionsTable: React.FC<{ onTotal: (total: number) => void }> = ({ onTotal }) => {
  const { currentUser } = useAuth();
  const canViewOwn = [ROLE_USER, ROLE_ADMIN].some((role) => currentUser?.authorities?.includes(role));
  const [query, setQuery] = useState<TableQuery & { extra: { method: string } }>({ ...DEFAULT_QUERY, extra: { method: '' } });
  const update = (patch: Partial<TableQuery>) => setQuery((q) => ({ ...q, ...patch }));
  const { rows, totalElements, totalPages, loading, error } = useServerTable<PublicPaymentHistoryDTO, typeof query>(query, (q) =>
    getPublicHistory(q.page, q.size, {
      search: q.search,
      from: q.from,
      to: q.to,
      method: q.extra.method,
      sortBy: q.sortBy as 'date' | 'amount',
      sortDir: q.sortDir
    })
  );
  const filtered = !!(query.search || query.from || query.to || query.extra.method);
  // The summary card shows the full count, not the count of a filtered search
  useEffect(() => {
    if (!filtered && !loading && !error) onTotal(totalElements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, loading, error, totalElements]);
  const onSort = (sortBy: string, sortDir: 'asc' | 'desc') => update({ sortBy, sortDir, page: 0 });

  return (
    <div className="payment-card">
      <div className="fund-card-header">
        <h2>Contributions</h2>
        {canViewOwn && <Link to="/my-contributions" className="fund-card-link">View my contributions →</Link>}
      </div>
      <DataTableToolbar
        query={query}
        onChange={update}
        searchPlaceholder="Name, email, amount or method"
        hasExtraFilters={!!query.extra.method}
        onClear={() => setQuery({ ...DEFAULT_QUERY, size: query.size, extra: { method: '' } })}
      >
        <div className="dt-field">
          <label className="dt-label">Method</label>
          <select
            className="dt-input custom-select"
            value={query.extra.method}
            onChange={(e) => setQuery((q) => ({ ...q, page: 0, extra: { method: e.target.value } }))}
          >
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </DataTableToolbar>

      {error && <div className="payment-message error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {!loading && rows.length === 0 && !filtered ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <p>No contributions yet.</p>
          <Link to="/contribute" className="payment-submit" style={{ marginTop: '1rem', textDecoration: 'none', display: 'inline-block' }}>
            Be the first to contribute
          </Link>
        </div>
      ) : (
        <>
          <div className={`table-scroll-wrap dt-table-wrap ${loading ? 'loading' : ''}`}>
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>Contributor</th>
                  <SortHeader label="Date" field="date" query={query} onSort={onSort} />
                  <SortHeader label="Amount" field="amount" query={query} onSort={onSort} />
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="dt-empty">{loading ? 'Loading…' : 'No contributions match these filters.'}</td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={`${query.page}-${idx}`}>
                      <td>
                        <div className="contributor-cell">
                          <ContributorAvatar name={row.fullName} imageUrl={row.profileImageUrl} />
                          <div className="contributor-text">
                            <span className="contributor-name" title={row.fullName ? undefined : 'Name masked for privacy'}>
                              {row.fullName ?? row.maskedName ?? '—'}
                            </span>
                            <small className="contributor-email">{row.fullEmail ?? row.maskedEmail ?? '—'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(row.paymentDate)}</td>
                      <td className="amount-cell">{formatCurrency(row.amount)}</td>
                      <td>{methodLabel(row.paymentMethod)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DataTablePagination query={query} totalElements={totalElements} totalPages={totalPages} loading={loading} onChange={update} />
          <p className="dt-note">Names and emails are searchable only for contributors who chose to show their details publicly.</p>
        </>
      )}
    </div>
  );
};

/** Where the student stood right after one payment */
const PaymentProgress: React.FC<{ paid: number; total: number }> = ({ paid, total }) => {
  const remaining = Math.max(0, total - paid);
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="payment-progress">
      <div className="payment-progress-paid">
        <strong>{formatCurrency(paid)}</strong> of {formatCurrency(total)} paid
      </div>
      <div className="payment-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Paid after this payment">
        <div className={`payment-progress-fill ${remaining === 0 ? 'complete' : ''}`} style={{ width: `${percent}%` }} />
      </div>
      <div className={`payment-progress-remaining ${remaining === 0 ? 'complete' : ''}`}>
        {remaining > 0 ? `${formatCurrency(remaining)} remaining` : '✓ Fully paid'}
      </div>
    </div>
  );
};

const ScholarshipPaymentsTable: React.FC<{ onTotal: (total: number) => void }> = ({ onTotal }) => {
  const [query, setQuery] = useState<TableQuery>(DEFAULT_QUERY);
  const update = (patch: Partial<TableQuery>) => setQuery((q) => ({ ...q, ...patch }));
  const { rows, totalElements, totalPages, loading, error } = useServerTable<ScholarshipPaymentDTO, TableQuery>(query, (q) =>
    getScholarshipPaymentHistory(q.page, q.size, {
      search: q.search,
      from: q.from,
      to: q.to,
      sortBy: q.sortBy as 'date' | 'amount' | 'student',
      sortDir: q.sortDir
    })
  );
  const filtered = !!(query.search || query.from || query.to);
  // The summary card shows the full count, not the count of a filtered search
  useEffect(() => {
    if (!filtered && !loading && !error) onTotal(totalElements);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, loading, error, totalElements]);
  const onSort = (sortBy: string, sortDir: 'asc' | 'desc') => update({ sortBy, sortDir, page: 0 });

  return (
    <div className="payment-card">
      <h2>Scholarship payments to students</h2>
      <DataTableToolbar
        query={query}
        onChange={update}
        searchPlaceholder="Student, school, purpose or amount"
        onClear={() => setQuery({ ...DEFAULT_QUERY, size: query.size })}
      />

      {error && <div className="payment-message error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {!loading && rows.length === 0 && !filtered ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <p>No scholarship payments made yet.</p>
        </div>
      ) : (
        <>
          <div className={`table-scroll-wrap dt-table-wrap ${loading ? 'loading' : ''}`}>
            <table className="payment-history-table">
              <thead>
                <tr>
                  <SortHeader label="Student" field="student" query={query} onSort={onSort} firstDir="asc" />
                  <SortHeader label="Paid on" field="date" query={query} onSort={onSort} />
                  <SortHeader label="Amount paid" field="amount" query={query} onSort={onSort} />
                  <th>Purpose &amp; receipts</th>
                  <th>After this payment</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dt-empty">{loading ? 'Loading…' : 'No scholarship payments match these filters.'}</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="contributor-name">{row.studentName || '—'}</span>
                        <br />
                        <small className="contributor-email">
                          {[row.schoolName, row.classLevel != null ? `Class ${row.classLevel}` : null, row.academicYear]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </small>
                      </td>
                      <td>
                        {formatLocalDate(row.paidOn)}
                        {row.paidOn && row.paymentDate && formatLocalDate(row.paidOn) !== formatDate(row.paymentDate) && (
                          <>
                            <br />
                            <small className="contributor-email">Recorded {formatDate(row.paymentDate)}</small>
                          </>
                        )}
                      </td>
                      <td className="amount-cell">{formatCurrency(row.amount)}</td>
                      <td className="scholarship-purpose-cell">
                        {row.remarks && <div className="scholarship-purpose-text">{row.remarks}</div>}
                        <ReceiptList receipts={row.receipts ?? []} emptyText="No receipt attached yet" />
                      </td>
                      <td><PaymentProgress paid={row.paidAfterThisPayment ?? row.totalPaid} total={row.totalCost} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DataTablePagination query={query} totalElements={totalElements} totalPages={totalPages} loading={loading} onChange={update} />
        </>
      )}
    </div>
  );
};

type FundTab = 'received' | 'paid';

const countLabel = (count: number | null, singular: string, plural: string) =>
  count == null ? '' : `${count} ${count === 1 ? singular : plural}`;

/**
 * Money in and money out are the two main questions on this page, so both are tabs at the top.
 * The tab is in the address (?tab=received or ?tab=paid), so other pages can link straight to it.
 */
const Fund: React.FC = () => {
  const [balance, setBalance] = useState<FundBalanceDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState<number | null>(null);
  const [paidCount, setPaidCount] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: FundTab = searchParams.get('tab') === 'received' ? 'received' : 'paid';

  useEffect(() => {
    getFundBalance()
      .then(setBalance)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load fund balance.'));
  }, []);

  const selectTab = (next: FundTab, focus = false) => {
    setSearchParams({ tab: next }, { replace: true });
    if (focus) document.getElementById(`fund-tab-${next}`)?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      selectTab(tab === 'received' ? 'paid' : 'received', true);
    }
  };

  const amount = (value?: number) => (balance ? formatCurrency(value ?? 0) : '—');

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="fund-main dashboard-content">
        <div className="private-page-title-block">
          <h1>Fund Transparency</h1>
          <p>See every rupee we received and how it was used for students. Donor details stay masked unless they choose to show them.</p>
        </div>

        {error && (
          <div className="payment-message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="fund-summary">
          <div className="fund-summary-tabs" role="tablist" aria-label="Fund details" onKeyDown={onTabKeyDown}>
            <button
              type="button"
              role="tab"
              id="fund-tab-received"
              aria-selected={tab === 'received'}
              aria-controls="fund-panel-received"
              tabIndex={tab === 'received' ? 0 : -1}
              className={`fund-summary-card fund-summary-tab ${tab === 'received' ? 'active' : ''}`}
              onClick={() => selectTab('received')}
            >
              <span className="fund-summary-label"><span aria-hidden>📥</span> Total received</span>
              <span className="fund-summary-amount">{amount(balance?.totalContributions)}</span>
              <span className="fund-summary-note">{countLabel(receivedCount, 'contribution', 'contributions')}</span>
              <span className="fund-summary-action">{tab === 'received' ? 'Showing below ↓' : 'View list →'}</span>
            </button>
            <button
              type="button"
              role="tab"
              id="fund-tab-paid"
              aria-selected={tab === 'paid'}
              aria-controls="fund-panel-paid"
              tabIndex={tab === 'paid' ? 0 : -1}
              className={`fund-summary-card fund-summary-tab ${tab === 'paid' ? 'active' : ''}`}
              onClick={() => selectTab('paid')}
            >
              <span className="fund-summary-label"><span aria-hidden>🎓</span> Paid to students</span>
              <span className="fund-summary-amount">{amount(balance?.totalDisbursements)}</span>
              <span className="fund-summary-note">{countLabel(paidCount, 'payment', 'payments')}</span>
              <span className="fund-summary-action">{tab === 'paid' ? 'Showing below ↓' : 'View list →'}</span>
            </button>
          </div>
          <div className="fund-summary-card fund-summary-balance">
            <span className="fund-summary-label"><span aria-hidden>💰</span> Available balance</span>
            <span className="fund-summary-amount">{amount(balance?.totalBalance)}</span>
            <span className="fund-summary-note">Ready for the next student payment</span>
          </div>
        </div>

        {/* Both stay mounted, so searches and filters survive switching tabs */}
        <div role="tabpanel" id="fund-panel-paid" aria-labelledby="fund-tab-paid" hidden={tab !== 'paid'}>
          <ScholarshipPaymentsTable onTotal={setPaidCount} />
        </div>
        <div role="tabpanel" id="fund-panel-received" aria-labelledby="fund-tab-received" hidden={tab !== 'received'}>
          <ContributionsTable onTotal={setReceivedCount} />
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
