import React, { useMemo, useState } from 'react';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import {
  addEventExpense,
  cancelEvent,
  closeEvent,
  createEvent,
  recordRefund,
  transferMoney,
  updateEvent
} from '../../app/modules/events/core/_requests';
import { formatINR, todayLocalISO } from '../ScholarshipPaymentModal';
import { ReceiptFilePicker, validateReceiptFiles } from '../ScholarshipReceipts';
import { addEventImages } from '../../app/modules/events/core/_requests';
import { IMAGE_ACCEPT, MAX_EVENT_IMAGES, prepareEventImages } from './EventImages';
import { PlanEditor, planItemsFrom, planRowsFrom, planTotal, parseOptional, qtyTimesPrice, type PlanRow } from './EventPlan';

const GENERAL = '';

/** Parses a rupee amount with at most 2 decimals; NaN if invalid */
function parseAmount(input: string): number {
  const t = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  return Number(t);
}

const errorOf = (err: any, fallback: string) => err?.response?.data?.message || err?.response?.data?.fieldErrors?.[0]?.message || fallback;

export const ModalShell: React.FC<{
  title: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, busy, onClose, onSubmit, error, footer, children }) => (
  <div className="modal-overlay" onClick={() => !busy && onClose()}>
    <div className="modal-content event-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{title}</h2>
        <button type="button" className="modal-close" onClick={onClose} disabled={busy} aria-label="Close">×</button>
      </div>
      <form onSubmit={onSubmit} noValidate>
        <div className="modal-body">
          {children}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
        </div>
        <div className="modal-footer">{footer}</div>
      </form>
    </div>
  </div>
);

// ------------------------------------------------------------------ create / edit

