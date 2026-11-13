import React, { useState } from 'react';
import { useAuth } from '../../app/modules/auth/core/Auth';
import { DONATION_WHATSAPP } from '../../app/Constants';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import { eventLink } from './ShareEvent';

const QUICK = [100, 250, 500, 1000];
const MAX = 1000000;

/** ₹500 or ₹1,250.50 (no .00 for whole rupees) */
const rupees = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2
}).format(n);

/** The message the fund admin receives; the admin then shares payment details and records the donation */
export function pledgeMessage(event: FundEventDTO, amount: number, user?: { firstName?: string; lastName?: string; email?: string; phone?: string | null }): string {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const lines = [
    'Hello 🙏',
    `I would like to donate *${rupees(amount)}* for *${event.title}*.`,
    ''
  ];
  if (name) lines.push(`Name: ${name}`);
  if (user?.phone) lines.push(`Phone: ${user.phone}`);
  if (user?.email) lines.push(`Email: ${user.email}`);
  lines.push(`Event: ${eventLink(event)}`, '', 'Please share the payment details (UPI / bank).');
  return lines.join('\n');
}

/** Member enters an amount and is taken to WhatsApp with a ready message to the fund admin */
export const WhatsAppPledge: React.FC<{ event: FundEventDTO; onlineAvailable: boolean }> = ({ event, onlineAvailable }) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const parse = (s: string) => {
    const t = s.trim().replace(/,/g, '');
    return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : NaN;
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parse(input);
    if (Number.isNaN(amount) || amount < 1) return setError('Please enter the amount you want to give.');
    if (amount > MAX) return setError(`Please enter up to ${rupees(MAX)}.`);
    setError('');
    const url = `https://wa.me/${DONATION_WHATSAPP}?text=${encodeURIComponent(pledgeMessage(event, amount, currentUser ?? undefined))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <form className="wa-pledge" onSubmit={send} noValidate aria-labelledby="wa-pledge-title">
      <p id="wa-pledge-title" className="wa-pledge-title">
        {onlineAvailable ? 'Or pay by UPI / bank: tell us on WhatsApp' : 'Donate via WhatsApp'}
      </p>
      <p className="wa-pledge-help">
        Enter how much you want to give. WhatsApp opens with a ready message to the fund admin, who will send you the payment details
        and record your donation here.
      </p>
      <div className="wa-pledge-quick" role="group" aria-label="Quick amounts">
        {QUICK.map((q) => (
          <button key={q} type="button" className={`wa-pledge-chip ${parse(input) === q ? 'active' : ''}`}
            onClick={() => { setInput(String(q)); setError(''); }}>
            {rupees(q)}
          </button>
        ))}
      </div>
      <div className="wa-pledge-row">
        <label className="visually-hidden" htmlFor="wa-pledge-amount">Amount in rupees</label>
        <span className="wa-pledge-rupee" aria-hidden>₹</span>
        <input id="wa-pledge-amount" className="form-input" inputMode="decimal" placeholder="Other amount" value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }} />
        <button type="submit" className="btn wa-pledge-send">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
            <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.3zM12 21.7c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 0 1-1.5-5.2C2.1 6.5 6.5 2.1 12 2.1c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.7-9.9 9.7zm5.4-7.3c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1 2.1 3.2 5.1 4.5c.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.6-.4z" />
          </svg>
          Send
        </button>
      </div>
      {error && <p className="wa-pledge-error" role="alert">{error}</p>}
    </form>
  );
};
