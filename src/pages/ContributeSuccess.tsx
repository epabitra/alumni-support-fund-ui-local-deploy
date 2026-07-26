import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import ReceiptContainer from '../components/Receipt/ReceiptContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import { getReceipt } from '../app/modules/payment/core/_requests';
import type { ReceiptDTO } from '../app/modules/payment/core/_models';
import '../styles/dashboard.css';
import '../styles/payment.css';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 35000;

export default function ContributeSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !orderId.startsWith('ORD_')) {
      setError('Invalid or missing order reference.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const start = Date.now();

    const tryFetch = () => {
      if (cancelled) return;
      getReceipt(orderId)
        .then((data) => {
          if (!cancelled) {
            setReceipt(data);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: any) => {
          if (cancelled) return;
          const msg = err.response?.data?.message || err.message || 'Failed to load receipt.';
          if (err.response?.status === 404 || msg.toLowerCase().includes('not available')) {
            if (Date.now() - start < POLL_TIMEOUT_MS) {
              setTimeout(tryFetch, POLL_INTERVAL_MS);
            } else {
              setError('Receipt is taking longer than usual. It will appear under My Contributions once confirmed.');
              setLoading(false);
            }
          } else {
            setError(msg);
            setLoading(false);
          }
        });
    };

    tryFetch();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading && !receipt) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content">
          <div className="private-page-title-block">
            <h1>Payment successful</h1>
            <p>Confirming your payment and preparing your receipt…</p>
          </div>
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error && !receipt) {
    return (
      <div className="dashboard-container">
        <RoleBasedNav />
        <main className="dashboard-content">
          <div className="private-page-title-block">
            <h1>Payment successful</h1>
            <p className="payment-message error">{error}</p>
            <p>
              <Link to="/my-contributions" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>
                Go to My Contributions
              </Link>
              {' · '}
              <Link to="/contribute">Contribute again</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content">
        <div className="private-page-title-block">
          <h1>Thank you for your contribution</h1>
          <p>Your receipt is below. You can print it or download it as PDF.</p>
        </div>
        {receipt && (
          <ReceiptContainer
            data={receipt}
            showLinks={true}
            linkToMyContributions="/my-contributions"
            linkToContribute="/contribute"
          />
        )}
      </main>
    </div>
  );
}
