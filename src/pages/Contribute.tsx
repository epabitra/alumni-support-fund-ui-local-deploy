import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCheckoutConfig, createPaymentOrder } from '../app/modules/payment/core/_requests';
import { openRazorpayCheckout } from '../app/modules/payment/core/razorpayCheckout';
import { useAuth } from '../app/modules/auth/core/Auth';
import '../styles/dashboard.css';
import '../styles/payment.css';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10000000;

/** Razorpay: 2% + 18% GST on the fee = 2% × 1.18 = 2.36% total. Domestic cards/UPI/netbanking. */
const RAZORPAY_BASE_FEE_PERCENT = 2;
const RAZORPAY_GST_PERCENT = 18;
const RAZORPAY_TOTAL_FEE_PERCENT = RAZORPAY_BASE_FEE_PERCENT * (1 + RAZORPAY_GST_PERCENT / 100);

function formatInr(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const Contribute: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const amountNum = (() => {
    const n = parseFloat(amount);
    if (amount.trim() === '' || Number.isNaN(n) || n < MIN_AMOUNT || n > MAX_AMOUNT) return null;
    return n;
  })();
  const gatewayCharge = amountNum != null ? Math.round(amountNum * RAZORPAY_TOTAL_FEE_PERCENT * 100) / 10000 : 0;
  const netToFund = amountNum != null ? amountNum - gatewayCharge : 0;

  useEffect(() => {
    let cancelled = false;
    getCheckoutConfig()
      .then((config) => {
        if (!cancelled) {
          setCheckoutKey(config.razorpayKeyId);
          setConfigError(null);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setConfigError(err.response?.data?.message || 'Unable to load payment configuration. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingConfig(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      const num = parseFloat(amount);
      if (Number.isNaN(num) || num < MIN_AMOUNT || num > MAX_AMOUNT) {
        setMessage({ type: 'error', text: `Please enter an amount between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString()}.` });
        return;
      }
      if (!checkoutKey) {
        setMessage({ type: 'error', text: 'Payment is not ready. Please refresh the page.' });
        return;
      }
      setSubmitting(true);
      try {
        const order = await createPaymentOrder({
          amount: num,
          currency: 'INR',
          description: description.trim() || undefined,
          customerName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : undefined,
          customerEmail: currentUser?.email,
        });
        if (order.status !== 'CREATED' && order.status !== 'PENDING') {
          setMessage({ type: 'error', text: 'Order could not be created. Please try again.' });
          setSubmitting(false);
          return;
        }
        openRazorpayCheckout({
          razorpayKeyId: checkoutKey,
          providerOrderId: order.providerOrderId,
          amountInr: order.amount,
          currency: order.currency,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          description: order.description || 'Contribution to Alumni Support Fund',
          onSuccess: () => {
            setSubmitting(false);
            setAmount('');
            setDescription('');
            navigate(`/contribute/success?orderId=${encodeURIComponent(order.orderId)}`, { replace: true });
          },
          onDismiss: () => {
            setSubmitting(false);
            setMessage({ type: 'info', text: 'Payment was cancelled. You can try again when ready.' });
          },
        });
      } catch (err: any) {
        setSubmitting(false);
        const msg = err.response?.data?.message || err.message || 'Failed to create payment. Please try again.';
        setMessage({ type: 'error', text: msg });
      }
    },
    [amount, description, checkoutKey, currentUser, navigate]
  );

  if (loadingConfig) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content">
          <div className="payment-card">
            <p className="payment-message error">{configError}</p>
            <Link to="/dashboard" className="payment-submit" style={{ textDecoration: 'none' }}>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="payment-main dashboard-content">
        <div className="private-page-title-block">
          <h1>Contribute to the Fund</h1>
          <p>Your contribution supports students through the Alumni Support Fund. Secure payment via Razorpay.</p>
        </div>
        <div className="payment-card">

          {message && (
            <div className={`payment-message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label htmlFor="amount">Amount (₹) *</label>
              <input
                id="amount"
                type="number"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                required
                disabled={submitting}
              />
              <p className="form-hint">Minimum ₹1. Maximum ₹1,00,00,000.</p>
            </div>

            {amountNum != null && amountNum > 0 && (
              <div className="contribution-breakdown" role="region" aria-label="Contribution breakdown">
                <div className="contribution-breakdown-title">Contribution breakdown</div>
                <div className="contribution-breakdown-row contribution-breakdown-you">
                  <span className="contribution-breakdown-label">Amount you are paying</span>
                  <span className="contribution-breakdown-value">{formatInr(amountNum)}</span>
                </div>
                <div className="contribution-breakdown-row contribution-breakdown-charge">
                  <span className="contribution-breakdown-label">
                    Payment gateway charge (Razorpay, {RAZORPAY_BASE_FEE_PERCENT}% + {RAZORPAY_GST_PERCENT}% GST)
                  </span>
                  <span className="contribution-breakdown-value">− {formatInr(gatewayCharge)}</span>
                </div>
                <div className="contribution-breakdown-row contribution-breakdown-net">
                  <span className="contribution-breakdown-label">Net amount to the fund</span>
                  <span className="contribution-breakdown-value">{formatInr(netToFund)}</span>
                </div>
                <p className="contribution-breakdown-note">
                  The payment gateway charge is levied by Razorpay, not by our organization. This is the fee for processing your payment securely.
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="description">Message (optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional note for your contribution"
                disabled={submitting}
                maxLength={500}
              />
            </div>
            <button type="submit" className="payment-submit" disabled={submitting}>
              {submitting ? (
                'Opening payment…'
              ) : (
                <>Pay securely with Razorpay</>
              )}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--ink-500)' }}>
          <Link to="/my-contributions" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>
            View my contributions
          </Link>
          {' · '}
          <Link to="/dashboard" style={{ color: 'var(--ink-500)' }}>
            Dashboard
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--ink-400)', marginTop: '0.5rem' }}>
          <Link to="/privacy-policy" style={{ color: 'var(--ink-500)' }}>Privacy Policy</Link>
          {' · '}
          <Link to="/terms" style={{ color: 'var(--ink-500)' }}>Terms</Link>
          {' · '}
          <Link to="/refund-policy" style={{ color: 'var(--ink-500)' }}>Refund Policy</Link>
        </p>
      </main>
    </div>
  );
};

export default Contribute;
