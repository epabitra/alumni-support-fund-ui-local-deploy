import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getPendingStudents, getFeeDefaults, getStudentDetailsForVerifier, verifyStudent } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO, VerificationStatus, StudentVerificationDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import StudentDetailImages from '../../components/StudentDetailImages';
import VerifiedStudentsPanel from './VerifiedStudentsPanel';
import '../verifier/verifier.css';

function formatDoB(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getStatusBadgeClass(status?: StudentStatus): string {
  switch (status) {
    case StudentStatus.SELECTED: return 'status-badge selected';
    case StudentStatus.VERIFIED: return 'status-badge verified';
    case StudentStatus.APPLIED: return 'status-badge applied';
    case StudentStatus.REJECTED: return 'status-badge rejected';
    case StudentStatus.DISCONTINUED: return 'status-badge discontinued';
    default: return 'status-badge';
  }
}

const PendingVerifications: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDTO | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [viewDetailsStudent, setViewDetailsStudent] = useState<StudentDTO | null>(null);
  const [detailsError, setDetailsError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tab, setTab] = useState<'pending' | 'verified'>('pending');
  const pageSize = 20;

  useEffect(() => {
    loadPendingStudents();
  }, [page, searchTerm]);

  const loadPendingStudents = async () => {
    try {
      setLoading(true);
      const response = await getPendingStudents(page, pageSize, searchTerm || undefined);
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (student: StudentDTO) => {
    setViewDetailsStudent(student);
    setDetailsError('');
    try {
      const { data } = await getStudentDetailsForVerifier(student.id!);
      setViewDetailsStudent((current) => (current?.id === student.id ? data : current));
    } catch {
      setDetailsError('Could not load the family and contact details. Please try again.');
    }
  };

  const validationSchema = Yup.object({
    verificationStatus: Yup.string()
      .oneOf([VerificationStatus.VALID, VerificationStatus.INVALID])
      .required('Verification status is required'),
    remarks: Yup.string()
      .max(1000, 'Remarks must not exceed 1000 characters'),
    joiningFees: Yup.number().min(0, 'Must be 0 or more').optional(),
    annualFees: Yup.number()
      .min(0, 'Must be 0 or more')
      .when('verificationStatus', ([status], schema) =>
        status === VerificationStatus.VALID
          ? schema.required('Annual fees is required when verification is Valid')
          : schema.optional()
      ),
    booksPrice: Yup.number().min(0, 'Must be 0 or more').optional(),
    extraPrice: Yup.number().min(0, 'Must be 0 or more').optional(),
    travelFees: Yup.number().min(0, 'Must be 0 or more').optional()
  });

  const formik = useFormik<StudentVerificationDTO>({
    initialValues: {
      studentId: 0,
      verificationStatus: VerificationStatus.VALID,
      remarks: '',
      joiningFees: 0,
      annualFees: 0,
      booksPrice: 0,
      extraPrice: 0,
      travelFees: 0
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedStudent) return;

      const payload: StudentVerificationDTO = {
        ...values,
        joiningFees: Number(values.joiningFees) || 0,
        annualFees: Number(values.annualFees) ?? 0,
        booksPrice: Number(values.booksPrice) || 0,
        extraPrice: Number(values.extraPrice) || 0,
        travelFees: Number(values.travelFees) || 0
      };
      try {
        setError('');
        await verifyStudent(selectedStudent.id!, payload);
        setShowVerificationForm(false);
        setSelectedStudent(null);
        loadPendingStudents();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to verify student');
      }
    }
  });

  const handleVerify = async (student: StudentDTO) => {
    setSelectedStudent(student);
    setShowVerificationForm(true);
    const classLevel = student.classLevel ?? undefined;
    try {
      const { data } = await getFeeDefaults(classLevel);
      formik.setValues({
        studentId: student.id!,
        verificationStatus: VerificationStatus.VALID,
        remarks: '',
        joiningFees: data?.joiningFees ?? 0,
        annualFees: data?.annualFees ?? 0,
        booksPrice: data?.booksPrice ?? 0,
        extraPrice: data?.extraPrice ?? 0,
        travelFees: 0
      });
    } catch {
      formik.setValues({
        studentId: student.id!,
        verificationStatus: VerificationStatus.VALID,
        remarks: '',
        joiningFees: 0,
        annualFees: 0,
        booksPrice: 0,
        extraPrice: 0,
        travelFees: 0
      });
    }
  };

  if (loading) {
    return (
      <div className="verifier-container">
        <RoleBasedNav />
        <main className="verifier-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="verifier-container">
      <RoleBasedNav />
      <main className="verifier-main">
        <PageHeader
          title="Pending Verifications"
          subtitle="Review and verify student applications for accuracy and completeness"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Verifier' },
            { label: 'Pending' }
          ]}
          variant="verifier"
          actions={
            <button className="btn btn-secondary" onClick={() => loadPendingStudents()}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          }
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="verifier-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'pending'}
            className={tab === 'pending' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab('pending')}
          >
            Pending verification
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'verified'}
            className={tab === 'verified' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setTab('verified')}
          >
            Verified &amp; selected (edit fees)
          </button>
        </div>

        {tab === 'verified' ? (
          <VerifiedStudentsPanel />
        ) : (
        <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon">⏳</div>
            <div className="stat-card-label">Pending</div>
            <div className="stat-card-value">{totalElements}</div>
          </div>
        </div>

        <div className="alert alert-info">
          <strong>Verification Guidelines:</strong> Review each application carefully. Verify all information is accurate and complete. Mark as VALID or INVALID accordingly. You cannot modify student core data.
        </div>

        <div className="filters-container">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Search</label>
              <div className="search-input-group">
                <input
                  className="form-input"
                  placeholder="Search by name, school, or roll number"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onBlur={() => { setPage(0); setSearchTerm(searchInput); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setPage(0); setSearchTerm(searchInput); }
                  }}
                />
                <button 
                  className="btn btn-secondary btn-sm search-btn"
                  onClick={() => { setPage(0); setSearchTerm(searchInput); }}
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Pending</label>
              <div className="form-help">{totalElements} applications</div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Class</th>
                <th>Academic Year</th>
                <th>Roll Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <h3>No pending verifications</h3>
                      <p>All applications are up to date.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentName}</td>
                    <td>{student.schoolName}</td>
                    <td>{student.classLevel || '-'}</td>
                    <td>{student.academicYear || '-'}</td>
                    <td>{student.rollNumber || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(student)}
                        >
                          View details
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVerify(student)}
                        >
                          Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="form-help" style={{ margin: 0 }}>
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

        {viewDetailsStudent && (
          <div className="modal-overlay" onClick={() => setViewDetailsStudent(null)}>
            <div className="modal-content student-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Student application details</h2>
                <button type="button" className="modal-close" aria-label="Close" onClick={() => setViewDetailsStudent(null)}>×</button>
              </div>
              <div className="modal-body">
                {viewDetailsStudent.images && viewDetailsStudent.images.length > 0 && (
                  <div className="student-details-modal-images">
                    <StudentDetailImages images={viewDetailsStudent.images} atTop />
                  </div>
                )}
                <div className="student-details-grid student-details-grid--two-cols">
                  <div className="detail-row">
                    <span className="detail-label">Student name</span>
                    <span className="detail-value">{viewDetailsStudent.studentName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of birth</span>
                    <span className="detail-value">{formatDoB(viewDetailsStudent.dateOfBirth as string)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender</span>
                    <span className="detail-value">{viewDetailsStudent.gender || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Class level</span>
                    <span className="detail-value">{viewDetailsStudent.classLevel ?? '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Roll number</span>
                    <span className="detail-value">{viewDetailsStudent.rollNumber || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Academic year</span>
                    <span className="detail-value">{viewDetailsStudent.academicYear || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">School</span>
                    <span className="detail-value">{viewDetailsStudent.schoolName || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">School code</span>
                    <span className="detail-value">{viewDetailsStudent.schoolCode || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={getStatusBadgeClass(viewDetailsStudent.status)}>
                        {viewDetailsStudent.status || 'N/A'}
                      </span>
                    </span>
                  </div>
                </div>
                <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1rem' }}>Family &amp; contact</h3>
                {detailsError && <div className="alert alert-danger">{detailsError}</div>}
                <div className="student-details-grid student-details-grid--two-cols">
                  {([
                    ['Parent/Guardian', viewDetailsStudent.parentName],
                    ['Relation', viewDetailsStudent.parentRelation],
                    ['Occupation', viewDetailsStudent.parentOccupation],
                    ['Parent phone', viewDetailsStudent.parentPhone],
                    ['Parent email', viewDetailsStudent.parentEmail],
                    ['Annual income', viewDetailsStudent.annualIncome != null ? `₹${viewDetailsStudent.annualIncome.toLocaleString('en-IN')}` : undefined],
                    ['Family members', viewDetailsStudent.familyMembers],
                    ['Financial remarks', viewDetailsStudent.financialRemarks],
                    ['Address', viewDetailsStudent.address],
                    ['District', viewDetailsStudent.district],
                    ['State', viewDetailsStudent.state],
                    ['Pincode', viewDetailsStudent.pincode],
                    ['Contact phone', viewDetailsStudent.phone],
                    ['Email', viewDetailsStudent.email]
                  ] as [string, string | number | undefined][]).map(([label, value]) => (
                    <div className="detail-row" key={label}>
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewDetailsStudent(null)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={() => { setViewDetailsStudent(null); handleVerify(viewDetailsStudent); }}>Verify this student</button>
              </div>
            </div>
          </div>
        )}

        {showVerificationForm && selectedStudent && (
          <div className="modal-overlay" onClick={() => setShowVerificationForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Verify Student - {selectedStudent.studentName}</h2>
              </div>
              <div className="modal-body">
                <form onSubmit={formik.handleSubmit}>
                  <div className="form-group">
                    <label className="form-label required">Verification Status</label>
                    <select
                      className="form-select"
                      name="verificationStatus"
                      value={formik.values.verificationStatus}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value={VerificationStatus.VALID}>VALID</option>
                      <option value={VerificationStatus.INVALID}>INVALID</option>
                    </select>
                    {formik.touched.verificationStatus && formik.errors.verificationStatus && (
                      <span className="field-error">{formik.errors.verificationStatus}</span>
                    )}
                  </div>

                  <div className="fee-fields-grid">
                    <div className="form-group">
                      <label className="form-label">Joining Fees</label>
                      <input
                        type="number"
                        className="form-input"
                        name="joiningFees"
                        min={0}
                        step={0.01}
                        value={formik.values.joiningFees ?? ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.joiningFees && formik.errors.joiningFees && (
                        <span className="field-error">{formik.errors.joiningFees}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className={formik.values.verificationStatus === VerificationStatus.VALID ? 'form-label required' : 'form-label'}>
                        Annual Fees
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        name="annualFees"
                        min={0}
                        step={0.01}
                        value={formik.values.annualFees ?? ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.annualFees && formik.errors.annualFees && (
                        <span className="field-error">{formik.errors.annualFees}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Books Price</label>
                      <input
                        type="number"
                        className="form-input"
                        name="booksPrice"
                        min={0}
                        step={0.01}
                        value={formik.values.booksPrice ?? ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.booksPrice && formik.errors.booksPrice && (
                        <span className="field-error">{formik.errors.booksPrice}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Extra Price</label>
                      <input
                        type="number"
                        className="form-input"
                        name="extraPrice"
                        min={0}
                        step={0.01}
                        value={formik.values.extraPrice ?? ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.extraPrice && formik.errors.extraPrice && (
                        <span className="field-error">{formik.errors.extraPrice}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Travel Fees (auto / rickshaw)</label>
                      <input
                        type="number"
                        className="form-input"
                        name="travelFees"
                        min={0}
                        step={0.01}
                        value={formik.values.travelFees ?? ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.travelFees && formik.errors.travelFees && (
                        <span className="field-error">{formik.errors.travelFees}</span>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-textarea"
                      name="remarks"
                      rows={5}
                      value={formik.values.remarks || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter verification remarks..."
                      maxLength={1000}
                    />
                    {formik.touched.remarks && formik.errors.remarks && (
                      <span className="field-error">{formik.errors.remarks}</span>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">Submit Verification</button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowVerificationForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PendingVerifications;
