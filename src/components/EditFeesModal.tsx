import React, { useState } from 'react';
import { updateStudentFees } from '../app/modules/scholarship/core/_requests';
import type { StudentDTO } from '../app/modules/scholarship/core/_models';
import { formatINR } from './ScholarshipPaymentModal';
import '../pages/admin/admin.css';

type FeeKey = 'joiningFees' | 'annualFees' | 'booksPrice' | 'extraPrice' | 'travelFees';

const FEE_FIELDS: { key: FeeKey; label: string }[] = [
  { key: 'joiningFees', label: 'Joining fees' },
  { key: 'annualFees', label: 'Annual fees' },
  { key: 'booksPrice', label: 'Books price' },
  { key: 'extraPrice', label: 'Extra price' },
  { key: 'travelFees', label: 'Travel fees (auto / rickshaw)' }
];

const MAX_FEE = 1000000;

interface EditFeesModalProps {
  /** Student with fees and totalPaid (from the verified or selected students list) */
  student: StudentDTO;
  onSaved: () => void;
  onClose: () => void;
}

/** Correct the fees of a verified / selected student. Every change is logged with its reason. */
const EditFeesModal: React.FC<EditFeesModalProps> = ({ student, onSaved, onClose }) => {
  const [values, setValues] = useState<Record<FeeKey, string>>(() => {
    const init = {} as Record<FeeKey, string>;
    FEE_FIELDS.forEach(({ key }) => (init[key] = String(student[key] ?? 0)));
    return init;
  });
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalPaid = student.totalPaid ?? 0;
  const oldTotal = student.totalCost ?? 0;
  const numbers = FEE_FIELDS.map(({ key }) => (values[key].trim() === '' ? NaN : Number(values[key])));
  const newTotal = numbers.reduce((sum, n) => sum + (Number.isNaN(n) ? 0 : n), 0);
  const changed = FEE_FIELDS.some(({ key }, i) => Math.abs((student[key] ?? 0) - numbers[i]) > 0.001);

  const validate = (): string => {
    for (let i = 0; i < FEE_FIELDS.length; i++) {
      const n = numbers[i];
      const label = FEE_FIELDS[i].label;
      if (Number.isNaN(n)) return `Please enter ${label.toLowerCase()} (0 if none)`;
      if (n < 0) return `${label} cannot be negative`;
      if (n > MAX_FEE) return `${label} is too large`;
      if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) return `${label} can have at most 2 decimal places`;
    }
    if (!changed) return 'No fee was changed';
    if (newTotal + 0.001 < totalPaid) {
      return `New total ${formatINR(newTotal)} cannot be less than the amount already paid (${formatINR(totalPaid)})`;
    }
    if (!reason.trim()) return 'Please enter the reason for changing the fees';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setSaving(true);
      setError('');
      await updateStudentFees(student.id!, {
        joiningFees: numbers[0],
        annualFees: numbers[1],
        booksPrice: numbers[2],
        extraPrice: numbers[3],
        travelFees: numbers[4],
        reason: reason.trim()
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit fees</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="scholarship-modal-student">
              {student.studentName} · Class {student.classLevel ?? '—'} · {student.schoolName ?? ''}
            </p>

            <div className="scholarship-summary-grid">
              {FEE_FIELDS.map(({ key, label }) => (
                <div className="form-group" key={key}>
                  <label className="form-label" htmlFor={`fee-${key}`}>{label} (₹)</label>
                  <input
                    id={`fee-${key}`}
                    className="form-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={values[key]}
                    onChange={(e) => { setValues((v) => ({ ...v, [key]: e.target.value })); setError(''); }}
                  />
                </div>
              ))}
            </div>

            <div className="scholarship-summary-grid">
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Total cost (before → after)</span>
                <span className="scholarship-summary-value">{formatINR(oldTotal)} → {formatINR(newTotal)}</span>
              </div>
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Already paid</span>
                <span className="scholarship-summary-value">{formatINR(totalPaid)}</span>
              </div>
              <div className="scholarship-summary-item">
                <span className="scholarship-summary-label">Remaining after change</span>
                <span className="scholarship-summary-value">{formatINR(Math.max(0, newTotal - totalPaid))}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required" htmlFor="fee-reason">Reason for change</label>
              <textarea
                id="fee-reason"
                className="form-input"
                rows={2}
                maxLength={500}
                placeholder="e.g. Joining fees entered as 5,100 by mistake; school receipt shows 5,300"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(''); }}
              />
              <div className="form-help">The change and reason are saved and shown to all members in this student's payment history.</div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save fees'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeesModal;
