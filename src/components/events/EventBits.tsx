import React from 'react';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import { formatINR, formatLocalDate } from '../ScholarshipPaymentModal';

/** Donations kept + money set aside for it (for example last year's leftover), not General Fund cover for payments */
export function raisedOf(e: FundEventDTO): number {
  return e.raised ?? (e.netCollected ?? 0) + (e.transferredIn ?? 0);
}

export const EventStatusBadge: React.FC<{ event: FundEventDTO }> = ({ event }) => {
  if (event.status === 'DRAFT') return <span className="event-badge draft">Draft · only admins see this</span>;
  if (event.status === 'CLOSED') return <span className="event-badge closed">Finished</span>;
  if (event.status === 'CANCELLED') return <span className="event-badge cancelled">Cancelled</span>;
  if (event.collectionEnded) return <span className="event-badge ended">Donations ended</span>;
  const days = event.daysLeft ?? 0;
  return <span className="event-badge open">Open · {days === 1 ? 'last day' : `${days} days left`}</span>;
};

export const EventProgress: React.FC<{ event: FundEventDTO; large?: boolean }> = ({ event, large }) => {
  const raised = raisedOf(event);
  const percent = event.budget > 0 ? Math.min(100, Math.round((raised / event.budget) * 100)) : 0;
  const reached = raised >= event.budget;
  return (
    <div className={`event-progress ${large ? 'large' : ''}`}>
      <div className="event-progress-numbers">
        <strong>{formatINR(raised)}</strong>
        <span> of {formatINR(event.budget)} budget</span>
      </div>
      <div className="event-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
        aria-label={`${percent}% of the budget raised`}>
        <div className={`event-progress-fill ${reached ? 'reached' : ''}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="event-progress-foot">
        <span>{reached ? '🎉 Goal reached' : `${percent}% raised`}</span>
        <span>{event.donationCount} {event.donationCount === 1 ? 'donation' : 'donations'}</span>
      </div>
    </div>
  );
};

export function eventDates(e: FundEventDTO): string {
  return `${formatLocalDate(e.startDate)} – ${formatLocalDate(e.endDate)}`;
}

export const LEFTOVER_NOTE = 'Any amount left after this event goes to the scholarship fund or towards a future event.';

/** Splits text on **bold** markers (the WhatsApp-style formatting admins paste in). */
function boldParts(text: string): { text: string; bold: boolean }[] {
  return text.split(/\*\*([^*\n][^*]*?)\*\*/g).map((t, i) => ({ text: t, bold: i % 2 === 1 }));
}

/** Event description with **bold** shown as bold; everything else stays plain text (no HTML). */
export const EventText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {boldParts(text).map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : <React.Fragment key={i}>{p.text}</React.Fragment>))}
  </>
);

/** Plain text without the ** markers (for short previews). */
export function plainEventText(text: string): string {
  return boldParts(text).map((p) => p.text).join('');
}
