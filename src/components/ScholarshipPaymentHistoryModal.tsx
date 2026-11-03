import React, { useEffect, useState } from 'react';
import {
  getStudentScholarshipPayments,
  getSelectedStudentPayments,
  addScholarshipPaymentReceipts,
  removeScholarshipPaymentReceipt
} from '../app/modules/scholarship/core/_requests';
import type { StudentDTO, StudentScholarshipSummaryDTO, ScholarshipReceiptDTO } from '../app/modules/scholarship/core/_models';
import { formatINR, formatLocalDate } from './ScholarshipPaymentModal';
import { ReceiptFilePicker, ReceiptList, validateReceiptFiles, MAX_RECEIPTS_PER_PAYMENT } from './ScholarshipReceipts';
import LoadingSpinner from './LoadingSpinner';
import '../pages/admin/admin.css';

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

interface ScholarshipPaymentHistoryModalProps {
  student: StudentDTO;
  /** Admin: loads the admin view (shows who recorded each payment) and allows adding / removing receipts */
  canManage: boolean;
  onClose: () => void;
}

/** Totals and every payment of one student, with purpose, dates and receipts. */
const ScholarshipPaymentHistoryModal: React.FC<ScholarshipPaymentHistoryModalProps> = ({ student, canManage, onClose }) => {
  const [history, setHistory] = useState<StudentScholarshipSummaryDTO>({
    studentId: student.id!,
    studentName: student.studentName,
    totalCost: student.totalCost ?? 0,
    totalPaid: student.totalPaid ?? 0,
    remainingAmount: student.remainingAmount ?? 0,
    payments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** Payment whose "add receipts" form is open */
  const [receiptTarget, setReceiptTarget] = useState<number | null>(null);
  const [pendingReceipts, setPendingReceipts] = useState<File[]>([]);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [removingReceiptId, setRemovingReceiptId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (canManage ? getStudentScholarshipPayments(student.id!) : getSelectedStudentPayments(student.id!))
      .then((data) => !cancelled && setHistory(data))
      .catch((err: any) => !cancelled && setError(err.response?.data?.message || 'Failed to load payment history'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [student.id, canManage]);

  const close = () => {
    if (!receiptBusy) onClose();
  };

  const uploadReceipts = async (paymentId: number, existingCount: number) => {
    const msg = pendingReceipts.length === 0 ? 'Please choose at least one receipt' : validateReceiptFiles(pendingReceipts, existingCount);
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setReceiptBusy(true);
      setError('');
      setHistory(await addScholarshipPaymentReceipts(history.studentId, paymentId, pendingReceipts));
      setReceiptTarget(null);
      setPendingReceipts([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload receipts');
    } finally {
      setReceiptBusy(false);
    }
  };

  const removeReceipt = async (paymentId: number, receipt: ScholarshipReceiptDTO) => {
    if (!window.confirm('Remove this receipt? Members will no longer see it.')) return;
    try {
      setRemovingReceiptId(receipt.id);
      setError('');
      setHistory(await removeScholarshipPaymentReceipt(history.studentId, paymentId, receipt.id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove receipt');
    } finally {
      setRemovingReceiptId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment history</h2>
        </div>
        <div className="modal-body">
          <p className="scholarship-modal-student">{history.studentName}</p>
          <div className="scholarship-summary-grid">
            <div className="scholarship-summary-item">
              <span className="scholarship-summary-label">Total cost</span>
              <span className="scholarship-summary-value">{formatINR(history.totalCost)}</span>
            </div>
            <div className="scholarship-summary-item">
              <span className="scholarship-summary-label">Paid</span>
              <span className="scholarship-summary-value">{formatINR(history.totalPaid)}</span>
            </div>
            <div className="scholarship-summary-item">
              <span className="scholarship-summary-label">Remaining</span>
              <span className="scholarship-summary-value">{formatINR(history.remainingAmount)}</span>
            </div>
            <div className="scholarship-summary-item">
              <span className="scholarship-summary-label">Payments</span>
              <span className="scholarship-summary-value">{loading ? '…' : history.payments.length}</span>
            </div>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : history.payments.length === 0 ? (
            <p className="form-help">No payments made to this student yet.</p>
          ) : (
            <ul className="scholarship-history-list">
              {history.payments.map((p) => {
                const receipts = p.receipts ?? [];
                return (
                  <li key={p.id} className="scholarship-history-item">
                    <div className="scholarship-history-meta">
                      <strong>Paid on {formatLocalDate(p.paidOn)}</strong>
                      {p.remarks && <span className="scholarship-history-purpose">{p.remarks}</span>}
                      <span>
                        Recorded {formatDateTime(p.paymentDate)}
                        {p.paidByName && ` by ${p.paidByName}`}
                      </span>
                      <ReceiptList
                        receipts={receipts}
                        onRemove={canManage ? (r) => removeReceipt(p.id, r) : undefined}
                        removingId={removingReceiptId}
                        emptyText="No receipt attached"
                      />
                      {canManage && (receiptTarget === p.id ? (
                        <div className="scholarship-history-receipt-form">
                          <ReceiptFilePicker
                            files={pendingReceipts}
                            onChange={(files) => { setPendingReceipts(files); setError(''); }}
                            existingCount={receipts.length}
                            disabled={receiptBusy}
                          />
                          <div className="scholarship-amount-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => uploadReceipts(p.id, receipts.length)}
                              disabled={receiptBusy || pendingReceipts.length === 0}
                            >
                              {receiptBusy ? 'Uploading…' : 'Upload'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setReceiptTarget(null); setPendingReceipts([]); setError(''); }}
                              disabled={receiptBusy}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        receipts.length < MAX_RECEIPTS_PER_PAYMENT && (
                          <div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setReceiptTarget(p.id); setPendingReceipts([]); setError(''); }}
                              disabled={receiptBusy}
                            >
                              Add receipts
                            </button>
                          </div>
                        )
                      ))}
                    </div>
                    <span className="scholarship-history-amount">{formatINR(p.amount)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && (history.feeChanges ?? []).length > 0 && (
            <>
              <h3 className="scholarship-history-subtitle">Fee corrections</h3>
              <ul className="scholarship-history-list">
                {(history.feeChanges ?? []).map((c) => (
                  <li key={c.id} className="scholarship-history-item">
                    <div className="scholarship-history-meta">
                      <strong>{c.changes.replace(/ -> /g, ' → ')}</strong>
                      <span className="scholarship-history-purpose">Reason: {c.reason}</span>
                      <span>
                        Changed {formatDateTime(c.changedAt)}
                        {c.changedByName && ` by ${c.changedByName}`}
                      </span>
                    </div>
                    <span className="scholarship-history-total-change">
                      {formatINR(c.oldTotal)} → {formatINR(c.newTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={close} disabled={receiptBusy}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipPaymentHistoryModal;
