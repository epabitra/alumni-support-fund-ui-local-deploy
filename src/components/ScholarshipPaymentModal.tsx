import React, { useState } from 'react';
import { ReceiptFilePicker, validateReceiptFiles } from './ScholarshipReceipts';

export function formatINR(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

/** Today's date in the browser's time zone as yyyy-MM-dd */
export function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Formats a yyyy-MM-dd date without time-zone shifting (new Date('yyyy-MM-dd') is UTC and can show the previous day) */
export function formatLocalDate(isoDate?: string): string {
  const m = isoDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate) : null;
  if (!m) return isoDate || '—';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface ScholarshipPaymentInput {
  amount: number;
  /** Purpose of the payment ('' when amount is 0) */
  remarks: string;
  /** yyyy-MM-dd */
  paidOn: string;
  receipts: File[];
}

interface ScholarshipPaymentModalProps {
  title: string;
  studentName: string;
  totalCost: number;
  totalPaid: number;
  /** Current fund balance; null while unknown */
  fundBalance: number | null;
  /** true when selecting a student (0 allowed = pay later); false for an installment (must be > 0) */
  allowZero: boolean;
  confirmLabel: string;
  /** Optional warning shown above the form (e.g. selection limit reached) */
  warning?: string;
  onSubmit: (payment: ScholarshipPaymentInput) => Promise<void>;
  onClose: () => void;
}

const ScholarshipPaymentModal: React.FC<ScholarshipPaymentModalProps> = ({
  title,
  studentName,
  totalCost,
  totalPaid,
  fundBalance,
  allowZero,
  confirmLabel,
  warning,
  onSubmit,
  onClose
}) => {
  const remaining = Math.max(0, totalCost - totalPaid);
  const maxPayable = fundBalance != null ? Math.min(remaining, Math.max(0, fundBalance)) : remaining;

  const [amountInput, setAmountInput] = useState(allowZero ? '0' : '');
  const [remarks, setRemarks] = useState('');
  const [paidOn, setPaidOn] = useState(todayLocalISO);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amount = amountInput.trim() === '' ? NaN : Number(amountInput);
  const remainingAfter = Number.isNaN(amount) ? remaining : Math.max(0, remaining - amount);
  // Date, purpose and receipts describe a payment; not needed when selecting with ₹0 (pay later)
  const isPayLater = allowZero && amount === 0;
  const today = todayLocalISO();

  const validate = (): string => {
    if (Number.isNaN(amount)) return 'Please enter an amount';
    if (amount < 0) return 'Amount cannot be negative';
    if (!allowZero && amount <= 0) return 'Please enter an amount greater than 0';
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6) return 'Amount can have at most 2 decimal places';
    if (amount > remaining) return `Amount cannot exceed the remaining scholarship amount (${formatINR(remaining)})`;
    if (fundBalance != null && amount > fundBalance) return `Amount cannot exceed the current fund balance (${formatINR(fundBalance)})`;
    if (isPayLater) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return 'Please choose the date the payment was made';
    if (paidOn > today) return 'Payment date cannot be in the future';
    if (paidOn < '2000-01-01') return 'Payment date is too far in the past';
    if (!remarks.trim()) return 'Please enter the purpose of this payment';
    return validateReceiptFiles(receipts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await onSubmit(
        isPayLater
          ? { amount, remarks: '', paidOn: today, receipts: [] }
          : { amount, remarks: remarks.trim(), paidOn, receipts }
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {warning && <div className="alert alert-warning">{warning}</div>}

            <p className="scholarship-modal-student">{studentName}</p>
            <div className="scholarship-summary-grid">
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Total scholarship cost</span>
                <span className="scholarship-summary-value">{formatINR(totalCost)}</span>
              </div>
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Already paid</span>
                <span className="scholarship-summary-value">{formatINR(totalPaid)}</span>
              </div>
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Remaining</span>
                <span className="scholarship-summary-value">{formatINR(remaining)}</span>
              </div>
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Fund balance</span>
                <span className="scholarship-summary-value">{fundBalance != null ? formatINR(fundBalance) : '—'}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="scholarship-amount">Amount to pay now (₹)</label>
              <input
                id="scholarship-amount"
                className="form-input"
                type="number"
                inputMode="decimal"
                min={allowZero ? 0 : 0.01}
                max={maxPayable}
                step="0.01"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setError(''); }}
                autoFocus
              />
              <div className="scholarship-amount-actions">
                {allowZero && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAmountInput('0'); setError(''); }}>
                    Pay later (₹0)
                  </button>
                )}
                {maxPayable > 0 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAmountInput(String(maxPayable)); setError(''); }}>
                    {maxPayable === remaining ? 'Pay full remaining' : 'Pay max available'} ({formatINR(maxPayable)})
                  </button>
                )}
              </div>
              <div className="form-help">
                {allowZero
                  ? 'You can select the student with ₹0 now and pay the rest later from Scholarship Payments.'
                  : 'The amount is deducted from the fund balance and recorded against this student.'}
                {' '}Remaining after this payment: <strong>{formatINR(remainingAfter)}</strong>
              </div>
            </div>

            {!isPayLater && (
              <>
                <div className="form-group">
                  <label className="form-label required" htmlFor="scholarship-paid-on">Payment date</label>
                  <input
                    id="scholarship-paid-on"
                    className="form-input"
                    type="date"
                    min="2000-01-01"
                    max={today}
                    value={paidOn}
                    onChange={(e) => { setPaidOn(e.target.value); setError(''); }}
                  />
                  <div className="form-help">The date the money was actually paid to the school, if it was earlier than today.</div>
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="scholarship-remarks">Purpose of payment</label>
                  <textarea
                    id="scholarship-remarks"
                    className="form-input"
                    rows={2}
                    maxLength={500}
                    placeholder="e.g. Annual fees for first term (Apr–Sep), paid to school office"
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); setError(''); }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receipts from school (recommended)</label>
                  <ReceiptFilePicker
                    files={receipts}
                    onChange={(files) => { setReceipts(files); setError(''); }}
                    disabled={submitting}
                  />
                  <div className="form-help">All members can see these receipts on the Fund page. You can also add them later from Scholarship Payments → History.</div>
                </div>
              </>
            )}

            {error && <div className="alert alert-danger">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScholarshipPaymentModal;
