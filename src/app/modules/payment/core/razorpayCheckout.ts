/**
 * Load Razorpay checkout script and open checkout modal.
 * Amount must be in INR; we convert to paise for Razorpay.
 */

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
}

/** Open Razorpay Checkout. amountInr is in INR (e.g. 100). */
export async function openRazorpayCheckout(params: {
  razorpayKeyId: string;
  providerOrderId: string;
  amountInr: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  onSuccess: (paymentId: string, orderId: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  await loadScript();
  const amountPaise = Math.round(params.amountInr * 100);
  const options: RazorpayOptions = {
    key: params.razorpayKeyId,
    order_id: params.providerOrderId,
    amount: amountPaise,
    currency: params.currency || 'INR',
    name: 'Alumni Support Fund',
    description: params.description || 'Contribution to the fund',
    prefill: {
      name: params.customerName || undefined,
      email: params.customerEmail || undefined,
      contact: params.customerPhone || undefined,
    },
    handler: (response) => {
      params.onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
    },
    modal: {
      ondismiss: params.onDismiss,
    },
  };
  const razorpay = new window.Razorpay(options);
  razorpay.open();
}
