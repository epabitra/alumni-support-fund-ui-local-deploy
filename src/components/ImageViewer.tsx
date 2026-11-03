import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import './ImageViewer.css';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;
/** Small photos may be enlarged up to this much when first fitted to the screen */
const MAX_FIT_SCALE = 2;

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
}

interface ImageViewerProps {
  /** Authenticated images; contentUrl is a path such as /api/student-images/{id}/content */
  images: { contentUrl?: string; contentType?: string }[];
  startIndex?: number;
  title?: string;
  /** Used for the downloaded file name, e.g. "student-photo" */
  downloadName?: string;
  onClose: () => void;
}

/** Full-screen image viewer: zoom (buttons, mouse wheel, double-click, + / -), drag to move, previous / next, download. */
const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex = 0, title, downloadName = 'photo', onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Point of the image at the stage centre, kept in place while zooming */
  const centerRef = useRef({ x: 0.5, y: 0.5 });
  const dragRef = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);

  const contentUrl = images[index]?.contentUrl;
  const extension = (images[index]?.contentType?.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  useEffect(() => {
    let cancelled = false;
    let created = '';
    setUrl('');
    setError('');
    setNatural(null);
    setZoom(1);
    fetchStudentImageBlobUrl(contentUrl)
      .then((u) => {
        created = u;
        if (cancelled) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch(() => !cancelled && setError('Could not load this photo.'));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [contentUrl]);

  const computeFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !natural) return;
    setFit(Math.min(stage.clientWidth / natural.w, stage.clientHeight / natural.h, MAX_FIT_SCALE));
  }, [natural]);

  useLayoutEffect(computeFit, [computeFit]);

  useEffect(() => {
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [computeFit]);

  const changeZoom = useCallback((update: (z: number) => number) => {
    const stage = stageRef.current;
    if (stage) {
      centerRef.current = {
        x: (stage.scrollLeft + stage.clientWidth / 2) / (stage.scrollWidth || 1),
        y: (stage.scrollTop + stage.clientHeight / 2) / (stage.scrollHeight || 1)
      };
    }
    setZoom((z) => clampZoom(update(z)));
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollLeft = centerRef.current.x * stage.scrollWidth - stage.clientWidth / 2;
    stage.scrollTop = centerRef.current.y * stage.scrollHeight - stage.clientHeight / 2;
  }, [zoom]);

  // Registered natively: React's wheel listener is passive and could not stop the page from scrolling
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      changeZoom((z) => z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [changeZoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') changeZoom((z) => z + ZOOM_STEP);
      else if (e.key === '-') changeZoom((z) => z - ZOOM_STEP);
      else if (e.key === '0') changeZoom(() => 1);
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [images.length, onClose, changeZoom]);

  // Mouse drag moves a zoomed photo; touch screens scroll the stage natively
  const onPointerDown = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage || e.pointerType !== 'mouse') return;
    dragRef.current = { x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    const drag = dragRef.current;
    if (!stage || !drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    stage.scrollLeft = drag.left - dx;
    stage.scrollTop = drag.top - dy;
  };

  const onStageClick = (e: React.MouseEvent) => {
    // Clicking the dark area around the photo closes the viewer, unless that click ended a drag
    if (e.target === stageRef.current && !dragRef.current?.moved) onClose();
    dragRef.current = null;
  };

  const size = natural ? { width: natural.w * fit * zoom, height: natural.h * fit * zoom } : undefined;

  return createPortal(
    <div className="image-viewer" role="dialog" aria-modal="true" aria-label={title || 'Photo'} onClick={(e) => e.stopPropagation()}>
      <div className="image-viewer-toolbar">
        <div className="image-viewer-title">
          {title}
          {images.length > 1 && <small>Photo {index + 1} of {images.length}</small>}
        </div>
        <div className="image-viewer-controls">
          <button type="button" onClick={() => changeZoom((z) => z - ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">−</button>
          <button type="button" className="image-viewer-zoom" onClick={() => changeZoom(() => 1)} title="Reset zoom" aria-label="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => changeZoom((z) => z + ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">+</button>
          {url && (
            <a className="image-viewer-download" href={url} download={`${downloadName}-${index + 1}.${extension}`}>Download</a>
          )}
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`image-viewer-stage ${zoom > 1 ? 'zoomed' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { if (dragRef.current) dragRef.current = null; }}
        onClick={onStageClick}
        onDoubleClick={() => changeZoom((z) => (z > 1 ? 1 : 2))}
      >
        {error ? (
          <p className="image-viewer-message">{error}</p>
        ) : !url ? (
          <p className="image-viewer-message">Loading…</p>
        ) : (
          <img
            src={url}
            alt={title || 'Photo'}
            draggable={false}
            style={size}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="image-viewer-nav">
          <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>Previous</button>
          <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={index >= images.length - 1}>Next</button>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ImageViewer;
