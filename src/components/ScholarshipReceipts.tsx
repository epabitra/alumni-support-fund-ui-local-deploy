import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import type { ScholarshipReceiptDTO } from '../app/modules/scholarship/core/_models';
import './ScholarshipReceipts.css';

/** Must match scholarship.upload.* on the server */
export const MAX_RECEIPTS_PER_PAYMENT = 5;
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
/** One upload request must stay under the server's 20MB multipart request limit */
const MAX_RECEIPTS_TOTAL_BYTES = 19 * 1024 * 1024;
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const RECEIPT_ACCEPT = RECEIPT_TYPES.join(',');

function formatFileSize(bytes?: number): string {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(contentType?: string): boolean {
  return contentType === 'application/pdf';
}

/** Returns an error message for the chosen receipt files, or '' if they are fine. */
export function validateReceiptFiles(files: File[], existingCount: number = 0): string {
  if (existingCount + files.length > MAX_RECEIPTS_PER_PAYMENT) {
    return `A payment can have at most ${MAX_RECEIPTS_PER_PAYMENT} receipts.`;
  }
  for (const f of files) {
    // Some mobile browsers leave type empty; the server checks the real file content either way
    const typeOk = f.type ? RECEIPT_TYPES.includes(f.type) : /\.(jpe?g|png|webp|pdf)$/i.test(f.name);
    if (!typeOk) return `${f.name}: please use a JPG, PNG or WebP image, or a PDF.`;
    if (f.size === 0) return `${f.name} is empty.`;
    if (f.size > MAX_RECEIPT_BYTES) return `${f.name} is too large (${formatFileSize(f.size)}). Max ${formatFileSize(MAX_RECEIPT_BYTES)} per file.`;
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_RECEIPTS_TOTAL_BYTES) {
    return `Selected files are ${formatFileSize(total)} in total. Please upload at most ${formatFileSize(MAX_RECEIPTS_TOTAL_BYTES)} at a time.`;
  }
  return '';
}

interface ReceiptFilePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Receipts the payment already has (counts toward the limit) */
  existingCount?: number;
  disabled?: boolean;
}

/** Choose receipt files to upload; shows the chosen files with a remove button and any validation error. */
export const ReceiptFilePicker: React.FC<ReceiptFilePickerProps> = ({ files, onChange, existingCount = 0, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const error = validateReceiptFiles(files, existingCount);
  const canAddMore = existingCount + files.length < MAX_RECEIPTS_PER_PAYMENT;

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length) onChange([...files, ...picked]);
  };

  return (
    <div className="sp-receipt-picker">
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        multiple
        hidden
        onChange={handleSelect}
        disabled={disabled}
      />
      {files.length > 0 && (
        <ul className="sp-receipt-picked-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className="sp-receipt-picked-item">
              <span className="sp-receipt-icon" aria-hidden>{isPdf(f.type) ? '📄' : '🧾'}</span>
              <span className="sp-receipt-picked-name" title={f.name}>{f.name}</span>
              <span className="sp-receipt-picked-size">{formatFileSize(f.size)}</span>
              <button
                type="button"
                className="sp-receipt-remove"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !canAddMore}
      >
        {files.length > 0 ? 'Add more files' : 'Choose receipt files'}
      </button>
      <div className="sp-receipt-hint">
        JPG, PNG, WebP or PDF · up to {formatFileSize(MAX_RECEIPT_BYTES)} each · max {MAX_RECEIPTS_PER_PAYMENT} per payment
      </div>
      {error && <div className="sp-receipt-error">{error}</div>}
    </div>
  );
};

interface ReceiptListProps {
  receipts: ScholarshipReceiptDTO[];
  /** When given, each receipt shows a remove button (admin) */
  onRemove?: (receipt: ScholarshipReceiptDTO) => void;
  removingId?: number | null;
  emptyText?: string;
}

/** Receipt chips; clicking one opens it in a viewer. */
export const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, onRemove, removingId, emptyText }) => {
  const [viewIndex, setViewIndex] = useState<number | null>(null);

  if (receipts.length === 0) {
    return emptyText ? <span className="sp-receipt-empty">{emptyText}</span> : null;
  }

  return (
    <>
      <div className="sp-receipt-list">
        {receipts.map((r, i) => (
          <span key={r.id} className="sp-receipt-chip">
            <button type="button" className="sp-receipt-chip-open" onClick={() => setViewIndex(i)} title={r.fileName || undefined}>
              <span className="sp-receipt-icon" aria-hidden>{isPdf(r.contentType) ? '📄' : '🧾'}</span>
              Receipt {i + 1}
            </button>
            {onRemove && (
              <button
                type="button"
                className="sp-receipt-remove"
                onClick={() => onRemove(r)}
                disabled={removingId === r.id}
                aria-label={`Remove receipt ${i + 1}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {viewIndex !== null && receipts[viewIndex] && (
        <ReceiptViewer
          receipts={receipts}
          index={viewIndex}
          onIndexChange={setViewIndex}
          onClose={() => setViewIndex(null)}
        />
      )}
    </>
  );
};

interface ReceiptViewerProps {
  receipts: ScholarshipReceiptDTO[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ receipts, index, onIndexChange, onClose }) => {
  const receipt = receipts[index];
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let created = '';
    setUrl('');
    setError('');
    fetchStudentImageBlobUrl(receipt.contentUrl)
      .then((u) => {
        created = u;
        if (cancelled) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch(() => !cancelled && setError('Could not load this receipt.'));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [receipt.contentUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < receipts.length - 1) onIndexChange(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, receipts.length, onClose, onIndexChange]);

  const pdf = isPdf(receipt.contentType);
  const downloadName = receipt.fileName || `receipt-${receipt.id}${pdf ? '.pdf' : '.jpg'}`;

  return createPortal(
    <div className="sp-receipt-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Payment receipt">
      <div className="sp-receipt-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="sp-receipt-viewer-header">
          <span className="sp-receipt-viewer-title">
            Receipt {index + 1} of {receipts.length}
            {receipt.fileName && <small title={receipt.fileName}>{receipt.fileName}</small>}
          </span>
          <button type="button" className="sp-receipt-viewer-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sp-receipt-viewer-body">
          {error ? (
            <p className="sp-receipt-error">{error}</p>
          ) : !url ? (
            <p className="sp-receipt-hint">Loading…</p>
          ) : pdf ? (
            <iframe src={url} title={`Receipt ${index + 1}`} className="sp-receipt-viewer-pdf" />
          ) : (
            <img src={url} alt={`Receipt ${index + 1}`} className="sp-receipt-viewer-img" />
          )}
        </div>
        <div className="sp-receipt-viewer-footer">
          <div className="sp-receipt-viewer-nav">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onIndexChange(index - 1)} disabled={index === 0}>
              Previous
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onIndexChange(index + 1)} disabled={index >= receipts.length - 1}>
              Next
            </button>
          </div>
          {url && (
            <div className="sp-receipt-viewer-nav">
              <a className="btn btn-secondary btn-sm" href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
              <a className="btn btn-primary btn-sm" href={url} download={downloadName}>Download</a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
