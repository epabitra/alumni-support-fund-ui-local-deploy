import React, { useEffect, useRef, useState } from 'react';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import type { StudentImageDTO } from '../app/modules/scholarship/core/_models';
import ImageViewer from './ImageViewer';

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

  if (!images?.length) return null;


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
            <p className="student-images-hint">Click a photo to zoom in or download.</p>
          </span>
        </div>
      </div>
      {lightboxIndex !== null && (
        <ImageViewer
          images={images}
          startIndex={lightboxIndex}
          title="Student photo"
          downloadName="student-photo"
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

export default StudentDetailImages;
