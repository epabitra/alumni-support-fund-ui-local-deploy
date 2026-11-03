import React, { useState, useEffect } from 'react';
import { getSelectedStudents, addStudentScholarshipPayment } from '../app/modules/scholarship/core/_requests';
import { fetchStudentImageBlobUrl } from '../app/modules/scholarship/core/_requests';
import { StudentDTO } from '../app/modules/scholarship/core/_models';
import { getFundBalance } from '../app/modules/payment/core/_requests';
import { useAuth } from '../app/modules/auth/core/Auth';
import { ROLE_ADMIN } from '../app/Constants';
import ScholarshipPaymentModal, { formatINR, ScholarshipPaymentInput } from '../components/ScholarshipPaymentModal';
import ScholarshipPaymentHistoryModal from '../components/ScholarshipPaymentHistoryModal';
import EditFeesModal from '../components/EditFeesModal';
import ImageViewer from '../components/ImageViewer';
import { useDebounced } from '../components/DataTable';
import RoleBasedNav from '../components/RoleBasedNav';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/dashboard.css';
import './SelectedStudents.css';

const PAGE_SIZE = 10;

const FEE_ROWS: { key: 'joiningFees' | 'annualFees' | 'booksPrice' | 'extraPrice' | 'travelFees'; label: string }[] = [
  { key: 'joiningFees', label: 'Joining fees' },
  { key: 'annualFees', label: 'Annual fees' },
  { key: 'booksPrice', label: 'Books' },
  { key: 'extraPrice', label: 'Extra' },
  { key: 'travelFees', label: 'Travel' }
];

