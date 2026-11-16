import React, { useEffect, useMemo, useState } from 'react';
import {
  correctAdminPayment,
  getAdminPaymentEntry,
  type AdminPaymentEntry,
  type AdminUserDTO
} from '../../app/modules/auth/core/_user_requests';
import { getAdminEvents } from '../../app/modules/events/core/_requests';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import { ModalShell } from '../events/EventModals';
import { MemberPicker, memberName } from './MemberPicker';
import { AmountField, FundChoice, amountError, formatDay, istDay, todayISO } from './PaymentFields';
import { formatRupees, parseRupees } from './amountWords';
import './admin-payments.css';
import DateInput from '../DateInput';

const REASONS = ['Wrong amount typed', 'Wrong member chosen', 'Wrong event / fund', 'Wrong date'];

/**
 * Correct a payment an admin recorded: member, amount, fund and the day it was received.
 * The change shows everywhere (receipts, contributions, fund and event totals); earlier corrections are listed.
 */
export const EditPaymentModal: React.FC<{
  orderId: string;
  onSaved: (entry: AdminPaymentEntry) => void;
  onClose: () => void;
}> = ({ orderId, onSaved, onClose }) => {
  const [entry, setEntry] = useState<AdminPaymentEntry | null>(null);
  const [loadError, setLoadError] = useState('');
  const [events, setEvents] = useState<FundEventDTO[]>([]);
  const [member, setMember] = useState<AdminUserDTO | null>(null);
  const [amount, setAmount] = useState('');
  const [fund, setFund] = useState('');
  const [paidOn, setPaidOn] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    getAdminPaymentEntry(orderId)
      .then((e) => {
        setEntry(e);
        const [firstName, ...rest] = (e.userName || '').split(' ');
        setMember({ id: e.userId, login: e.userEmail || '', email: e.userEmail || '', firstName, lastName: rest.join(' '), phone: e.userPhone, activated: true });
        setAmount(String(e.amount));
        setFund(e.fundEventId != null ? String(e.fundEventId) : '');
        setPaidOn(istDay(e.paidAt));
      })
      .catch((err) => setLoadError(err?.response?.data?.message || 'Could not load this payment.'));
    getAdminEvents().then((list) => setEvents(list.filter((e) => e.status === 'OPEN'))).catch(() => {});
  }, [orderId]);

  const n = parseRupees(amount);
  const amountErr = touched ? amountError(amount) : '';
  const fundTitle = (id: string) => (id ? events.find((e) => String(e.id) === id)?.title ?? entry?.purpose ?? 'Event' : 'General Fund');

  const changes = useMemo(() => {
    if (!entry || !member) return [];
    const list: string[] = [];
    if (member.email.toLowerCase() !== (entry.userEmail || '').toLowerCase()) list.push(`Member: ${entry.userName} → ${memberName(member)}`);
    if (!Number.isNaN(n) && n !== entry.amount) list.push(`Amount: ${formatRupees(entry.amount)} → ${formatRupees(n)}`);
    const oldFund = entry.fundEventId != null ? String(entry.fundEventId) : '';
    if (fund !== oldFund) list.push(`For: ${entry.purpose} → ${fundTitle(fund)}`);
    if (paidOn && paidOn !== istDay(entry.paidAt)) list.push(`Received on: ${formatDay(entry.paidAt)} → ${formatDay(paidOn + 'T12:00:00')}`);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, member, n, fund, paidOn, events]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!entry) return;
    if (!member) return setError('Please choose the member who paid.');
    const aErr = amountError(amount);
    if (aErr) return setError(aErr);
    if (!paidOn || paidOn > todayISO()) return setError('The date cannot be in the future.');
    if (changes.length === 0) return setError('Nothing has been changed yet.');
    if (!reason.trim()) return setError('Please say why this payment is being corrected.');
    setBusy(true);
    setError('');
    try {
      const saved = await correctAdminPayment(entry.orderId, {
        userEmail: member.email, amount: n, fundEventId: fund ? Number(fund) : null, paidOn, reason: reason.trim()
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save the correction.');
    } finally {
      setBusy(false);
    }
  };

  const fundEvents = entry && entry.fundEventId != null && !events.some((e) => e.id === entry.fundEventId)
    ? [...events, { id: entry.fundEventId, title: entry.purpose, endDate: todayISO(), collectionEnded: false } as FundEventDTO]
    : events;

  return (
    <ModalShell title="Edit payment" busy={busy} onClose={onClose} onSubmit={submit} error={error}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        {entry?.editable && (
          <button type="submit" className="btn btn-primary" disabled={busy || !entry}>{busy ? 'Saving…' : 'Save correction'}</button>
        )}
      </>}>
      {loadError && <div className="alert alert-danger">{loadError}</div>}
      {!entry && !loadError && <p className="event-modal-sub">Loading…</p>}
      {entry && !entry.editable && (
        <div className="ap-note warn">{entry.notEditableReason}</div>
      )}
      {entry && entry.editable && (
        <>
          <p className="event-modal-sub">
            Recorded {formatDay(entry.recordedAt)}{entry.recordedBy ? ` by ${entry.recordedBy}` : ''} · ref {entry.orderId}.
            The correction updates the receipt, the member's contributions, and the fund and event totals. The member is emailed.
          </p>
          <div className="form-group">
            <label className="form-label required" htmlFor="ep-member">Member</label>
            <MemberPicker inputId="ep-member" value={member} onChange={setMember} disabled={busy} />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="ep-amount">Amount received</label>
            <AmountField id="ep-amount" value={amount} quick={false} disabled={busy}
              onChange={(v) => { setAmount(v); setTouched(true); setError(''); }} error={amountErr}
              hint={!Number.isNaN(n) && n !== entry.amount ? <>Was {formatRupees(entry.amount)}</> : null} />
            {entry.refundedAmount > 0 && <p className="ap-hint">{formatRupees(entry.refundedAmount)} of it was refunded; the amount cannot go below that.</p>}
          </div>
          <div className="form-group">
            <span className="form-label required">For</span>
            <FundChoice name="ep-fund" value={fund} onChange={setFund} events={fundEvents} disabled={busy || entry.refundedAmount > 0} />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="ep-date">Received on</label>
            <DateInput id="ep-date" className="form-input ap-date" value={paidOn} max={todayISO()} disabled={busy}
              onChange={(e) => setPaidOn(e.target.value)} />
          </div>
          {changes.length > 0 && (
            <div className="ap-changes" role="status">
              <strong>You are changing</strong>
              <ul>{changes.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          <div className="form-group">
            <label className="form-label required" htmlFor="ep-reason">Why?</label>
            <div className="ap-quick">
              {REASONS.map((r) => (
                <button key={r} type="button" className={`ap-chip ${reason === r ? 'active' : ''}`} onClick={() => setReason(r)} disabled={busy}>{r}</button>
              ))}
            </div>
            <input id="ep-reason" className="form-input" maxLength={500} value={reason} disabled={busy}
              onChange={(e) => setReason(e.target.value)} placeholder="For example: typed 5000 instead of 500" />
          </div>
        </>
      )}
      {entry && entry.corrections.length > 0 && (
        <details className="ap-history">
          <summary>Earlier corrections ({entry.corrections.length})</summary>
          <ul>
            {entry.corrections.map((c, i) => (
              <li key={i}>
                <span>{formatDay(c.correctedAt)}{c.correctedBy ? ` · ${c.correctedBy}` : ''}</span>
                {c.oldAmount !== c.newAmount && <span>Amount {formatRupees(c.oldAmount)} → {formatRupees(c.newAmount)}</span>}
                {c.oldUser !== c.newUser && <span>Member {c.oldUser} → {c.newUser}</span>}
                {c.oldPurpose !== c.newPurpose && <span>For {c.oldPurpose} → {c.newPurpose}</span>}
                {c.oldPaidAt && c.newPaidAt && istDay(c.oldPaidAt) !== istDay(c.newPaidAt) && <span>Date {formatDay(c.oldPaidAt)} → {formatDay(c.newPaidAt)}</span>}
                <em>“{c.reason}”</em>
              </li>
            ))}
          </ul>
        </details>
      )}
    </ModalShell>
  );
};
