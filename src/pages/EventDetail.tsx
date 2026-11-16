import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import { useAuth } from '../app/modules/auth/core/Auth';
import { ROLE_ADMIN } from '../app/Constants';
import { deleteDraftEvent, getAdminEvents, getEvent, publishEvent, addEventExpenseReceipts, removeEventExpenseReceipt } from '../app/modules/events/core/_requests';
import type { FundEventChangeDTO, FundEventDTO, FundTransferDTO } from '../app/modules/events/core/_models';
import { getCheckoutConfig, getFundBalance } from '../app/modules/payment/core/_requests';
import type { PublicPaymentHistoryDTO } from '../app/modules/payment/core/_models';
import {
  CancelEventModal,
  CloseEventModal,
  EventFormModal,
  ExpenseModal,
  ModalShell,
  RefundModal,
  ReopenEventModal,
  TransferModal
} from '../components/events/EventModals';
import { EventProgress, EventStatusBadge, eventDates, LEFTOVER_NOTE, EventText } from '../components/events/EventBits';
import { formatINR, formatLocalDate } from '../components/ScholarshipPaymentModal';
import { ReceiptFilePicker, ReceiptList, validateReceiptFiles } from '../components/ScholarshipReceipts';
import { EventGallery, EventImageManager } from '../components/events/EventImages';
import { ShareEventButton } from '../components/events/ShareEvent';
import { WhatsAppPledge } from '../components/events/WhatsAppPledge';
import { EditPaymentModal } from '../components/admin/EditPaymentModal';
import { EventReportCard, PlanVsActual, qtyTimesPrice, ReportModal, ReportPrompt } from '../components/events/EventPlan';
import '../styles/dashboard.css';
import '../styles/payment.css';
import '../styles/events.css';

type Dialog =
  | { kind: 'edit' }
  | { kind: 'publish' }
  | { kind: 'expense' }
  | { kind: 'move' }
  | { kind: 'close' }
  | { kind: 'cancel' }
  | { kind: 'delete' }
  | { kind: 'refund'; donation: PublicPaymentHistoryDTO }
  | { kind: 'bills'; expenseId: number }
  | { kind: 'expenseDetails'; expenseId: number }
  | { kind: 'report' }
  | { kind: 'editDonation'; orderId: string }
  | { kind: 'reopen' }
  | null;

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const KIND_LABEL: Record<string, string> = {
  MANUAL: 'Moved by admin',
  COVER_SHORTFALL: 'To cover a payment',
  LEFTOVER: 'Left over at closing',
  CANCELLATION: 'Event cancelled',
  REOPEN: 'Brought back when reopened'
};

function changeText(c: FundEventChangeDTO): string {
  if (c.field === 'STATUS') return `Event reopened (it was ${c.oldValue === 'CANCELLED' ? 'cancelled' : 'closed'})`;
  if (c.field === 'BUDGET') return `Budget changed from ${formatINR(Number(c.oldValue))} to ${formatINR(Number(c.newValue))}`;
  const what = c.field === 'END_DATE' ? 'Last day for donations' : 'Start date';
  return `${what} changed from ${formatLocalDate(c.oldValue)} to ${formatLocalDate(c.newValue)}`;
}

/** Direction of a money move as seen from this event */
function moveLine(t: FundTransferDTO, eventId: number): { sign: '+' | '−'; other: string } {
  return t.toEventId === eventId ? { sign: '+', other: `from ${t.fromTitle}` } : { sign: '−', other: `to ${t.toTitle}` };
}