/** Rupees without trailing .00 */
function formatAmount(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function initialsOf(name?: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function paymentStatus(student: StudentDTO): { label: string; className: string } {
  const cost = student.totalCost ?? 0;
  const paid = student.totalPaid ?? 0;
  if (cost > 0 && paid >= cost) return { label: 'Fully paid', className: 'paid' };
  if (paid > 0) return { label: 'Partially paid', className: 'partial' };
  return { label: 'Not paid yet', className: 'unpaid' };
}

const StudentPhoto: React.FC<{ contentUrl?: string; studentName?: string; onOpen: () => void }> = ({ contentUrl, studentName, onOpen }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    if (!contentUrl) return;
    let cancelled = false;
    let created: string | null = null;
    fetchStudentImageBlobUrl(contentUrl)
      .then((url) => {
        created = url;
        if (cancelled) URL.revokeObjectURL(url);
        else setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [contentUrl]);

  if (!src) {
    return <div className="ss-photo ss-photo-initials" aria-hidden>{initialsOf(studentName)}</div>;
  }
  return (
    <button type="button" className="ss-photo ss-photo-btn" onClick={onOpen} aria-label={`View photo of ${studentName || 'student'}`}>
      <img src={src} alt="" />
      <span className="ss-photo-zoom" aria-hidden>🔍</span>
    </button>
  );
};

interface StudentCardProps {
  student: StudentDTO;
  onViewPayments: () => void;
  /** Admin only: pay the next installment */
  onAddPayment?: () => void;
  /** Admin only: correct the fees */
  onEditFees?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onViewPayments, onAddPayment, onEditFees }) => {
  const [viewingPhoto, setViewingPhoto] = useState(false);
  const [showFees, setShowFees] = useState(false);

  const cost = student.totalCost ?? 0;
  const paid = student.totalPaid ?? 0;
  const remaining = student.remainingAmount ?? 0;
  const percent = cost > 0 ? Math.min(100, Math.round((paid / cost) * 100)) : 0;
  const status = paymentStatus(student);
  const meta = [
    student.classLevel != null ? `Class ${student.classLevel}` : null,
    student.academicYear,
    student.rollNumber ? `Roll no. ${student.rollNumber}` : null
  ].filter(Boolean);
  const feesId = `ss-fees-${student.id}`;

  return (
    <article className="ss-card">
      <div className="ss-card-main">
        <StudentPhoto contentUrl={student.images?.[0]?.contentUrl} studentName={student.studentName} onOpen={() => setViewingPhoto(true)} />

        <div className="ss-identity">
          <h3 className="ss-name">{student.studentName || '—'}</h3>
          {student.schoolName && <div className="ss-school">{student.schoolName}</div>}
          {meta.length > 0 && <div className="ss-meta">{meta.join(' · ')}</div>}
        </div>

        <div className="ss-progress">
          <div className="ss-progress-head">
            <span className="ss-progress-paid">
              <strong>{formatAmount(paid)}</strong> paid of {formatAmount(cost)}
            </span>
            <span className={`ss-status ${status.className}`}>{status.label}</span>
          </div>
          <div className="ss-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Scholarship paid">
            <div className={`ss-progress-fill ${status.className}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="ss-progress-foot">
            <span>{percent}% paid</span>
            <span>{remaining > 0 ? `${formatAmount(remaining)} remaining` : 'Nothing remaining'}</span>
          </div>
        </div>
      </div>

      {showFees && (
        <dl className="ss-fees" id={feesId}>
          {FEE_ROWS.map(({ key, label }) => (
            <div className="ss-fee" key={key}>
              <dt>{label}</dt>
              <dd>{formatAmount(student[key] ?? 0)}</dd>
            </div>
          ))}
          <div className="ss-fee ss-fee-total">
            <dt>Total cost</dt>
            <dd>{formatAmount(cost)}</dd>
          </div>
        </dl>
      )}

      <div className="ss-card-footer">
        <button
          type="button"
          className="ss-fees-toggle"
          aria-expanded={showFees}
          aria-controls={feesId}
          onClick={() => setShowFees((v) => !v)}
        >
          Fee breakdown
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="ss-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onViewPayments}>
            Payment history
          </button>
          {onEditFees && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onEditFees}>
              Edit fees
            </button>
          )}
          {onAddPayment && remaining > 0 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onAddPayment}>
              Add payment
            </button>
          )}
        </div>
      </div>

      {viewingPhoto && (
        <ImageViewer
          images={student.images ?? []}
          title={student.studentName}
          downloadName="student-photo"
          onClose={() => setViewingPhoto(false)}
        />
      )}
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
  const [success, setSuccess] = useState('');
  const [historyStudent, setHistoryStudent] = useState<StudentDTO | null>(null);
  const [studentToPay, setStudentToPay] = useState<StudentDTO | null>(null);
  const [feesStudent, setFeesStudent] = useState<StudentDTO | null>(null);
  const [fundBalance, setFundBalance] = useState<number | null>(null);

  const { currentUser } = useAuth();
  const isAdmin = currentUser?.authorities?.includes(ROLE_ADMIN) || false;
  const debouncedSearch = useDebounced(searchInput);

  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
      setPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    loadPage();
  }, [page, searchTerm]);

  const loadFundBalance = async () => {
    try {
      const data = await getFundBalance();
      setFundBalance(data.totalBalance);
    } catch {
      setFundBalance(null);
    }
  };

  const openPayModal = (student: StudentDTO) => {
    setError('');
    setSuccess('');
    setFundBalance(null);
    setStudentToPay(student);
    loadFundBalance();
  };

  // Errors propagate to the modal, which shows them and stays open
  const handlePay = async ({ amount, remarks, paidOn, receipts }: ScholarshipPaymentInput) => {
    if (!studentToPay) return;
    const summary = await addStudentScholarshipPayment(studentToPay.id!, { amount, remarks, paidOn }, receipts);
    setStudentToPay(null);
    setSuccess(
      `${formatINR(amount)} paid to ${summary.studentName}. Total paid ${formatINR(summary.totalPaid)} of ${formatINR(summary.totalCost)}, remaining ${formatINR(summary.remainingAmount)}.`
    );
    loadPage();
  };

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
          subtitle="Scholarship recipients and how much of their support has been paid"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Selected Students' }
          ]}
          variant="default"
        />

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="ss-toolbar">
          <div className="ss-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              className="ss-search-input custom-input"
              placeholder="Search by name, school or roll number"
              aria-label="Search selected students"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <p className="ss-count">
            {totalElements} {totalElements === 1 ? 'student' : 'students'}
          </p>
        </div>

        {loading ? (
          <div className="ss-loading">
            <LoadingSpinner />
          </div>
        ) : students.length === 0 ? (
          <div className="ss-empty">
            <div className="ss-empty-icon" aria-hidden>🎓</div>
            <h3>{searchTerm ? 'No students match your search' : 'No selected students yet'}</h3>
            <p>{searchTerm ? 'Try a different name, school or roll number.' : 'Selected students will appear here.'}</p>
          </div>
        ) : (
          <>
            <div className="ss-list">
              {students.map((s) => (
                <StudentCard
                  key={s.id!}
                  student={s}
                  onViewPayments={() => setHistoryStudent(s)}
                  onAddPayment={isAdmin ? () => openPayModal(s) : undefined}
                  onEditFees={isAdmin ? () => { setSuccess(''); setFeesStudent(s); } : undefined}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="ss-pagination">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="ss-pagination-info">
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

        {studentToPay && (
          <ScholarshipPaymentModal
            title="Add scholarship payment"
            studentName={`${studentToPay.studentName} · Class ${studentToPay.classLevel ?? '—'} · ${studentToPay.schoolName ?? ''}`}
            totalCost={studentToPay.totalCost ?? 0}
            totalPaid={studentToPay.totalPaid ?? 0}
            fundBalance={fundBalance}
            allowZero={false}
            confirmLabel="Pay now"
            onSubmit={handlePay}
            onClose={() => setStudentToPay(null)}
          />
        )}

        {feesStudent && (
          <EditFeesModal
            student={feesStudent}
            onClose={() => setFeesStudent(null)}
            onSaved={() => {
              setSuccess(`Fees updated for ${feesStudent.studentName}.`);
              setFeesStudent(null);
              loadPage();
            }}
          />
        )}

        {historyStudent && (
          <ScholarshipPaymentHistoryModal
            student={historyStudent}
            canManage={isAdmin}
            onClose={() => setHistoryStudent(null)}
          />
        )}
      </main>
    </div>
  );
};

export default SelectedStudents;
