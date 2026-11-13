import React, { useEffect, useMemo, useState } from 'react';
import type { FundEventDTO } from '../../app/modules/events/core/_models';
import { fetchEventImageFile } from '../../app/modules/events/core/_requests';
import { formatLocalDate } from '../ScholarshipPaymentModal';
import { raisedOf } from './EventBits';
import { givenOutLines } from './EventPlan';

const SHARE_DESC_LIMIT = 1600;

/** **bold** (site style) becomes *bold* (WhatsApp style); long text is cut at a paragraph break. */
function whatsappDescription(raw: string): string {
  let desc = raw.trim().replace(/\*\*([^*\n][^*]*?)\*\*/g, '*$1*');
  if (desc.length <= SHARE_DESC_LIMIT) return desc;
  const cut = desc.lastIndexOf('\n\n', SHARE_DESC_LIMIT);
  desc = (cut > SHARE_DESC_LIMIT / 3 ? desc.slice(0, cut) : desc.slice(0, SHARE_DESC_LIMIT)).trimEnd();
  return desc + '\n…';
}

const rupees = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export function eventLink(e: FundEventDTO): string {
  return `${window.location.origin}/events/${e.id}`;
}

/** WhatsApp message: *bold* title, short description, the numbers and the link. */
export function shareText(e: FundEventDTO): string {
  const lines: string[] = [`*${e.title}*`];
  const finished = e.status === 'CLOSED' || e.status === 'CANCELLED';
  // After the event, the report tells the story better than the original appeal
  const desc = whatsappDescription((finished && e.reportSummary) || e.description || '');
  if (desc) lines.push(desc);
  lines.push('');
  const raised = raisedOf(e);
  const percent = e.budget > 0 ? Math.min(100, Math.round((raised / e.budget) * 100)) : 0;
  if (e.status === 'OPEN' && !e.collectionEnded) {
    lines.push(`🎯 Budget: ${rupees(e.budget)}`);
    lines.push(`✅ Raised so far: ${rupees(raised)} (${percent}%)`);
    lines.push(`📅 Donations open till ${formatLocalDate(e.endDate)}`);
    lines.push('');
    lines.push('Any amount left after the event goes to the scholarship fund or towards a future event. Every rupee is shown on our Fund Transparency page.');
    lines.push('');
    lines.push(`👉 See details and donate: ${eventLink(e)}`);
  } else if (e.status === 'CANCELLED') {
    lines.push('This event was cancelled.' + (e.closingNote ? ` ${e.closingNote}` : ''));
    lines.push('');
    lines.push(`👉 Details: ${eventLink(e)}`);
  } else {
    const given = givenOutLines(e);
    if (given.length) lines.push(`🎁 Given out: ${given.join(', ')}`);
    lines.push(`🙏 Thank you! ${rupees(raised)} was raised${e.spent > 0 ? ` and ${rupees(e.spent)} spent` : ''} for this event.`);
    if (e.closingNote) lines.push(e.closingNote);
    lines.push('');
    lines.push(`👉 See how the money was used, with bills: ${eventLink(e)}`);
  }
  lines.push('— SSVM Alumni Support Fund');
  return lines.join('\n');
}

function safeName(title: string, i: number, type: string) {
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return `${title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event'}-${i + 1}.${ext}`;
}

/**
 * Share dialog. On phones the system share sheet sends the images themselves with the message as caption
 * (choose WhatsApp there). Images are downloaded when the dialog opens, because phones only allow sharing
 * straight after a tap. On computers WhatsApp can only take text and the link, so the images can be downloaded
 * to attach by hand.
 */
