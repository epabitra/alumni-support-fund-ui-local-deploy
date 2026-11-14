import React from 'react';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import { amountInWords, formatRupees, parseRupees } from './amountWords';

export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 1_000_000;
const QUICK = [500, 1000, 2000, 5000];

/** Message for a typed amount, or '' when it is fine */
export function amountError(input: string): string {
  if (!input.trim()) return 'Please enter the amount received.';
  const n = parseRupees(input);
  if (Number.isNaN(n)) return 'Please enter the amount in rupees, for example 500 or 1250.50.';
  if (n < MIN_AMOUNT || n > MAX_AMOUNT) return `The amount must be between ${formatRupees(MIN_AMOUNT)} and ${formatRupees(MAX_AMOUNT)}.`;
  return '';
}

/** Big rupee field with quick amounts; the amount is repeated in words so a wrong zero is easy to spot */
export const AmountField: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Shown under the field, e.g. "was ₹5,000" */
  hint?: React.ReactNode;
  quick?: boolean;
}> = ({ id, value, onChange, error, disabled, hint, quick = true }) => {
  const n = parseRupees(value);
  const words = !Number.isNaN(n) && n > 0 && n <= MAX_AMOUNT ? amountInWords(n) : '';
  return (
    <div className="ap-amount">
      <div className={`ap-amount-box ${error ? 'invalid' : ''}`}>
        <span aria-hidden>₹</span>
        <input id={id} className="custom-input" inputMode="decimal" autoComplete="off" placeholder="0" value={value} disabled={disabled}
          aria-invalid={!!error} aria-describedby={`${id}-words`}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))} />
      </div>
      {quick && (
        <div className="ap-quick" role="group" aria-label="Quick amounts">
          {QUICK.map((q) => (
            <button key={q} type="button" className={`ap-chip ${n === q ? 'active' : ''}`} disabled={disabled} onClick={() => onChange(String(q))}>
              {formatRupees(q)}
            </button>
          ))}
        </div>
      )}
      <p id={`${id}-words`} className={`ap-words ${error ? 'error' : ''}`} aria-live="polite">
        {error || words || ' '}
      </p>
      {hint && <p className="ap-hint">{hint}</p>}
    </div>
  );
};

/** General Fund or one of the open events, as tappable cards. value '' = General Fund */
export const FundChoice: React.FC<{
  name: string;
  value: string;
  onChange: (value: string) => void;
  events: FundEventDTO[];
  disabled?: boolean;
}> = ({ name, value, onChange, events, disabled }) => {
  const options = [
    { value: '', title: 'General Fund', sub: 'Scholarships for students' },
    ...events.map((e) => ({
      value: String(e.id),
      title: e.title,
      sub: e.collectionEnded ? 'Event · donations ended (late payment)' : `Event · open till ${new Date(e.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    }))
  ];
  return (
    <div className="ap-funds" role="radiogroup">
      {options.map((o) => (
        <label key={o.value || 'general'} className={`ap-fund ${value === o.value ? 'selected' : ''}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={disabled} onChange={() => onChange(o.value)} />
          <span className="ap-fund-text">
            <strong>{o.title}</strong>
            <small>{o.sub}</small>
          </span>
        </label>
      ))}
    </div>
  );
};

/** yyyy-MM-dd of today in the browser's time zone */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** yyyy-MM-dd of an instant, in India time */
export function istDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