const AddBillsModal: React.FC<{ eventId: number; expenseId: number; existing: number; onSaved: () => void; onClose: () => void }> = ({
  eventId, expenseId, existing, onSaved, onClose
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return setError('Please choose at least one file.');
    const msg = validateReceiptFiles(files, existing);
    if (msg) return setError(msg);
    setBusy(true);
    try {
      await addEventExpenseReceipts(eventId, expenseId, files);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not upload the bills.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalShell title="Add bills" busy={busy} onClose={onClose} onSubmit={submit} error={error}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</button>
      </>}>
      <ReceiptFilePicker files={files} onChange={setFiles} existingCount={existing} disabled={busy} />
    </ModalShell>
  );
};

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = !!currentUser?.authorities?.includes(ROLE_ADMIN);
  const [event, setEvent] = useState<FundEventDTO | null>(null);
  const [error, setError] = useState('');
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);
  const [general, setGeneral] = useState<number | null>(null);
  const [allEvents, setAllEvents] = useState<FundEventDTO[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    getEvent(id)
      .then((e) => { setEvent(e); setError(''); })
      .catch((e) => setError(e?.response?.status === 404 ? 'This event does not exist or is not open yet.' : 'Could not load the event.'));
    if (isAdmin) {
      getFundBalance().then((b) => setGeneral(b.generalFundBalance ?? null)).catch(() => {});
      getAdminEvents().then(setAllEvents).catch(() => {});
    }
  }, [id, isAdmin]);

  useEffect(load, [load]);
  useEffect(() => {
    getCheckoutConfig().then((c) => setPaymentsEnabled(!!c.paymentsEnabled)).catch(() => setPaymentsEnabled(false));
  }, []);
  useEffect(() => {
    if (event && window.location.hash === '#donate') document.getElementById('donate')?.scrollIntoView({ block: 'center' });
  }, [event]);

  const done = (message: string) => {
    setDialog(null);
    setDialogError('');
    setNotice(message);
    load();
  };

  const runSimple = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setDialogError('');
    try {
      await action();
      done(message);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (error || !event) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content events-main">
          <Link to="/events" className="events-back">← All events</Link>
          {error ? <div className="payment-message error">{error}</div> : <p className="events-loading">Loading…</p>}
        </main>
      </div>
    );
  }

  const isOpen = event.status === 'OPEN';
  const canDonate = isOpen && !event.collectionEnded;
  const finished = event.status === 'CLOSED' || event.status === 'CANCELLED';
  const donorName = (d: PublicPaymentHistoryDTO) => d.fullName ?? d.maskedName ?? '—';

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content events-main">
        <Link to="/events" className="events-back">← All events</Link>

        <header className="event-hero">
          <div className="event-hero-main">
            <EventGallery images={event.images ?? []} title={event.title} />
            <EventStatusBadge event={event} />
            <h1>{event.title}</h1>
            <p className="event-hero-dates">Donations: {eventDates(event)}</p>
            {event.description && <p className="event-hero-desc"><EventText text={event.description} /></p>}
          </div>
          <div className="event-hero-side" id="donate">
            <EventProgress event={event} large />
            {canDonate && paymentsEnabled && (
              <Link to={`/contribute?event=${event.id}`} className="btn btn-primary event-donate-btn">Donate to this event</Link>
            )}
            {canDonate && paymentsEnabled != null && <WhatsAppPledge event={event} onlineAvailable={paymentsEnabled} />}
            {isOpen && event.collectionEnded && <p className="event-donate-offline">Donations for this event ended on {formatLocalDate(event.endDate)}.</p>}
            {!finished && <p className="event-leftover-note">{LEFTOVER_NOTE}</p>}
            <ShareEventButton event={event} className="btn btn-secondary event-share-btn" />
          </div>
        </header>

        {notice && <div className="payment-message success" role="status">{notice}</div>}

        <EventReportCard event={event} isAdmin={isAdmin} onEdit={() => setDialog({ kind: 'report' })} />
        {isAdmin && <ReportPrompt event={event} onWrite={() => setDialog({ kind: 'report' })} />}

        {isAdmin && !finished && (
          <div className="event-admin-bar" aria-label="Admin actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'edit' })}>Edit</button>
            {event.status === 'DRAFT' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialog({ kind: 'publish' })}>Open for donations</button>}
            {isOpen && <Link to={`/admin/add-payment?event=${event.id}`} className="btn btn-secondary btn-sm">Record a donation</Link>}
            {isOpen && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'expense' })}>Record spending</button>}
            {isOpen && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'report' })}>{event.hasReport ? 'Edit report' : 'Write report'}</button>}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'move' })}>Move money</button>
            {isOpen && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'close' })}>Close event</button>}
            <button type="button" className="btn btn-secondary btn-sm event-danger-link" onClick={() => setDialog({ kind: 'cancel' })}>Cancel event</button>
            {event.status === 'DRAFT' && event.balance === 0 && event.transferredIn === 0 && (
              <button type="button" className="btn btn-secondary btn-sm event-danger-link" onClick={() => setDialog({ kind: 'delete' })}>Delete draft</button>
            )}
          </div>
        )}

        {isAdmin && finished && (
          <div className="event-admin-bar" aria-label="Admin actions">
            <span className="event-admin-bar-note">This event is {event.status === 'CANCELLED' ? 'cancelled' : 'closed'}. Reopen it to edit it or change its spending.</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialog({ kind: 'reopen' })}>Reopen event</button>
          </div>
        )}

        {isAdmin && (
          <section className="payment-card" aria-labelledby="event-images-title">
            <h2 id="event-images-title">Banner images</h2>
            <EventImageManager eventId={event.id} images={event.images ?? []} onChange={(images) => setEvent({ ...event, images })} />
          </section>
        )}

        <section className="event-money" aria-label="Money of this event">
          <div className="event-money-item"><span>Donations</span><strong>{formatINR(event.collected)}</strong></div>
          {event.refunded > 0 && <div className="event-money-item"><span>Refunded</span><strong>−{formatINR(event.refunded)}</strong></div>}
          {event.transferredIn - (event.coveredFromGeneral ?? 0) > 0 && (
            <div className="event-money-item"><span>Set aside from other funds</span><strong>{formatINR(event.transferredIn - (event.coveredFromGeneral ?? 0))}</strong></div>
          )}
          {(event.coveredFromGeneral ?? 0) > 0 && (
            <div className="event-money-item"><span>General Fund covered</span><strong>{formatINR(event.coveredFromGeneral)}</strong></div>
          )}
          <div className="event-money-item"><span>Spent</span><strong>−{formatINR(event.spent)}</strong></div>
          {event.transferredOut > 0 && <div className="event-money-item"><span>Moved to other funds</span><strong>−{formatINR(event.transferredOut)}</strong></div>}
          <div className="event-money-item total"><span>Left now</span><strong>{formatINR(event.balance)}</strong></div>
        </section>

        <PlanVsActual event={event} />

        {finished && event.closingNote && (
          <div className="payment-card event-closing-note">
            <strong>{event.status === 'CANCELLED' ? 'Why it was cancelled' : 'Closing note'}:</strong> {event.closingNote}
          </div>
        )}

        <section className="payment-card" aria-labelledby="event-spending">
          <h2 id="event-spending">How the money was used</h2>
          {event.expenses.length === 0 ? (
            <p className="event-empty-line">Nothing spent yet. Bills will appear here when money is spent.</p>
          ) : (
            <div className="table-scroll-wrap">
              <table className="payment-history-table">
                <thead><tr><th>Paid on</th><th>Amount</th><th>For</th>{isAdmin && <th>Recorded by</th>}</tr></thead>
                <tbody>
                  {event.expenses.map((x) => (
                    <tr key={x.id}>
                      <td>{formatLocalDate(x.paidOn)}</td>
                      <td className="amount-cell">
                        {formatINR(x.amount)}
                        {x.coveredFromGeneral > 0 && <small className="event-covered">{formatINR(x.coveredFromGeneral)} from the General Fund</small>}
                      </td>
                      <td className="scholarship-purpose-cell">
                        <div className="scholarship-purpose-text">{x.purpose}</div>
                        {(x.itemName || x.quantity != null) && (
                          <div className="expense-item-line">
                            {x.itemName && <span className="expense-item-tag">{x.itemName}</span>}
                            {qtyTimesPrice(x.quantity, x.unit, x.unitPrice)}
                          </div>
                        )}
                        {isAdmin && event.status !== 'CANCELLED' && (
                          <button type="button" className="btn btn-secondary btn-sm event-add-bills" onClick={() => setDialog({ kind: 'expenseDetails', expenseId: x.id })}>Edit</button>
                        )}
                        <ReceiptList
                          receipts={x.receipts}
                          emptyText="No bill attached yet"
                          removingId={removingId}
                          onRemove={isAdmin && !finished ? async (receipt) => {
                            if (!window.confirm('Remove this bill? It will no longer be shown to members.')) return;
                            setRemovingId(receipt.id);
                            try { await removeEventExpenseReceipt(event.id, x.id, receipt.id); load(); } finally { setRemovingId(null); }
                          } : undefined}
                        />
                        {isAdmin && !finished && x.receipts.length < 5 && (
                          <button type="button" className="btn btn-secondary btn-sm event-add-bills" onClick={() => setDialog({ kind: 'bills', expenseId: x.id })}>+ Add bills</button>
                        )}
                      </td>
                      {isAdmin && <td>{x.paidBy || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="payment-card" aria-labelledby="event-donations">
          <h2 id="event-donations">Donations ({event.donationCount})</h2>
          {event.donations.length === 0 ? (
            <p className="event-empty-line">No donations yet.</p>
          ) : (
            <div className="table-scroll-wrap">
              <table className="payment-history-table">
                <thead><tr><th>Donor</th><th>Date</th><th>Amount</th>{isAdmin && <th><span className="visually-hidden">Actions</span></th>}</tr></thead>
                <tbody>
                  {event.donations.map((d, i) => {
                    const refunded = d.refundedAmount ?? 0;
                    return (
                      <tr key={d.orderId ?? i}>
                        <td>
                          <span className="contributor-name">{donorName(d)}</span><br />
                          <small className="contributor-email">{d.fullEmail ?? d.maskedEmail ?? ''}</small>
                        </td>
                        <td>{formatDateTime(d.paymentDate)}</td>
                        <td className="amount-cell">
                          {formatINR(d.amount)}
                          {refunded > 0 && <small className="event-refunded">{refunded >= d.amount ? 'Refunded' : `${formatINR(refunded)} refunded`}</small>}
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="table-actions">
                              {d.orderId && d.editable && (
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'editDonation', orderId: d.orderId! })}>Edit</button>
                              )}
                              {d.orderId && refunded < d.amount && (
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'refund', donation: d })}>Refund</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="dt-note">Donor names and emails are shown only for members who chose to show their details publicly.</p>
        </section>

        {event.transfers.length > 0 && (
          <section className="payment-card" aria-labelledby="event-moves">
            <h2 id="event-moves">Money moved in and out</h2>
            <ul className="event-move-list">
              {event.transfers.map((t) => {
                const line = moveLine(t, event.id);
                return (
                  <li key={t.id}>
                    <span className={`event-move-amount ${line.sign === '+' ? 'in' : 'out'}`}>{line.sign}{formatINR(t.amount)}</span>
                    <span className="event-move-text">
                      {line.other} · {KIND_LABEL[t.kind] ?? t.kind}
                      {t.reason && <> · “{t.reason}”</>}
                      <small> {formatDateTime(t.createdAt)}{t.createdBy ? ` · by ${t.createdBy}` : ''}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {event.changes.length > 0 && (
          <section className="payment-card" aria-labelledby="event-changes">
            <h2 id="event-changes">Changes to dates or budget</h2>
            <ul className="event-move-list">
              {event.changes.map((c, i) => (
                <li key={i}>
                  <span className="event-move-text">
                    {changeText(c)}
                    {c.reason && <> · “{c.reason}”</>}
                    <small> {formatDateTime(c.changedAt)}{c.changedBy ? ` · by ${c.changedBy}` : ''}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {dialog?.kind === 'edit' && <EventFormModal event={event} onClose={() => setDialog(null)} onSaved={() => done('Event saved.')} />}
        {dialog?.kind === 'expense' && <ExpenseModal event={event} generalAvailable={general} onClose={() => setDialog(null)} onSaved={() => done('Spending recorded.')} />}
        {dialog?.kind === 'move' && (
          <TransferModal events={allEvents.length ? allEvents : [event]} generalAvailable={general}
            fromEventId={event.balance > 0 && !finished ? event.id : null} toEventId={event.balance > 0 ? null : event.id}
            onClose={() => setDialog(null)} onSaved={() => done('Money moved.')} />
        )}
        {dialog?.kind === 'close' && <CloseEventModal event={event} targets={allEvents} onClose={() => setDialog(null)} onSaved={() => done('Event closed.')} />}
        {dialog?.kind === 'cancel' && <CancelEventModal event={event} onClose={() => setDialog(null)} onSaved={() => done('Event cancelled.')} />}
        {dialog?.kind === 'refund' && (
          <RefundModal
            orderId={dialog.donation.orderId!}
            donor={dialog.donation.fullName ?? dialog.donation.maskedName ?? 'The donor'}
            purpose={event.title}
            amount={dialog.donation.amount}
            alreadyRefunded={dialog.donation.refundedAmount ?? 0}
            isEventDonation={!finished}
            onClose={() => setDialog(null)}
            onSaved={() => done('Refund recorded. The donor has been emailed.')}
          />
        )}
        {dialog?.kind === 'editDonation' && (
          <EditPaymentModal orderId={dialog.orderId} onClose={() => setDialog(null)} onSaved={() => done('Donation corrected. The totals are updated.')} />
        )}
        {dialog?.kind === 'report' && (
          <ReportModal event={event} onClose={() => { setDialog(null); load(); }}
            onSaved={(updated) => { setEvent(updated); setDialog(null); setNotice('Report saved. Members can see it at the top of this page.'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}
        {dialog?.kind === 'expenseDetails' && event.expenses.find((x) => x.id === dialog.expenseId) && (
          <ExpenseModal event={event} generalAvailable={general} expense={event.expenses.find((x) => x.id === dialog.expenseId)!}
            onClose={() => setDialog(null)} onSaved={() => done('Spending updated.')} />
        )}
        {dialog?.kind === 'reopen' && (
          <ReopenEventModal event={event} onClose={() => setDialog(null)} onSaved={() => done('The event is open again.')} />
        )}
        {dialog?.kind === 'bills' && (
          <AddBillsModal eventId={event.id} expenseId={dialog.expenseId}
            existing={event.expenses.find((x) => x.id === dialog.expenseId)?.receipts.length ?? 0}
            onClose={() => setDialog(null)} onSaved={() => done('Bills added.')} />
        )}
        {dialog?.kind === 'publish' && (
          <ModalShell title="Open for donations" busy={busy} error={dialogError} onClose={() => setDialog(null)}
            onSubmit={(e) => { e.preventDefault(); runSimple(() => publishEvent(event.id, notify), 'The event is open for donations.'); }}
            footer={<>
              <button type="button" className="btn btn-secondary" onClick={() => setDialog(null)} disabled={busy}>Not yet</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Opening…' : 'Open now'}</button>
            </>}>
            <p className="event-modal-sub">All members will see this event and can donate until {formatLocalDate(event.endDate)}.</p>
            <label className="event-check">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              <span>Email all members about it</span>
            </label>
          </ModalShell>
        )}
        {dialog?.kind === 'delete' && (
          <ModalShell title="Delete draft" busy={busy} error={dialogError} onClose={() => setDialog(null)}
            onSubmit={(e) => { e.preventDefault(); runSimple(async () => { await deleteDraftEvent(event.id); navigate('/events'); }, 'Draft deleted.'); }}
            footer={<>
              <button type="button" className="btn btn-secondary" onClick={() => setDialog(null)} disabled={busy}>Keep it</button>
              <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? 'Deleting…' : 'Delete draft'}</button>
            </>}>
            <p className="event-modal-sub">This draft has no money and was never opened, so it can be deleted completely.</p>
          </ModalShell>
        )}
      </main>
    </div>
  );
};

export default EventDetail;