export const ShareEventDialog: React.FC<{ event: FundEventDTO; onClose: () => void }> = ({ event, onClose }) => {
  const text = useMemo(() => shareText(event), [event]);
  const [files, setFiles] = useState<File[] | null>(event.images?.length ? null : []);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    if (event.images?.length) {
      Promise.all(event.images.map((img, i) => fetchEventImageFile(img.contentUrl!, safeName(event.title, i, img.contentType || ''))))
        .then((list) => {
          if (cancelled) return;
          list.forEach((f) => urls.push(URL.createObjectURL(f)));
          setFiles(list);
          setPreviews(urls);
        })
        .catch(() => !cancelled && setFiles([]));
    }
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [event]);

  const canShareFiles = !!files?.length && typeof navigator.canShare === 'function' && navigator.canShare({ files, text });
  const canShareText = typeof navigator.share === 'function';

  const copy = async (quiet = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (!quiet) setStatus('Message copied. Paste it in WhatsApp.');
      return true;
    } catch {
      if (!quiet) setStatus('Could not copy automatically. Select the message above and copy it.');
      return false;
    }
  };

  const shareWithImages = async () => {
    // Also on the clipboard, in case the app drops the caption when images are shared
    copy(true);
    try {
      await navigator.share({ files: files!, text, title: event.title });
      setStatus('Shared. If the message did not appear with the images, paste it – it is copied.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') setStatus('Sharing did not work here. Use “Open WhatsApp” and attach the downloaded images.');
    }
  };

  const shareTextOnly = async () => {
    try {
      await navigator.share({ text, title: event.title });
    } catch (err: any) {
      if (err?.name !== 'AbortError') setStatus('Sharing did not work here. Use “Open WhatsApp” instead.');
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal share-modal" role="dialog" aria-modal="true" aria-label="Share this event" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share on WhatsApp</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="share-preview" aria-label="What will be shared">
            {event.images?.length ? (
              files === null ? <div className="share-preview-loading">Preparing images…</div> : (
                <div className={`share-preview-images count-${Math.min(previews.length, 4)}`}>
                  {previews.slice(0, 4).map((src, i) => <img key={i} src={src} alt={`Image ${i + 1}`} />)}
                </div>
              )
            ) : null}
            <pre className="share-preview-text">{text}</pre>
          </div>

          <div className="share-actions">
            {canShareFiles && (
              <button type="button" className="btn btn-primary share-main" onClick={shareWithImages}>
                Share with {files!.length === 1 ? 'image' : `${files!.length} images`}
              </button>
            )}
            {!canShareFiles && canShareText && !event.images?.length && (
              <button type="button" className="btn btn-primary share-main" onClick={shareTextOnly}>Share</button>
            )}
            <a className={`btn ${canShareFiles ? 'btn-secondary' : 'btn-primary'} share-whatsapp`} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Open WhatsApp (message and link)
            </a>
            <button type="button" className="btn btn-secondary" onClick={() => copy()}>Copy message</button>
            {!!files?.length && files.map((f, i) => (
              <a key={i} className="btn btn-secondary" href={previews[i]} download={f.name}>
                Download {files.length === 1 ? 'image' : `image ${i + 1}`}
              </a>
            ))}
          </div>
          {status && <p className="share-status" role="status">{status}</p>}
          {!canShareFiles && !!event.images?.length && files !== null && (
            <p className="form-help">
              On this device a website cannot hand images to WhatsApp. Download the image, open WhatsApp, attach it and paste the message.
              On a phone, “Share with image” sends both together.
            </p>
          )}
          {canShareFiles && (
            <p className="form-help">Choose WhatsApp in the list that opens. The message goes with the images; it is also copied, in case you need to paste it.</p>
          )}
          {event.status === 'OPEN' && (
            <p className="form-help">People who open the link need to sign in, as events are for members.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const ShareEventButton: React.FC<{ event: FundEventDTO; className?: string }> = ({ event, className }) => {
  const [open, setOpen] = useState(false);
  if (event.status === 'DRAFT') return null;
  return (
    <>
      <button type="button" className={className ?? 'btn btn-secondary btn-sm'} onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ marginRight: 6, verticalAlign: '-3px' }}>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        Share
      </button>
      {open && <ShareEventDialog event={event} onClose={() => setOpen(false)} />}
    </>
  );
};
