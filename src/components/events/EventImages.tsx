import React, { useEffect, useRef, useState } from 'react';
import type { ScholarshipReceiptDTO } from '../../app/modules/scholarship/core/_models';
import { fetchStudentImageBlobUrl } from '../../app/modules/scholarship/core/_requests';
import { addEventImages, makeEventCover, removeEventImage, type EventImageKind } from '../../app/modules/events/core/_requests';
import ImageViewer from '../ImageViewer';

/** Must match scholarship.upload.max-event-images / event-image-max-file-size-bytes on the server */
export const MAX_EVENT_IMAGES = 6;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');

/** Each image is fetched once per visit, however often it is shown */
const blobCache = new Map<string, Promise<string>>();
export function loadEventImage(contentUrl: string): Promise<string> {
  let p = blobCache.get(contentUrl);
  if (!p) {
    p = fetchStudentImageBlobUrl(contentUrl);
    p.catch(() => blobCache.delete(contentUrl));
    blobCache.set(contentUrl, p);
  }
  return p;
}

function useImageSrc(contentUrl?: string): string {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let cancelled = false;
    setSrc('');
    if (contentUrl) loadEventImage(contentUrl).then((s) => !cancelled && setSrc(s)).catch(() => {});
    return () => { cancelled = true; };
  }, [contentUrl]);
  return src;
}

/**
 * Phone photos are often 4–8 MB; a banner does not need that. Large photos are shrunk to at most
 * 1920 px on the long side as JPEG, which also keeps WhatsApp shares quick. Small images are kept as they are.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error(`${file.name} is not a JPG, PNG or WebP image.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`${file.name} could not be read as an image.`);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (file.size <= 1.5 * 1024 * 1024 && longest <= 2400) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, 1920 / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error(`${file.name} could not be prepared.`);
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}

/** Checks and shrinks chosen files; throws a message the admin can act on */
export async function prepareEventImages(files: File[], existingCount: number, max: number = MAX_EVENT_IMAGES): Promise<File[]> {
  if (existingCount + files.length > max) throw new Error(`You can add at most ${max} images here.`);
  const out: File[] = [];
  for (const f of files) {
    const small = await shrinkImage(f);
    if (small.size > MAX_UPLOAD_BYTES) throw new Error(`${f.name} is too large even after shrinking.`);
    out.push(small);
  }
  return out;
}

/** Cover image for cards; a soft placeholder when the event has no image */
export const EventCover: React.FC<{ images?: ScholarshipReceiptDTO[]; title: string }> = ({ images, title }) => {
  const src = useImageSrc(images?.[0]?.contentUrl);
  if (!images?.length) {
    return <div className="event-cover placeholder" aria-hidden><span>{title.slice(0, 1).toUpperCase()}</span></div>;
  }
  return <div className="event-cover">{src ? <img src={src} alt={`Banner of ${title}`} /> : null}</div>;
};

const Thumb: React.FC<{ image: ScholarshipReceiptDTO; alt: string }> = ({ image, alt }) => {
  const src = useImageSrc(image.contentUrl);
  return src ? <img src={src} alt={alt} /> : <span className="event-thumb-loading" aria-hidden />;
};

/** Big banner with thumbnails; clicking opens the zoom viewer */
export const EventGallery: React.FC<{ images: ScholarshipReceiptDTO[]; title: string }> = ({ images, title }) => {
  const [index, setIndex] = useState(0);
  const [viewing, setViewing] = useState(false);
  const current = images[Math.min(index, images.length - 1)];
  const src = useImageSrc(current?.contentUrl);
  if (!images.length) return null;
  return (
    <div className="event-gallery">
      <button type="button" className="event-gallery-main" onClick={() => setViewing(true)} aria-label={`Open image ${index + 1} of ${images.length} full size`}>
        {src ? <img src={src} alt={`${title} – image ${index + 1}`} /> : <span className="event-thumb-loading" aria-hidden />}
      </button>
      {images.length > 1 && (
        <div className="event-gallery-thumbs" role="list">
          {images.map((img, i) => (
            <button key={img.id} type="button" role="listitem" className={`event-gallery-thumb ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-pressed={i === index}>
              <Thumb image={img} alt="" />
            </button>
          ))}
        </div>
      )}
      {viewing && <ImageViewer images={images} startIndex={index} title={title} downloadName="event-banner" onClose={() => setViewing(false)} />}
    </div>
  );
};

export const MAX_EVENT_PHOTOS = 12;

/** Admin: add, remove and choose the cover image. kind PHOTO = photos from the event (report), no cover. */
export const EventImageManager: React.FC<{
  eventId: number;
  images: ScholarshipReceiptDTO[];
  onChange: (images: ScholarshipReceiptDTO[]) => void;
  kind?: EventImageKind;
}> = ({ eventId, images, onChange, kind = 'BANNER' }) => {
  const banner = kind === 'BANNER';
  const max = banner ? MAX_EVENT_IMAGES : MAX_EVENT_PHOTOS;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<ScholarshipReceiptDTO[]>) => {
    setBusy(true);
    setError('');
    try {
      onChange(await action());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) run(async () => addEventImages(eventId, await prepareEventImages(files, images.length, max), kind));
  };

  return (
    <div className="event-image-manager">
      <div className="event-image-grid">
        {images.map((img, i) => (
          <div className="event-image-tile" key={img.id}>
            <Thumb image={img} alt={`Image ${i + 1}`} />
            {!banner ? null : i === 0 ? <span className="event-image-cover-badge">Cover</span> : (
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => run(() => makeEventCover(eventId, img.id))}>Make cover</button>
            )}
            <button type="button" className="event-image-remove" disabled={busy} aria-label={`Remove image ${i + 1}`}
              onClick={() => window.confirm(banner ? 'Remove this image from the event?' : 'Remove this photo?') && run(() => removeEventImage(eventId, img.id))}>×</button>
          </div>
        ))}
        {images.length < max && (
          <button type="button" className="event-image-add" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Uploading…' : banner ? '+ Add images' : '+ Add photos'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={onFiles} />
      <p className="form-help">
        {banner
          ? <>JPG, PNG or WebP, up to {MAX_EVENT_IMAGES} images. The first one is the cover on cards and in shares. Large photos are shrunk automatically.</>
          : <>Photos from the day, up to {MAX_EVENT_PHOTOS}. Members see them in the event report. Large photos are shrunk automatically.</>}
      </p>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
    </div>
  );
};
