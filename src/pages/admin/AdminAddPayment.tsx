import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminEvents } from '../../app/modules/events/core/_requests';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import {
  addPaymentAsAdmin,
  getAdminPaymentEntries,
  searchMembers,
  type AdminAddPaymentResult,
  type AdminPaymentEntry,
  type AdminUserDTO
} from '../../app/modules/auth/core/_user_requests';
import { getReceipt } from '../../app/modules/payment/core/_requests';
import type { ReceiptDTO } from '../../app/modules/payment/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import ReceiptContainer from '../../components/Receipt/ReceiptContainer';
import { MemberPicker, initials, memberName, type MemberPickerHandle } from '../../components/admin/MemberPicker';
import { AmountField, FundChoice, amountError, formatDay, todayISO } from '../../components/admin/PaymentFields';
import { EditPaymentModal } from '../../components/admin/EditPaymentModal';
import { formatRupees, parseRupees } from '../../components/admin/amountWords';
import '../../styles/professional-ui.css';
import '../../styles/events.css';
import './admin.css';
import '../../components/admin/admin-payments.css';
import DateInput from '../../components/DateInput';

/** What was just recorded, for the confirmation panel */
interface Done {
  result: AdminAddPaymentResult;
  member: AdminUserDTO;
  amount: number;
  purpose: string;
  paidOn: string;
}

/** Receipt of one payment in a dialog, so it never lingers on the form */
const ReceiptDialog: React.FC<{ orderId: string; onClose: () => void }> = ({ orderId, onClose }) => {
  const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    getReceipt(orderId).then(setReceipt).catch((e) => setError(e?.response?.data?.message || 'Could not load the receipt.'));
  }, [orderId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ap-receipt-modal" role="dialog" aria-modal="true" aria-label="Receipt" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Receipt</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {!receipt && !error && <p>Loading receipt…</p>}
          {receipt && <ReceiptContainer data={receipt} showLinks={false} />}
        </div>
      </div>
    </div>
  );
};

const AdminAddPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const picker = useRef<MemberPickerHandle>(null);
  const [events, setEvents] = useState<FundEventDTO[]>([]);
  const [member, setMember] = useState<AdminUserDTO | null>(null);
  const [amount, setAmount] = useState('');
  /** '' = General Fund */
  const [fund, setFund] = useState<string>(searchParams.get('event') ?? '');
  const [paidOn, setPaidOn] = useState(todayISO());
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const [receiptFor, setReceiptFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const [recent, setRecent] = useState<AdminPaymentEntry[]>([]);
  const [recentPage, setRecentPage] = useState(0);
  const [recentTotalPages, setRecentTotalPages] = useState(0);
  const [recentLoading, setRecentLoading] = useState(true);

  const loadRecent = useCallback((page = 0) => {
    setRecentLoading(true);
    getAdminPaymentEntries(page, 8)
      .then((res) => {
        setRecent((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setRecentPage(page);
        setRecentTotalPages(res.totalPages);
      })
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    getAdminEvents().then((list) => setEvents(list.filter((e) => e.status === 'OPEN'))).catch(() => {});
    loadRecent(0);
  }, [loadRecent]);

  // ?user=email (from the Users page) chooses the member straight away
  useEffect(() => {
    const email = searchParams.get('user');
    if (!email) return;
    searchMembers(email, 5).then((list) => {
      const match = list.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (match) setMember(match);
    }).catch(() => {});
  }, [searchParams]);

  const chosenEvent = events.find((e) => String(e.id) === fund);
  const fundValue = chosenEvent ? fund : '';
  const purpose = chosenEvent ? chosenEvent.title : 'General Fund';
  const n = parseRupees(amount);
  const amountErr = submitted || amount ? amountError(amount) : '';
  const ready = !!member && !amountError(amount) && !!paidOn && paidOn <= todayISO();

  const reset = () => {
    setDone(null);
    setMember(null);
    setAmount('');
    setPaidOn(todayISO());
    setSubmitted(false);
    setError('');
    setNotice('');
    setTimeout(() => picker.current?.focus(), 0);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setNotice('');
    if (!member) return setError('Please choose the member who paid.');
    const aErr = amountError(amount);
    if (aErr) return setError(aErr);
    if (!paidOn || paidOn > todayISO()) return setError('The date the money was received cannot be in the future.');
    setError('');
    setBusy(true);
    try {
      const res = await addPaymentAsAdmin({
        userEmail: member.email,
        amount: n,
        fundEventId: chosenEvent ? chosenEvent.id : undefined,
        paidOn
      });
      setDone({ result: res.data, member, amount: n, purpose: res.data.purpose || purpose, paidOn });
      loadRecent(0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.fieldErrors?.[0]?.message || 'Could not record the payment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Record a payment"
          subtitle="For money a member gave by UPI, bank transfer or cash. It is added to the fund and to the member's history, and the member gets an email receipt."
        />

        <div className="ap-layout">
          <section className="admin-card ap-main" aria-label="Record a payment">
            {done ? (
              <div className="ap-done" role="status">
                <div className="ap-done-icon" aria-hidden>✓</div>
                <h2>{formatRupees(done.amount)} recorded</h2>
                <p className="ap-done-line">
                  from <strong>{memberName(done.member)}</strong> for <strong>{done.purpose}</strong>, received {formatDay(done.paidOn + 'T12:00:00')}
                </p>
                <p className="ap-done-ref">Reference {done.result.orderId} · a receipt was emailed to {done.member.email}</p>
                <div className="ap-done-actions">
                  <button type="button" className="btn btn-primary" onClick={reset} autoFocus>+ Record another payment</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setReceiptFor(done.result.orderId)}>View / print receipt</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(done.result.orderId)}>Made a mistake? Edit</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="ap-form">
                <div className="ap-step">
                  <span className="ap-step-no" aria-hidden>1</span>
                  <div className="ap-step-body">
                    <label className="ap-label" htmlFor="ap-member">Who paid?</label>
                    <MemberPicker ref={picker} inputId="ap-member" value={member} onChange={(m) => { setMember(m); setError(''); }}
                      disabled={busy} invalid={submitted && !member} />
                    {submitted && !member && <p className="ap-words error">Please choose the member who paid.</p>}
                  </div>
                </div>

                <div className="ap-step">
                  <span className="ap-step-no" aria-hidden>2</span>
                  <div className="ap-step-body">
                    <label className="ap-label" htmlFor="ap-amount">How much?</label>
                    <AmountField id="ap-amount" value={amount} onChange={(v) => { setAmount(v); setError(''); }} error={amountErr} disabled={busy} />
                  </div>
                </div>

                <div className="ap-step">
                  <span className="ap-step-no" aria-hidden>3</span>
                  <div className="ap-step-body">
                    <span className="ap-label">For</span>
                    <FundChoice name="ap-fund" value={fundValue} onChange={setFund} events={events} disabled={busy} />
                  </div>
                </div>

                <div className="ap-step">
                  <span className="ap-step-no" aria-hidden>4</span>
                  <div className="ap-step-body">
                    <label className="ap-label" htmlFor="ap-date">Received on</label>
                    <DateInput id="ap-date" className="form-input ap-date" value={paidOn} max={todayISO()} disabled={busy}
                      onChange={(e) => setPaidOn(e.target.value)} />
                  </div>
                </div>

                {error && <div className="alert alert-danger" role="alert">{error}</div>}

                <div className="ap-submit-bar">
                  <p className="ap-summary">
                    {ready
                      ? <>Recording <strong>{formatRupees(n)}</strong> from <strong>{memberName(member!)}</strong> for <strong>{purpose}</strong>.</>
                      : 'Choose the member and enter the amount.'}
                  </p>
                  <button type="submit" className="btn btn-primary ap-submit" disabled={busy}>
                    {busy ? 'Recording…' : ready ? `Record ${formatRupees(n)}` : 'Record payment'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="admin-card ap-recent" aria-labelledby="ap-recent-title">
            <div className="ap-recent-head">
              <h2 id="ap-recent-title">Recent entries</h2>
              <Link to="/fund?tab=received">All contributions →</Link>
            </div>
            {notice && <div className="ap-note ok" role="status">{notice}</div>}
            {recent.length === 0 && !recentLoading && <p className="ap-empty">Payments you record will appear here.</p>}
            <ul className="ap-recent-list">
              {recent.map((r) => {
                const name = r.userName || r.userEmail || '—';
                return (
                  <li key={r.orderId} className={done?.result.orderId === r.orderId ? 'just-added' : ''}>
                    <span className="mp-avatar" aria-hidden>{initials(name)}</span>
                    <div className="ap-recent-text">
                      <strong>{name}</strong>
                      <small>
                        {r.purpose} · {formatDay(r.paidAt)}
                        {r.correctedAt && <span className="ap-tag" title={`Corrected ${formatDay(r.correctedAt)}`}>edited</span>}
                      </small>
                    </div>
                    <div className="ap-recent-side">
                      <strong className="ap-recent-amount">{formatRupees(r.amount)}</strong>
                      <span className="ap-recent-actions">
                        <button type="button" className="ap-link" onClick={() => setReceiptFor(r.orderId)}>Receipt</button>
                        {r.editable && <button type="button" className="ap-link" onClick={() => setEditing(r.orderId)}>Edit</button>}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {recentPage + 1 < recentTotalPages && (
              <button type="button" className="btn btn-secondary btn-sm ap-more" disabled={recentLoading} onClick={() => loadRecent(recentPage + 1)}>
                {recentLoading ? 'Loading…' : 'Show more'}
              </button>
            )}
          </aside>
        </div>

        {receiptFor && <ReceiptDialog orderId={receiptFor} onClose={() => setReceiptFor(null)} />}
        {editing && (
          <EditPaymentModal
            orderId={editing}
            onClose={() => setEditing(null)}
            onSaved={(entry) => {
              setEditing(null);
              setNotice(`Saved. ${entry.userName}'s payment is now ${formatRupees(entry.amount)} for ${entry.purpose}, everywhere.`);
              if (done && done.result.orderId === entry.orderId) {
                setDone({
                  ...done,
                  amount: entry.amount,
                  purpose: entry.purpose,
                  member: { ...done.member, email: entry.userEmail || done.member.email, firstName: entry.userName, lastName: '' }
                });
              }
              loadRecent(0);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default AdminAddPayment;
