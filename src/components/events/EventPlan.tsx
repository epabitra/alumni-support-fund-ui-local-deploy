import React, { useState } from 'react';
import type { FundEventDTO, FundEventExpenseDTO, FundEventItemDTO, PlanItemInput } from '../../app/modules/events/core/_models';
import { saveEventReport, updateEventExpenseDetails } from '../../app/modules/events/core/_requests';
import { formatINR, todayLocalISO } from '../ScholarshipPaymentModal';
import { EventGallery, EventImageManager } from './EventImages';
import { EventText } from './EventBits';
import { ModalShell } from './EventModals';

// ------------------------------------------------------------------ numbers

const qtyFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** "1,200 pcs" */
export function formatQty(n: number | null | undefined, unit?: string | null): string {
  if (n == null) return '—';
  return `${qtyFormat.format(n)}${unit ? ` ${unit}` : ''}`;
}

/** ₹4 or ₹4.50 (no .00 for whole rupees, which reads better in "1,200 × ₹4") */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}

/** "1,200 pcs × ₹4" */
export function qtyTimesPrice(qty: number | null | undefined, unit: string | null | undefined, price: number | null | undefined): string {
  if (qty == null) return price != null ? `${formatPrice(price)} each` : '';
  return price != null ? `${formatQty(qty, unit)} × ${formatPrice(price)}` : formatQty(qty, unit);
}