export const EventFormModal: React.FC<{
  event?: FundEventDTO;
  onSaved: (event: FundEventDTO) => void;
  onClose: () => void;
}> = ({ event, onSaved, onClose }) => {
  const editing = !!event;
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [budget, setBudget] = useState(event ? String(event.budget) : '');
  const [startDate, setStartDate] = useState(event?.startDate ?? todayLocalISO());
  const [endDate, setEndDate] = useState(event?.endDate ?? '');
  const [notify, setNotify] = useState(true);
  const [changeReason, setChangeReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  /** Which button is working, for its "…" label */
  const [publishing, setPublishing] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  /** Set when the event was saved but its images could not be uploaded */
  const [savedWithoutImages, setSavedWithoutImages] = useState<FundEventDTO | null>(null);
  const [planRows, setPlanRows] = useState<PlanRow[]>(() => planRowsFrom(event?.items));
  /** The budget follows the plan total until the admin types a budget of their own */
  const [budgetManual, setBudgetManual] = useState(() =>
    !!event && Number(event.budget) !== planTotal(planRowsFrom(event.items)));
  const lockedIds = useMemo(() => new Set((event?.items ?? []).filter((i) => i.paymentCount > 0).map((i) => i.id)), [event]);

  const changePlan = (rows: PlanRow[]) => {
    setPlanRows(rows);
    const total = planTotal(rows);
    if (!budgetManual && total > 0) setBudget(String(total));
  };

  const isOpenEdit = editing && event!.status !== 'DRAFT';
  const keyChanged = isOpenEdit && (endDate !== event!.endDate || startDate !== event!.startDate || Number(budget) !== Number(event!.budget));

  /** The choice is passed in by the button itself: state set in the same click would not be seen yet */
  const submit = async (e: React.FormEvent | React.MouseEvent, publish: boolean) => {
    e.preventDefault();
    setPublishing(publish);
    const amount = parseAmount(budget);
    if (!title.trim()) return setError('Please enter a title.');
    if (Number.isNaN(amount) || amount < 1) return setError('Please enter the budget in rupees.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return setError('Please choose the start and end dates.');
    if (endDate < startDate) return setError('The end date must be on or after the start date.');
    if (publish && endDate < todayLocalISO()) return setError('The end date has already passed.');
    const items = planItemsFrom(planRows);
    if (typeof items === 'string') return setError(items);
    setError('');
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        budget: amount,
        startDate,
        endDate,
        publish,
        notifyMembers: publish && notify,
        changeReason: changeReason.trim() || undefined,
        items
      };
      if (editing) {
        onSaved(await updateEvent(event!.id, body));
        return;
      }
      const saved = await createEvent(body);
      if (imageFiles.length) {
        try {
          await addEventImages(saved.id, await prepareEventImages(imageFiles, 0));
        } catch (imgErr: any) {
          setSavedWithoutImages(saved);
          setError(`The event was saved, but the images were not: ${String(imgErr?.response?.data?.message || imgErr?.message || 'upload failed').replace(/\.+\s*$/, '')}. You can add them on the event page.`);
          return;
        }
      }
      onSaved(saved);
    } catch (err) {
      setError(errorOf(err, 'Could not save the event.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title={editing ? 'Edit event' : 'New event'}
      busy={busy}
      onClose={onClose}
      onSubmit={(e) => submit(e, false)}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          {savedWithoutImages ? (
            <button type="button" className="btn btn-primary" onClick={() => onSaved(savedWithoutImages)}>Go to the event</button>
          ) : editing ? (
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          ) : (
            <>
              <button type="submit" className="btn btn-secondary" disabled={busy}>
                {busy && !publishing ? 'Saving…' : 'Save as draft'}
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={(e) => submit(e, true)}>
                {busy && publishing ? 'Opening…' : 'Open for donations'}
              </button>
            </>
          )}
        </>
      }
    >
      <div className="form-group">
        <label className="form-label required" htmlFor="event-title">Title</label>
        <input id="event-title" className="form-input" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Children's Day Special" />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="event-description">What is it for?</label>
        <textarea id="event-description" className="form-input" rows={4} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What the money will be used for, who it helps, and anything members should know." />
      </div>
      <div className="form-group">
        <span className="form-label">Budget plan <span className="form-label-optional">(optional)</span></span>
        <div className="form-help" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
          List what you plan to buy, for example Pens: 1450 pcs × ₹5. Later, spending is recorded against these lines with the real price,
          and the event page shows planned vs actual.
        </div>
        <PlanEditor rows={planRows} onChange={changePlan} lockedIds={lockedIds} />
      </div>
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label required" htmlFor="event-budget">Budget (₹)</label>
          <input id="event-budget" className="form-input" inputMode="decimal" value={budget} onChange={(e) => { setBudget(e.target.value); setBudgetManual(true); }} placeholder="8000" />
          {planTotal(planRows) > 0 && Number(budget) !== planTotal(planRows) && (
            <button type="button" className="plan-use-total" onClick={() => { setBudget(String(planTotal(planRows))); setBudgetManual(false); }}>
              Use plan total {formatINR(planTotal(planRows))}
            </button>
          )}
        </div>
        <div className="form-group">
          <label className="form-label required" htmlFor="event-start">Start date</label>
          <input id="event-start" type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label required" htmlFor="event-end">Last day for donations</label>
          <input id="event-end" type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="form-help">
        Donations stay open until the end date even after the budget is reached. Any amount left at the end goes to the scholarship fund or towards a future event; members are told this on the event page.
      </div>
      {isOpenEdit && keyChanged && (
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label" htmlFor="event-change-reason">Why are the dates or budget changing?</label>
          <input id="event-change-reason" className="form-input" maxLength={500} value={changeReason} onChange={(e) => setChangeReason(e.target.value)}
            placeholder="For example: more children joined" />
          <div className="form-help">Members see every change to the dates or budget, with this reason.</div>
        </div>
      )}
      {!editing && (
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label" htmlFor="event-images">Banner / poster images</label>
          <input id="event-images" type="file" className="form-input" accept={IMAGE_ACCEPT} multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files ?? []).slice(0, MAX_EVENT_IMAGES))} />
          <div className="form-help">
            {imageFiles.length ? `${imageFiles.length} chosen. ` : ''}Up to {MAX_EVENT_IMAGES} JPG, PNG or WebP images; the first is the cover. They are shown on the event and sent when sharing on WhatsApp. You can change them later.
          </div>
        </div>
      )}
      {!editing && (
        <label className="event-check">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          <span>When opening, email all members about this event</span>
        </label>
      )}
    </ModalShell>
  );
};

