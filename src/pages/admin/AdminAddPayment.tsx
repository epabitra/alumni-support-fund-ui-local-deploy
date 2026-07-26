import React, { useState, useEffect } from 'react';
import { addPaymentAsAdmin, AdminAddPaymentResult } from '../../app/modules/auth/core/_user_requests';
import { getReceipt } from '../../app/modules/payment/core/_requests';
import type { ReceiptDTO } from '../../app/modules/payment/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import ReceiptContainer from '../../components/Receipt/ReceiptContainer';
import '../../styles/professional-ui.css';
import './admin.css';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;

const AdminAddPayment: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<AdminAddPaymentResult | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptOrderId) {
      setReceipt(null);
      setReceiptError(null);
      return;
    }
    let cancelled = false;
    setReceiptLoading(true);
    setReceiptError(null);
    getReceipt(receiptOrderId)
      .then((data) => {
        if (!cancelled) {
          setReceipt(data);
          setReceiptLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setReceiptError(err.response?.data?.message || err.message || 'Failed to load receipt.');
          setReceiptLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [receiptOrderId]);

  const validate = (): string | null => {
    const email = userEmail.trim();
    if (!email) return 'User email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    const num = parseFloat(amount);
    if (amount === '' || isNaN(num)) return 'Amount is required.';
    if (num < MIN_AMOUNT || num > MAX_AMOUNT) {
      return `Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString()}.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    try {
      setLoading(true);
      const res = await addPaymentAsAdmin({
        userEmail: userEmail.trim(),
        amount: parseFloat(amount),
      });
      setSuccess(res.data);
      setUserEmail('');
      setAmount('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to add payment.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Add payment (Admin)"
          subtitle="Record a contribution for a user without using the payment gateway. The user must exist in the system (matched by email)."
        />
        <div className="admin-card">
          <h2 className="admin-card-title">Add payment for user</h2>
          <p className="admin-card-description">
            Enter the user's registered email and the amount in INR. This will update the fund balance and the user's contribution history. Payment will appear as &quot;Admin&quot; in history.
          </p>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              <strong>Payment added successfully.</strong>
              <ul className="mt-2 mb-0">
                <li>Order ID: <code>{success.orderId}</code></li>
                <li>Transaction ID: <code>{success.transactionId}</code></li>
                <li>Amount: ₹{Number(success.amount).toLocaleString('en-IN')}</li>
                <li>User: {success.userEmail}</li>
              </ul>
              <div className="mt-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setReceiptOrderId(success.orderId)}
                >
                  View &amp; download receipt
                </button>
              </div>
            </div>
          )}
          {receiptOrderId && (
            <div className="admin-card mt-3" style={{ marginTop: '1.5rem' }}>
              <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '1rem' }}>
                <h3 className="admin-card-title" style={{ margin: 0 }}>Receipt</h3>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setReceiptOrderId(null); setReceipt(null); }}>
                  Close
                </button>
              </div>
              {receiptLoading && <p>Loading receipt…</p>}
              {receiptError && <div className="alert alert-danger">{receiptError}</div>}
              {receipt && (
                <ReceiptContainer
                  data={receipt}
                  showLinks={false}
                />
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="admin-add-payment-email">User email *</label>
              <input
                id="admin-add-payment-email"
                type="email"
                className="form-control"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-add-payment-amount">Amount (INR) *</label>
              <input
                id="admin-add-payment-amount"
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="0.01"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                disabled={loading}
              />
              <span className="form-help" style={{ display: 'block', marginTop: '0.25rem' }}>
                Min ₹{MIN_AMOUNT}, max ₹{MAX_AMOUNT.toLocaleString()}.
              </span>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding…' : 'Add payment'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminAddPayment;