/** Optional number field: '' → null, invalid → NaN */
export function parseOptional(input: string): number | null {
  const t = input.trim().replace(/,/g, '');
  if (t === '') return null;
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ------------------------------------------------------------------ plan editor (inside the event form)

export interface PlanRow {
  key: string;
  id?: number;
  name: string;
  unit: string;
  qty: string;
  price: string;
}

let rowSeq = 0;
export const newPlanRow = (): PlanRow => ({ key: `new-${++rowSeq}`, name: '', unit: 'pcs', qty: '', price: '' });

export function planRowsFrom(items?: FundEventItemDTO[]): PlanRow[] {
  return (items ?? []).map((i) => ({
    key: `item-${i.id}`,
    id: i.id,
    name: i.name,
    unit: i.unit ?? '',
    qty: i.plannedQuantity != null ? String(i.plannedQuantity) : '',
    price: i.plannedUnitPrice != null ? String(i.plannedUnitPrice) : ''
  }));
}

export function planTotal(rows: PlanRow[]): number {
  return round2(rows.reduce((sum, r) => {
    const q = parseOptional(r.qty);
    const p = parseOptional(r.price);
    return q != null && p != null && !Number.isNaN(q) && !Number.isNaN(p) ? sum + q * p : sum;
  }, 0));
}

/** Rows → request lines; returns an error message instead when something is wrong. Empty rows are skipped. */
export function planItemsFrom(rows: PlanRow[]): PlanItemInput[] | string {
  const out: PlanItemInput[] = [];
  for (const r of rows) {
    const blank = !r.name.trim() && !r.qty.trim() && !r.price.trim();
    if (blank) continue;
    if (!r.name.trim()) return 'Each plan line needs a name, for example Pens.';
    const q = parseOptional(r.qty);
    const p = parseOptional(r.price);
    if (Number.isNaN(q) || Number.isNaN(p)) return `Please check the numbers for ${r.name.trim()}.`;
    out.push({ id: r.id, name: r.name.trim(), unit: r.unit.trim() || undefined, plannedQuantity: q, plannedUnitPrice: p });
  }
  return out;
}

export const PlanEditor: React.FC<{
  rows: PlanRow[];
  onChange: (rows: PlanRow[]) => void;
  /** Lines with spending linked cannot be removed */
  lockedIds?: Set<number>;
}> = ({ rows, onChange, lockedIds }) => {
  const set = (key: string, patch: Partial<PlanRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const total = planTotal(rows);
  return (
    <div className="plan-editor">
      {rows.length > 0 && (
        <div className="plan-editor-head" aria-hidden>
          <span>Item</span><span>Quantity</span><span>Unit</span><span>Price of one (₹)</span><span>Line total</span><span />
        </div>
      )}
      {rows.map((r, i) => {
        const q = parseOptional(r.qty);
        const p = parseOptional(r.price);
        const line = q != null && p != null && !Number.isNaN(q) && !Number.isNaN(p) ? formatINR(q * p) : '—';
        const locked = r.id != null && lockedIds?.has(r.id);
        return (
          <div className="plan-editor-row" key={r.key}>
            <input className="form-input" aria-label={`Item ${i + 1} name`} placeholder="Pens" maxLength={150} value={r.name} onChange={(e) => set(r.key, { name: e.target.value })} />
            <input className="form-input" aria-label={`Item ${i + 1} quantity`} placeholder="1450" inputMode="decimal" value={r.qty} onChange={(e) => set(r.key, { qty: e.target.value })} />
            <input className="form-input" aria-label={`Item ${i + 1} unit`} placeholder="pcs" maxLength={30} value={r.unit} onChange={(e) => set(r.key, { unit: e.target.value })} />
            <input className="form-input" aria-label={`Item ${i + 1} price of one`} placeholder="5" inputMode="decimal" value={r.price} onChange={(e) => set(r.key, { price: e.target.value })} />
            <span className="plan-editor-line">{line}</span>
            <button type="button" className="plan-editor-remove" disabled={locked}
              title={locked ? 'Spending is recorded for this item, so it stays in the plan' : 'Remove this line'}
              aria-label={`Remove item ${i + 1}`} onClick={() => onChange(rows.filter((x) => x.key !== r.key))}>×</button>
          </div>
        );
      })}
      <div className="plan-editor-foot">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...rows, newPlanRow()])}>+ Add item</button>
        {total > 0 && <span>Plan total: <strong>{formatINR(total)}</strong></span>}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ plan vs actual (event page)

export const PlanVsActual: React.FC<{ event: FundEventDTO }> = ({ event }) => {
  const items = event.items ?? [];
  if (!items.length) return null;
  const linkedSpent = items.reduce((s, i) => s + (i.spentAmount ?? 0), 0);
  const otherSpent = round2(event.spent - linkedSpent);
  const plannedTotal = items.reduce((s, i) => s + (i.plannedTotal ?? 0), 0);
  const anyGiven = items.some((i) => i.givenQuantity != null);
  const anyBought = items.some((i) => i.paymentCount > 0);
  const diff = round2(plannedTotal - event.spent);

  return (
    <section className="payment-card" aria-labelledby="event-plan-title">
      <h2 id="event-plan-title">{anyBought ? 'Plan and what actually happened' : 'Budget plan'}</h2>
      {!anyBought && <p className="event-empty-line">Estimated before buying. Actual prices and quantities will be shown here as money is spent.</p>}
      <div className="table-scroll-wrap">
        <table className="payment-history-table plan-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Planned</th>
              <th>Bought</th>
              <th>Paid</th>
              {anyGiven && <th>Given out</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const avg = i.boughtQuantity && i.boughtQuantity > 0 ? i.spentAmount / i.boughtQuantity : null;
              return (
                <tr key={i.id}>
                  <td><strong>{i.name}</strong></td>
                  <td>
                    {i.plannedQuantity != null || i.plannedUnitPrice != null ? (
                      <>
                        <span>{qtyTimesPrice(i.plannedQuantity, i.unit, i.plannedUnitPrice)}</span>
                        {i.plannedTotal != null && <small className="plan-sub">= {formatINR(i.plannedTotal)}</small>}
                      </>
                    ) : '—'}
                  </td>
                  <td>
                    {i.paymentCount === 0 ? <span className="plan-muted">Not bought yet</span> : (
                      <>
                        <span>{formatQty(i.boughtQuantity, i.unit)}</span>
                        {avg != null && <small className="plan-sub">{formatPrice(round2(avg))} each</small>}
                      </>
                    )}
                  </td>
                  <td className="amount-cell">{i.paymentCount === 0 ? '—' : formatINR(i.spentAmount)}</td>
                  {anyGiven && <td><strong>{formatQty(i.givenQuantity, i.unit)}</strong></td>}
                </tr>
              );
            })}
            {otherSpent > 0 && (
              <tr>
                <td><strong>Other spending</strong></td>
                <td>—</td>
                <td>—</td>
                <td className="amount-cell">{formatINR(otherSpent)}</td>
                {anyGiven && <td>—</td>}
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th>{plannedTotal > 0 ? formatINR(plannedTotal) : '—'}</th>
              <th />
              <th className="amount-cell">{formatINR(event.spent)}</th>
              {anyGiven && <th />}
            </tr>
          </tfoot>
        </table>
      </div>
      {anyBought && plannedTotal > 0 && diff !== 0 && (
        <p className={`plan-diff ${diff > 0 ? 'saved' : 'over'}`}>
          {diff > 0
            ? <>Spent <strong>{formatINR(diff)}</strong> less than planned so far.</>
            : <>Spent <strong>{formatINR(-diff)}</strong> more than planned.</>}
        </p>
      )}
    </section>
  );
};

// ------------------------------------------------------------------ report (event page)

/** "Pens: 1,200 pcs" lines from the report */
export function givenOutLines(event: FundEventDTO): string[] {
  return (event.items ?? []).filter((i) => i.givenQuantity != null && i.givenQuantity > 0)
    .map((i) => `${i.name}: ${formatQty(i.givenQuantity, i.unit)}`);
}

export const EventReportCard: React.FC<{ event: FundEventDTO; isAdmin: boolean; onEdit: () => void }> = ({ event, isAdmin, onEdit }) => {
  const lines = givenOutLines(event);
  const photos = event.photos ?? [];
  if (!event.hasReport && !photos.length) return null;
  return (
    <section className="payment-card event-report" aria-labelledby="event-report-title">
      <div className="event-report-head">
        <h2 id="event-report-title">✅ What we did</h2>
        {isAdmin && <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit}>Edit report</button>}
      </div>
      {lines.length > 0 && (
        <ul className="event-report-chips">
          {lines.map((l) => <li key={l}>{l} given out</li>)}
        </ul>
      )}
      {event.reportSummary && <p className="event-hero-desc"><EventText text={event.reportSummary} /></p>}
      <p className="event-report-money">
        Raised <strong>{formatINR(event.raised)}</strong> · Spent <strong>{formatINR(event.spent)}</strong>
        {event.status === 'CLOSED' && event.transferredOut > 0 && <> · Left over <strong>{formatINR(event.transferredOut)}</strong> moved on (see below)</>}
        {event.status === 'OPEN' && <> · In hand <strong>{formatINR(event.balance)}</strong></>}
      </p>
      {photos.length > 0 && <EventGallery images={photos} title={`${event.title} – photos`} />}
      {event.reportUpdatedAt && (
        <p className="dt-note">
          Report updated {new Date(event.reportUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </section>
  );
};

/** Admin hint on an open event without a report, once the money is coming in or being spent */
export const ReportPrompt: React.FC<{ event: FundEventDTO; onWrite: () => void }> = ({ event, onWrite }) => {
  const due = event.status === 'CLOSED' || (event.status === 'OPEN' && (event.spent > 0 || event.collectionEnded));
  if (event.hasReport || !due) return null;
  return (
    <div className="event-report-prompt" role="note">
      <div>
        <strong>After the event, write a short report.</strong>
        <span> Say how many {event.items?.length ? event.items.map((i) => i.name.toLowerCase()).join(' and ') : 'items'} were given out, where, and add a few photos. Members see it at the top of this page.</span>
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={onWrite}>Write report</button>
    </div>
  );
};

export const ReportModal: React.FC<{
  event: FundEventDTO;
  onSaved: (event: FundEventDTO) => void;
  onClose: () => void;
}> = ({ event, onSaved, onClose }) => {
  const items = event.items ?? [];
  const [summary, setSummary] = useState(event.reportSummary ?? '');
  const [given, setGiven] = useState<Record<number, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.givenQuantity != null ? String(i.givenQuantity) : ''])));
  const [photos, setPhotos] = useState(event.photos ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines: { itemId: number; givenQuantity: number | null }[] = [];
    for (const i of items) {
      const n = parseOptional(given[i.id] ?? '');
      if (Number.isNaN(n)) return setError(`Please check the number given out for ${i.name}.`);
      lines.push({ itemId: i.id, givenQuantity: n });
    }
    setBusy(true);
    setError('');
    try {
      onSaved(await saveEventReport(event.id, { summary: summary.trim(), items: lines }));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Event report" busy={busy} onClose={onClose} onSubmit={submit} error={error}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save report'}</button>
      </>}>
      <p className="event-modal-sub">Members see this at the top of the event page. You can update it any time, also after closing the event.</p>
      {items.length > 0 && (
        <div className="report-given">
          <div className="report-given-head" aria-hidden><span>Item</span><span>Planned</span><span>Bought</span><span>Given out</span></div>
          {items.map((i) => (
            <div className="report-given-row" key={i.id}>
              <strong>{i.name}</strong>
              <span>{formatQty(i.plannedQuantity, i.unit)}</span>
              <span>{i.paymentCount ? formatQty(i.boughtQuantity, i.unit) : '—'}</span>
              <input className="form-input" inputMode="decimal" aria-label={`${i.name} given out`} placeholder={i.boughtQuantity != null ? String(i.boughtQuantity) : ''}
                value={given[i.id] ?? ''} onChange={(e) => setGiven({ ...given, [i.id]: e.target.value })} />
            </div>
          ))}
        </div>
      )}
      <div className="form-group">
        <label className="form-label" htmlFor="report-summary">What happened?</label>
        <textarea id="report-summary" className="form-input" rows={6} maxLength={4000} value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder={'For example: On 14 November we gave one pen and one chocolate to 1,200 students in 12 schools. The shop gave us pens at ₹4 instead of ₹5, so we saved ₹1,200. The ₹500 left over has gone to the scholarship fund.\n\nUse **text** for bold.'} />
      </div>
      <div className="form-group">
        <label className="form-label">Photos from the event</label>
        <EventImageManager eventId={event.id} images={photos} kind="PHOTO" onChange={setPhotos} />
      </div>
    </ModalShell>
  );
};

