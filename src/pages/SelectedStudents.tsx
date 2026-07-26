import React, { useState, useEffect } from 'react';
import { getSelectedStudents } from '../app/modules/scholarship/core/_requests';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import { StudentDTO } from '../app/modules/scholarship/core/_models';
import RoleBasedNav from '../components/RoleBasedNav';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/dashboard.css';
import './SelectedStudents.css';

const PAGE_SIZE = 10;

function formatFee(value: number | undefined | null): string {
  if (value == null || value === undefined) return '—';
  return typeof value === 'number'
    ? value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '—';
}

const StudentCardPhoto: React.FC<{ contentUrl?: string }> = ({ contentUrl }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const blobUrlRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!contentUrl) {
      setLoaded(true);
      setSrc(null);
      return;
    }
    setLoaded(false);
    setSrc(null);
    let cancelled = false;
    fetchStudentImageBlobUrl(contentUrl)
      .then((url) => {
        if (!cancelled) {
          blobUrlRef.current = url;
          setSrc(url);
          setLoaded(true);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [contentUrl]);

  if (!contentUrl || !src) {
    return (
      <div className="selected-student-card-photo selected-student-card-photo-placeholder">
        {!loaded ? (
          <span className="photo-loading">…</span>
        ) : (
          <span className="photo-placeholder-icon">👤</span>
        )}
      </div>
    );
  }
  return (
    <div className="selected-student-card-photo">
      <img src={src} alt="" />
    </div>
  );
};

const StudentCard: React.FC<{ student: StudentDTO }> = ({ student }) => {
  const firstImage = student.images && student.images.length > 0 ? student.images[0] : undefined;
  const contentUrl = firstImage?.contentUrl;

  return (
    <article className="selected-student-card">
      <StudentCardPhoto contentUrl={contentUrl} />
      <div className="selected-student-card-body">
        <h3 className="selected-student-card-name">{student.studentName || '—'}</h3>
        <dl className="selected-student-card-details">
          <div className="detail-row">
            <dt>Class</dt>
            <dd>{student.classLevel ?? '—'}</dd>
          </div>
          <div className="detail-row">
            <dt>School</dt>
            <dd>{student.schoolName || '—'}</dd>
          </div>
          <div className="detail-row">
            <dt>Academic year</dt>
            <dd>{student.academicYear || '—'}</dd>
          </div>
          <div className="detail-row">
            <dt>Roll no.</dt>
            <dd>{student.rollNumber || '—'}</dd>
          </div>
        </dl>
        <div className="selected-student-card-fees">
          <div className="fee-row">
            <span className="fee-label">Joining fees</span>
            <span className="fee-value">{formatFee(student.joiningFees)}</span>
          </div>
          <div className="fee-row">
            <span className="fee-label">Annual fees</span>
            <span className="fee-value">{formatFee(student.annualFees)}</span>
          </div>
          <div className="fee-row">
            <span className="fee-label">Books price</span>
            <span className="fee-value">{formatFee(student.booksPrice)}</span>
          </div>
          <div className="fee-row">
            <span className="fee-label">Extra price</span>
            <span className="fee-value">{formatFee(student.extraPrice)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

const SelectedStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPage();
  }, [page, searchTerm]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await getSelectedStudents(page, PAGE_SIZE, searchTerm || undefined);
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load selected students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="selected-students-container">
      <RoleBasedNav />
      <main className="selected-students-main">
        <PageHeader
          title="Selected Students"
          subtitle="Scholarship recipients selected for support"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Selected Students' }
          ]}
          variant="default"
          actions={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm(searchInput);
                setPage(0);
              }}
            >
              Search
            </button>
          }
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="selected-students-toolbar">
          <div className="search-row">
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, school, roll number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setSearchTerm(searchInput), setPage(0))}
            />
          </div>
          <p className="selected-students-count">
            {totalElements} selected student{totalElements !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="selected-students-loading">
            <LoadingSpinner />
          </div>
        ) : students.length === 0 ? (
          <div className="selected-students-empty">
            <div className="empty-icon">🎓</div>
            <h3>No selected students</h3>
            <p>Selected students will appear here.</p>
          </div>
        ) : (
          <>
            <div className="selected-students-grid">
              {students.map((s) => (
                <StudentCard key={s.id!} student={s} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="selected-students-pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SelectedStudents;
