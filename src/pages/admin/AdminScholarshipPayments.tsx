import React, { useState, useEffect } from 'react';
import {
  getSelectedStudents,
  addStudentScholarshipPayment
} from '../../app/modules/scholarship/core/_requests';
import { StudentDTO } from '../../app/modules/scholarship/core/_models';
import { getFundBalance } from '../../app/modules/payment/core/_requests';
import ScholarshipPaymentModal, { formatINR, ScholarshipPaymentInput } from '../../components/ScholarshipPaymentModal';
import ScholarshipPaymentHistoryModal from '../../components/ScholarshipPaymentHistoryModal';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import './admin.css';

const PAGE_SIZE = 20;

function paymentStatusBadge(student: StudentDTO) {
  const cost = student.totalCost ?? 0;
  const paid = student.totalPaid ?? 0;
  if (cost > 0 && paid >= cost) return <span className="badge badge-success">Fully paid</span>;
  if (paid > 0) return <span className="badge badge-warning">Partially paid</span>;
  return <span className="badge badge-danger">Not paid</span>;
}

const AdminScholarshipPayments: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fundBalance, setFundBalance] = useState<number | null>(null);

  const [studentToPay, setStudentToPay] = useState<StudentDTO | null>(null);
  const [historyStudent, setHistoryStudent] = useState<StudentDTO | null>(null);

  useEffect(() => {
    loadStudents();
  }, [page, searchTerm]);

  useEffect(() => {
    loadFundBalance();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getSelectedStudents(page, PAGE_SIZE, searchTerm || undefined);
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load selected students');
    } finally {
      setLoading(false);
    }
  };

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
    loadStudents();
    loadFundBalance();
  };

  const applySearch = () => {
    setSearchTerm(searchInput);
    setPage(0);
  };

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Scholarship Payments"
          subtitle="Pay selected students in parts and track how much is paid and remaining"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Scholarship Payments' }
          ]}
          variant="admin"
          actions={
            <button className="btn btn-secondary" onClick={() => { loadStudents(); loadFundBalance(); }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          }
        />

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon">💰</div>
            <div className="stat-card-label">Current Fund Balance</div>
            <div className="stat-card-value">{fundBalance != null ? formatINR(fundBalance) : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🎓</div>
            <div className="stat-card-label">Selected Students</div>
            <div className="stat-card-value">{totalElements}</div>
          </div>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applySearch();
                  }}
                />
                <button className="btn btn-secondary btn-sm search-btn" onClick={applySearch} type="button">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Class</th>
                    <th>Academic Year</th>
                    <th>Total Cost</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="empty-state">
                          <div className="empty-state-icon">🎓</div>
                          <h3>No selected students</h3>
                          <p>Students selected from the Selection page will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.studentName}</td>
                        <td>{student.schoolName}</td>
                        <td>{student.classLevel ?? '-'}</td>
                        <td>{student.academicYear || '-'}</td>
                        <td className="amount-cell-num">{formatINR(student.totalCost ?? 0)}</td>
                        <td className="amount-cell-num">{formatINR(student.totalPaid ?? 0)}</td>
                        <td className="amount-cell-num"><strong>{formatINR(student.remainingAmount ?? 0)}</strong></td>
                        <td>{paymentStatusBadge(student)}</td>
                        <td>
                          <div className="scholarship-actions-cell">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openPayModal(student)}
                              disabled={(student.remainingAmount ?? 0) <= 0}
                              title={(student.remainingAmount ?? 0) <= 0 ? 'Fully paid' : undefined}
                            >
                              Pay
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setHistoryStudent(student)}>
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="pagination-button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </button>
            <span className="pagination-info">Page {page + 1} of {totalPages}</span>
            <button className="pagination-button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              Next
            </button>
          </div>
        )}

        {studentToPay && (
          <ScholarshipPaymentModal
            title="Pay scholarship installment"
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

        {historyStudent && (
          <ScholarshipPaymentHistoryModal student={historyStudent} canManage onClose={() => setHistoryStudent(null)} />
        )}
      </main>
    </div>
  );
};

export default AdminScholarshipPayments;