// ------------------------------------------------------------------ fix a payment's details

export const ExpenseDetailsModal: React.FC<{
  event: FundEventDTO;
  expense: FundEventExpenseDTO;
  onSaved: () => void;
  onClose: () => void;
}> = ({ event, expense, onSaved, onClose }) => {
  const items = event.items ?? [];
  const [itemId, setItemId] = useState(expense.itemId != null ? String(expense.itemId) : '');
  const [qty, setQty] = useState(expense.quantity != null ? String(expense.quantity) : '');
  const [price, setPrice] = useState(expense.unitPrice != null ? String(expense.unitPrice) : '');
  const [purpose, setPurpose] = useState(expense.purpose);
  const [paidOn, setPaidOn] = useState(expense.paidOn);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const q = parseOptional(qty);
  const p = parseOptional(price);
  const product = q != null && p != null && !Number.isNaN(q) && !Number.isNaN(p) ? round2(q * p) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(q) || Number.isNaN(p)) return setError('Please check the quantity and price.');
    if (!purpose.trim()) return setError('Please say what it was spent on.');
    if (paidOn > todayLocalISO()) return setError('The date cannot be in the future.');
    setBusy(true);
    setError('');
    try {
      await updateEventExpenseDetails(event.id, expense.id, {
        itemId: itemId ? Number(itemId) : null, quantity: q, unitPrice: p, purpose: purpose.trim(), paidOn
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save the details.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Edit payment details" busy={busy} onClose={onClose} onSubmit={submit} error={error}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      <p className="event-modal-sub">
        Amount paid: <strong>{formatINR(expense.amount)}</strong>. The amount cannot be changed because the money has already moved.
      </p>
      {items.length > 0 && (
        <div className="form-group">
          <label className="form-label" htmlFor="xd-item">Which item was it for?</label>
          <select id="xd-item" className="form-input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            <option value="">Something else</option>
          </select>
        </div>
      )}
      <div className="event-form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="xd-qty">How many?</label>
          <input id="xd-qty" className="form-input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="xd-price">Price of one (₹)</label>
          <input id="xd-price" className="form-input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="xd-date">Paid on</label>
          <input id="xd-date" type="date" className="form-input" value={paidOn} max={todayLocalISO()} onChange={(e) => setPaidOn(e.target.value)} />
        </div>
      </div>
      {product != null && product !== expense.amount && (
        <p className="form-help">{qtyTimesPrice(q, null, p)} = {formatINR(product)}, which differs from the amount paid ({formatINR(expense.amount)}). That is fine if there was a discount or delivery charge.</p>
      )}
      <div className="form-group">
        <label className="form-label required" htmlFor="xd-purpose">What was it spent on?</label>
        <input id="xd-purpose" className="form-input" maxLength={500} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      </div>
    </ModalShell>
  );
};
