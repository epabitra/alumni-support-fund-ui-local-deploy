import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import type { StudentImageDTO } from '../app/modules/scholarship/core/_models';

interface StudentDetailImagesProps {
  images?: StudentImageDTO[];
  className?: string;
  /** When true, show images at top (e.g. in view-details modal) with larger thumbnails */
  atTop?: boolean;
}

const StudentDetailImages: React.FC<StudentDetailImagesProps> = ({
  images,
  className = '',
  atTop = false
}) => {
  const [blobUrls, setBlobUrls] = useState<Record<number, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const revokeRef = useRef<string[]>([]);

  useEffect(() => {
    if (!images || images.length === 0) return;
    revokeRef.current = [];
    Promise.all(
      images.map(async (img) => {
        if (!img.id || !img.contentUrl) return null;
        try {
          const url = await fetchStudentImageBlobUrl(img.contentUrl);
          revokeRef.current.push(url);
          return { id: img.id, url };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const next: Record<number, string> = {};
      results.forEach((r) => r && (next[r.id] = r.url));
      setBlobUrls(next);
    });
    return () => {
      revokeRef.current.forEach((u) => URL.revokeObjectURL(u));
      revokeRef.current = [];
      setBlobUrls({});
    };
  }, [images?.length, images?.map((i) => i.id).join(',')]);

  const handleDownload = (url: string, index: number) => {
    const ext = (images?.[index]?.contentType?.split('/')[1]) || 'jpg';
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-photo-${index + 1}.${ext === 'jpeg' ? 'jpg' : ext}`;
    a.click();
  };

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    if (lightboxIndex !== null) {
      document.addEventListener('keydown', onEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  if (!images?.length) return null;

  const lightboxUrl = lightboxIndex !== null && images[lightboxIndex]?.id
    ? blobUrls[images[lightboxIndex].id!]
    : null;

  const lightboxNode =
    lightboxIndex !== null && lightboxUrl ? (
      <div
        className="image-lightbox-overlay"
        onClick={() => setLightboxIndex(null)}
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
      >
        <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="image-lightbox-close"
            aria-label="Close"
            onClick={() => setLightboxIndex(null)}
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Student"
            className="image-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="image-lightbox-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownload(lightboxUrl, lightboxIndex)}
            >
              Download
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setLightboxIndex(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className={`student-detail-images ${atTop ? 'student-detail-images--at-top' : ''} ${className}`}>
        <div className="detail-row">
          <span className="detail-label">Pass photo(s)</span>
          <span className="detail-value">
            <div className="student-images-thumbs">
              {images.map((img, index) =>
                blobUrls[img.id!] ? (
                  <button
                    key={img.id}
                    type="button"
                    className="student-detail-photo-wrap"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <img
                      src={blobUrls[img.id!]}
                      alt={`Student ${index + 1}`}
                      className="student-detail-photo"
                    />
                  </button>
                ) : (
                  <span key={img.id} className="student-image-loading">…</span>
                )
              )}
            </div>
            <p className="student-images-hint">Click a photo to view full size or download.</p>
          </span>
        </div>
      </div>
      {lightboxNode && createPortal(lightboxNode, document.body)}
    </>
  );
};

export default StudentDetailImages;