// ------------------------------------------------------------------ spending

export const ExpenseModal: React.FC<{
  event: FundEventDTO;
  generalAvailable: number | null;
  onSaved: () => void;
  onClose: () => void;
}> = ({ event, generalAvailable, onSaved, onClose }) => {
  const items = event.items ?? [];
  const [itemId, setItemId] = useState(items.length ? String(items[0].id) : '');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  /** The amount follows quantity × price until the admin types an amount */
  const [amountManual, setAmountManual] = useState(false);
  const [paidOn, setPaidOn] = useState(todayLocalISO());
  const [purpose, setPurpose] = useState('');
  const [receipts, setReceipts] = useState<File[]>([]);
  const [cover, setCover] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const item = items.find((i) => String(i.id) === itemId);
  const qty = parseOptional(qtyInput);
  const price = parseOptional(priceInput);
  const product = qty != null && price != null && !Number.isNaN(qty) && !Number.isNaN(price) ? Math.round(qty * price * 100) / 100 : null;

  const changeNumbers = (q: string, p: string) => {
    setQtyInput(q);
    setPriceInput(p);
    setError('');
    if (!amountManual) {
      const a = parseOptional(q);
      const b = parseOptional(p);
      setAmountInput(a != null && b != null && !Number.isNaN(a) && !Number.isNaN(b) ? String(Math.round(a * b * 100) / 100) : '');
    }
  };

  const amount = parseAmount(amountInput);
  const available = Math.max(0, event.balance);
  const shortfall = !Number.isNaN(amount) ? Math.max(0, amount - available) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(qty) || Number.isNaN(price)) return setError('Please check the quantity and price.');
    if (Number.isNaN(amount) || amount <= 0) return setError('Please enter the amount spent.');
    const what = purpose.trim() || (item ? `${item.name}${qty != null ? `: ${qtyTimesPrice(qty, item.unit, price)}` : ''}` : '');
    if (!what) return setError('Please enter what the money was spent on.');
    if (paidOn > todayLocalISO()) return setError('The date cannot be in the future.');
    if (shortfall > 0 && !cover) return setError(`Tick the box to take ${formatINR(shortfall)} from the General Fund, or enter a smaller amount.`);
    const fileError = validateReceiptFiles(receipts);
    if (fileError) return setError(fileError);
    setError('');
    setBusy(true);
    try {
      await addEventExpense(event.id, {
        amount, paidOn, purpose: what, coverFromGeneral: shortfall > 0 && cover, receipts,
        itemId: item ? item.id : null, quantity: qty, unitPrice: price
      });
      onSaved();
    } catch (err) {
      setError(errorOf(err, 'Could not record the payment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Record spending"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button>
        </>
      }
    >
      <p className="event-modal-sub">{event.title} has <strong>{formatINR(available)}</strong> in hand.</p>
      {items.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="expense-item">Which item is this for?</label>
          <select id="expense-item" className="form-input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}{i.plannedQuantity != null ? ` (planned ${qtyTimesPrice(i.plannedQuantity, i.unit, i.plannedUnitPrice)})` : ''}
              </option>
            ))}
            <option value="">Something else (delivery, packing …)</option>
          </select>
        </div>
      )}
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="expense-qty">How many{item?.unit ? ` (${item.unit})` : ''}?</label>
          <input id="expense-qty" className="form-input" inputMode="decimal" value={qtyInput} placeholder={item?.plannedQuantity != null ? String(item.plannedQuantity) : ''}
            onChange={(e) => changeNumbers(e.target.value, priceInput)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="expense-price">Actual price of one (₹)</label>
          <input id="expense-price" className="form-input" inputMode="decimal" value={priceInput} placeholder={item?.plannedUnitPrice != null ? String(item.plannedUnitPrice) : ''}
            onChange={(e) => changeNumbers(qtyInput, e.target.value)} />
        </div>
      </div>
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label required" htmlFor="expense-amount">Total paid (₹)</label>
          <input id="expense-amount" className="form-input" inputMode="decimal" value={amountInput} onChange={(e) => { setAmountInput(e.target.value); setAmountManual(true); setError(''); }} />
          {product != null && (
            <div className="form-help">
              {qtyTimesPrice(qty, item?.unit, price)} = {formatINR(product)}
              {amountManual && !Number.isNaN(amount) && amount !== product && <> · differs, fine for a discount or delivery charge · <button type="button" className="plan-use-total" onClick={() => { setAmountInput(String(product)); setAmountManual(false); }}>use {formatINR(product)}</button></>}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label required" htmlFor="expense-date">Paid on</label>
          <input id="expense-date" type="date" className="form-input" value={paidOn} max={todayLocalISO()} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className={`form-label ${item ? '' : 'required'}`} htmlFor="expense-purpose">What was it spent on?</label>
        <input id="expense-purpose" className="form-input" maxLength={500} value={purpose} onChange={(e) => setPurpose(e.target.value)}
          placeholder={item ? `${item.name} from … (shop name, optional)` : 'Bicycle from Sai Cycle Store'} />
      </div>
      {shortfall > 0 && (
        <div className="event-shortfall" role="status">
          <p>
            The event has only {formatINR(available)}, so <strong>{formatINR(shortfall)}</strong> more is needed.
            {generalAvailable != null && <> The General Fund has {formatINR(generalAvailable)}.</>}
          </p>
          <label className="event-check">
            <input type="checkbox" checked={cover} onChange={(e) => { setCover(e.target.checked); setError(''); }} />
            <span>Take {formatINR(shortfall)} from the General Fund (shown to members on the event page)</span>
          </label>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Bills or receipts (recommended)</label>
        <ReceiptFilePicker files={receipts} onChange={setReceipts} disabled={busy} />
        <div className="form-help">All members can see these on the event page.</div>
      </div>
    </ModalShell>
  );
};

// ------------------------------------------------------------------ move money

export const TransferModal: React.FC<{
  events: FundEventDTO[];
  generalAvailable: number | null;
  /** Pre-selected sides; null = General Fund, undefined = let the admin choose */
  fromEventId?: number | null;
  toEventId?: number | null;
  onSaved: () => void;
  onClose: () => void;
}> = ({ events, generalAvailable, fromEventId, toEventId, onSaved, onClose }) => {
  const usable = events.filter((e) => e.status === 'OPEN' || e.status === 'DRAFT');
  const [from, setFrom] = useState(fromEventId != null ? String(fromEventId) : GENERAL);
  const [to, setTo] = useState(toEventId != null ? String(toEventId) : usable.find((e) => String(e.id) !== from)?.id.toString() ?? GENERAL);
  const [amountInput, setAmountInput] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const available = from === GENERAL ? generalAvailable : usable.find((e) => String(e.id) === from)?.balance ?? 0;
  const label = (e: FundEventDTO) => `${e.title}${e.status === 'DRAFT' ? ' (draft)' : ''} – ${formatINR(e.balance)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(amountInput);
    if (from === to) return setError('Please choose two different funds.');
    if (Number.isNaN(amount) || amount <= 0) return setError('Please enter the amount to move.');
    if (available != null && amount > available) return setError(`Only ${formatINR(available)} is available there.`);
    if (!reason.trim()) return setError('Please say why the money is moving; members can see this.');
    setError('');
    setBusy(true);
    try {
      await transferMoney(from === GENERAL ? null : Number(from), to === GENERAL ? null : Number(to), amount, reason.trim());
      onSaved();
    } catch (err) {
      setError(errorOf(err, 'Could not move the money.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Move money between funds"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Moving…' : 'Move money'}</button>
        </>
      }
    >
      <p className="event-modal-sub">The total in the bank does not change; this only changes which purpose the money is kept for.</p>
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="move-from">From</label>
          <select id="move-from" className="form-input custom-select" value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value={GENERAL}>General Fund{generalAvailable != null ? ` – ${formatINR(generalAvailable)}` : ''}</option>
            {usable.filter((e) => e.balance > 0).map((e) => <option key={e.id} value={e.id}>{label(e)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="move-to">To</label>
          <select id="move-to" className="form-input custom-select" value={to} onChange={(e) => setTo(e.target.value)}>
            <option value={GENERAL}>General Fund (scholarships)</option>
            {usable.map((e) => <option key={e.id} value={e.id}>{label(e)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label required" htmlFor="move-amount">Amount (₹)</label>
        <input id="move-amount" className="form-input" inputMode="decimal" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        {available != null && <div className="form-help">Available: {formatINR(available)}</div>}
      </div>
      <div className="form-group">
        <label className="form-label required" htmlFor="move-reason">Reason</label>
        <input id="move-reason" className="form-input" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Advance for next year's Children's Day" />
      </div>
      <div className="form-help">To keep money for next year's event, create that event as a draft first; it then appears in this list.</div>
    </ModalShell>
  );
};

// ------------------------------------------------------------------ close

interface MoveRow {
  to: string;
  amount: string;
}

export const CloseEventModal: React.FC<{
  event: FundEventDTO;
  /** Other events that can receive money (open or draft) */
  targets: FundEventDTO[];
  onSaved: () => void;
  onClose: () => void;
}> = ({ event, targets, onSaved, onClose }) => {
  const left = Math.max(0, event.balance);
  const [rows, setRows] = useState<MoveRow[]>(left > 0 ? [{ to: GENERAL, amount: String(left) }] : []);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const usable = targets.filter((t) => t.id !== event.id && (t.status === 'OPEN' || t.status === 'DRAFT'));

  const total = useMemo(() => rows.reduce((s, r) => s + (Number.isNaN(parseAmount(r.amount)) ? 0 : parseAmount(r.amount)), 0), [rows]);
  const remaining = Math.round((left - total) * 100) / 100;
  const update = (i: number, patch: Partial<MoveRow>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => Number.isNaN(parseAmount(r.amount)) || parseAmount(r.amount) <= 0)) return setError('Every amount must be more than ₹0.');
    if (remaining !== 0) return setError(`The amounts must add up to ${formatINR(left)}. ${remaining > 0 ? formatINR(remaining) + ' is not given a place yet.' : 'They add up to more than is left.'}`);
    setError('');
    setBusy(true);
    try {
      await closeEvent(event.id, rows.map((r) => ({ toEventId: r.to === GENERAL ? null : Number(r.to), amount: parseAmount(r.amount) })), note.trim());
      onSaved();
    } catch (err) {
      setError(errorOf(err, 'Could not close the event.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Close event"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Closing…' : 'Close event'}</button>
        </>
      }
    >
      <div className="event-close-summary">
        <div><span>Donations kept</span><strong>{formatINR(event.netCollected)}</strong></div>
        <div><span>Moved in from other funds</span><strong>{formatINR(event.transferredIn)}</strong></div>
        <div><span>Spent</span><strong>{formatINR(event.spent)}</strong></div>
        <div><span>Left now</span><strong>{formatINR(left)}</strong></div>
      </div>
      {left === 0 ? (
        <p className="event-modal-sub">Nothing is left, so closing only marks the event as finished. No more donations or spending can be added.</p>
      ) : (
        <>
          <p className="event-modal-sub">Choose where the {formatINR(left)} left over goes. You can split it.</p>
          {rows.map((r, i) => (
            <div className="event-move-row" key={i}>
              <select className="form-input custom-select" aria-label={`Destination ${i + 1}`} value={r.to} onChange={(e) => update(i, { to: e.target.value })}>
                <option value={GENERAL}>General Fund (scholarships)</option>
                {usable.map((t) => <option key={t.id} value={t.id}>{t.title}{t.status === 'DRAFT' ? ' (upcoming draft)' : ''}</option>)}
              </select>
              <input className="form-input" inputMode="decimal" aria-label={`Amount ${i + 1}`} value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} />
              {rows.length > 1 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} aria-label={`Remove destination ${i + 1}`}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows([...rows, { to: usable[0] ? String(usable[0].id) : GENERAL, amount: remaining > 0 ? String(remaining) : '' }])}>
            + Split to another place
          </button>
          <p className={`event-move-total ${remaining === 0 ? 'ok' : ''}`}>
            {remaining === 0 ? `✓ All ${formatINR(left)} has a place` : remaining > 0 ? `${formatINR(remaining)} still needs a place` : `${formatINR(-remaining)} too much`}
          </p>
          <div className="form-help">To keep money for next year's event, create that event as a draft first; it then appears in the list above.</div>
        </>
      )}
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label className="form-label" htmlFor="close-note">Note for members (optional)</label>
        <input id="close-note" className="form-input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="All sweets and books were given on 14 November" />
      </div>
    </ModalShell>
  );
};

// ------------------------------------------------------------------ cancel

export const CancelEventModal: React.FC<{
  event: FundEventDTO;
  onSaved: () => void;
  onClose: () => void;
}> = ({ event, onSaved, onClose }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return setError('Please say why the event is cancelled; members can see this.');
    setBusy(true);
    try {
      await cancelEvent(event.id, note.trim());
      onSaved();
    } catch (err) {
      setError(errorOf(err, 'Could not cancel the event.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Cancel event"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Keep the event</button>
          <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? 'Cancelling…' : 'Cancel event'}</button>
        </>
      }
    >
      <p className="event-modal-sub">
        <strong>Record refunds first.</strong> If some donors should get their money back, close this and use <em>Refund</em> next to their donation.
      </p>
      <p className="event-modal-sub">
        After cancelling, the {formatINR(Math.max(0, event.balance))} left moves to the General Fund. Donations and spending can no longer be added.
        You can still refund a donation later; it will then come from the General Fund.
      </p>
      <div className="form-group">
        <label className="form-label required" htmlFor="cancel-note">Reason (shown to members)</label>
        <input id="cancel-note" className="form-input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The trip was called off because of the rain" />
      </div>
    </ModalShell>
  );
};

// ------------------------------------------------------------------ refund

export const RefundModal: React.FC<{
  orderId: string;
  donor: string;
  purpose: string;
  amount: number;
  alreadyRefunded: number;
  /** Event donations may need the General Fund to cover money the event already spent */
  isEventDonation: boolean;
  onSaved: () => void;
  onClose: () => void;
}> = ({ orderId, donor, purpose, amount, alreadyRefunded, isEventDonation, onSaved, onClose }) => {
  const refundable = Math.max(0, amount - alreadyRefunded);
  const [amountInput, setAmountInput] = useState(String(refundable));
  const [refundedOn, setRefundedOn] = useState(todayLocalISO());
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [cover, setCover] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmount(amountInput);
    if (Number.isNaN(value) || value <= 0) return setError('Please enter the amount given back.');
    if (value > refundable) return setError(`Only ${formatINR(refundable)} of this donation can still be refunded.`);
    if (!reason.trim()) return setError('Please enter the reason for the refund.');
    if (refundedOn > todayLocalISO()) return setError('The date cannot be in the future.');
    setError('');
    setBusy(true);
    try {
      await recordRefund(orderId, { amount: value, refundedOn, reference: reference.trim(), reason: reason.trim(), coverFromGeneral: cover });
      onSaved();
    } catch (err) {
      setError(errorOf(err, 'Could not record the refund.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      title="Record a refund"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
      error={error}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Record refund'}</button>
        </>
      }
    >
      <p className="event-modal-sub">
        {donor} gave <strong>{formatINR(amount)}</strong> for {purpose}
        {alreadyRefunded > 0 && <> ({formatINR(alreadyRefunded)} already refunded)</>}.
        First send the money back by UPI or bank transfer (or from the Razorpay dashboard for online payments), then record it here. The donor gets an email.
      </p>
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label required" htmlFor="refund-amount">Amount given back (₹)</label>
          <input id="refund-amount" className="form-input" inputMode="decimal" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label required" htmlFor="refund-date">Refunded on</label>
          <input id="refund-date" type="date" className="form-input" value={refundedOn} max={todayLocalISO()} onChange={(e) => setRefundedOn(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="refund-reference">UPI / bank / Razorpay reference</label>
        <input id="refund-reference" className="form-input" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label required" htmlFor="refund-reason">Reason</label>
        <input id="refund-reason" className="form-input" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Paid twice by mistake" />
      </div>
      {isEventDonation && (
        <label className="event-check">
          <input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} />
          <span>If the event has already spent this money, take the missing part from the General Fund</span>
        </label>
      )}
    </ModalShell>
  );
};
