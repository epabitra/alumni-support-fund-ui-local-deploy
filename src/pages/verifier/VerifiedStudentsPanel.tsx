import React, { useEffect, useState } from 'react';
import { getVerifiedStudents } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO } from '../../app/modules/scholarship/core/_models';
import EditFeesModal from '../../components/EditFeesModal';
import { formatINR } from '../../components/ScholarshipPaymentModal';
import LoadingSpinner from '../../components/LoadingSpinner';

const PAGE_SIZE = 20;

/** Verified and selected students, with an option to correct their fees. */
const VerifiedStudentsPanel: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<StudentDTO | null>(null);

  useEffect(() => {
    load();
  }, [page, searchTerm]);

  const load = async () => {
    try {
      setLoading(true);
      const response = await getVerifiedStudents(page, PAGE_SIZE, searchTerm || undefined);
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load verified students');
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    setPage(0);
    setSearchTerm(searchInput);
  };

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="alert alert-info">
        Correct a fee entered wrongly at verification, or add a missed fee such as travel. The new total cannot be less than
        what is already paid. Every change is saved with its reason and shown in the student's payment history.
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
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              />
              <button className="btn btn-secondary btn-sm search-btn" onClick={applySearch} type="button">
                Search
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Verified &amp; selected</label>
            <div className="form-help">{totalElements} students</div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Class</th>
                <th>Status</th>
                <th>Joining</th>
                <th>Annual</th>
                <th>Books</th>
                <th>Extra</th>
                <th>Travel</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <h3>No verified students</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.studentName}</td>
                    <td>{s.schoolName}</td>
                    <td>{s.classLevel ?? '-'}</td>
                    <td>{s.status}</td>
                    <td>{formatINR(s.joiningFees ?? 0)}</td>
                    <td>{formatINR(s.annualFees ?? 0)}</td>
                    <td>{formatINR(s.booksPrice ?? 0)}</td>
                    <td>{formatINR(s.extraPrice ?? 0)}</td>
                    <td>{formatINR(s.travelFees ?? 0)}</td>
                    <td><strong>{formatINR(s.totalCost ?? 0)}</strong></td>
                    <td>{formatINR(s.totalPaid ?? 0)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSuccess(''); setEditing(s); }}
                      >
                        Edit fees
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </button>
          <span className="form-help" style={{ margin: 0 }}>Page {page + 1} of {totalPages}</span>
          <button type="button" className="btn btn-secondary" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            Next
          </button>
        </div>
      )}

      {editing && (
        <EditFeesModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setSuccess(`Fees updated for ${editing.studentName}.`);
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
};

export default VerifiedStudentsPanel;
