import { forwardRef } from 'react';
import type { ReceiptDTO } from '../../app/modules/payment/core/_models';
import './receipt.css';

function formatReceiptDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface ReceiptViewProps {
  data: ReceiptDTO;
}

const ReceiptView = forwardRef<HTMLDivElement, ReceiptViewProps>(function ReceiptView({ data }, ref) {
  return (
    <div ref={ref} className="receipt receipt-card" id="receipt-content">
      <header className="receipt-header">
        <div className="receipt-org">{data.organizationName}</div>
        <h1 className="receipt-title">{data.receiptTitle}</h1>
        <div className="receipt-header-bar" />
      </header>

      <p className="receipt-thank-you">Thank you for your generous contribution.</p>

      <section className="receipt-details">
        <div className="receipt-detail-row">
          <span className="receipt-label">Receipt No.</span>
          <span className="receipt-value">{data.transactionId}</span>
        </div>
        <div className="receipt-detail-row">
          <span className="receipt-label">Order reference</span>
          <span className="receipt-value">{data.orderId}</span>
        </div>
        <div className="receipt-detail-row">
          <span className="receipt-label">Date</span>
          <span className="receipt-value">{formatReceiptDate(data.paymentDate)}</span>
        </div>
        <div className="receipt-detail-row">
          <span className="receipt-label">Donor name</span>
          <span className="receipt-value">{data.donorName || '—'}</span>
        </div>
        <div className="receipt-detail-row">
          <span className="receipt-label">Email</span>
          <span className="receipt-value">{data.donorEmail || '—'}</span>
        </div>
        <div className="receipt-detail-row receipt-amount-row">
          <span className="receipt-label">Amount</span>
          <span className="receipt-value receipt-amount">{formatAmount(data.amount, data.currency)}</span>
        </div>
        {data.amountInWords && (
          <div className="receipt-detail-row receipt-amount-words">
            <span className="receipt-label">Amount in words</span>
            <span className="receipt-value">{data.amountInWords}</span>
          </div>
        )}
        <div className="receipt-detail-row">
          <span className="receipt-label">Payment method</span>
          <span className="receipt-value">{data.paymentMethodDisplay || '—'}</span>
        </div>
        <div className="receipt-detail-row">
          <span className="receipt-label">Status</span>
          <span className="receipt-value receipt-status">{data.status}</span>
        </div>
      </section>

      <div className="receipt-message-block">
        <p>
          Your support, whether big or small, helps us reach more students every year. Together, you are what keeps
          this organisation running. We are grateful for you.
        </p>
      </div>

      <footer className="receipt-footer">
        <p>This is a computer-generated receipt and does not require a signature.</p>
        {data.generatedAt && (
          <p className="receipt-generated-at">
            Receipt generated on {formatReceiptDate(data.generatedAt)}
          </p>
        )}
      </footer>
    </div>
  );
});

export default ReceiptView;
