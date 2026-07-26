import React, { useState, useEffect } from 'react';
import { getAllStudents, selectStudent } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import './admin.css';

const MAX_SELECTION_PER_ACADEMIC_YEAR = 2;

function formatFee(value: number | undefined | null): string {
  if (value == null || value === undefined) return '—';
  return typeof value === 'number' ? value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
}

const AdminSelection: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadVerifiedStudents();
  }, [searchTerm]);

  const loadVerifiedStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents(
        0,
        100,
        searchTerm || undefined,
        StudentStatus.VERIFIED
      );
      setStudents(response.data.content);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (student: StudentDTO) => {
    const atOrOverLimit = student.selectedCountInAcademicYear != null && student.selectedCountInAcademicYear >= MAX_SELECTION_PER_ACADEMIC_YEAR;
    const confirmMessage = atOrOverLimit
      ? `Maximum ${MAX_SELECTION_PER_ACADEMIC_YEAR} students have already been selected for academic year ${student.academicYear || 'this year'}. Do you want to select this student anyway?`
      : 'Are you sure you want to select this student?';
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await selectStudent(student.id!);
      setSuccess('Student selected successfully');
      loadVerifiedStudents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to select student');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <RoleBasedNav />
        <main className="admin-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Student Selection"
          subtitle="Select verified students for scholarship support based on merit and need"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Selection' }
          ]}
          variant="admin"
          actions={
            <button className="btn btn-secondary" onClick={() => loadVerifiedStudents()}>
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
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-label">Verified & Available</div>
            <div className="stat-card-value">{students.length}</div>
          </div>
        </div>

        <div className="alert alert-info">
          <strong>Selection Guidelines:</strong> Only verified students can be selected. There is a maximum limit per academic year. Review each student carefully before selection.
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
                  onBlur={() => setSearchTerm(searchInput)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSearchTerm(searchInput);
                  }}
                />
                <button 
                  className="btn btn-secondary btn-sm search-btn"
                  onClick={() => setSearchTerm(searchInput)}
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Available</label>
              <div className="form-help">{students.length} verified students</div>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-wrapper">
            <table className="table">
              <thead>
              <tr>
                <th>Name</th>
                <th>School</th>
                <th>Class</th>
                <th>Academic Year</th>
                <th>Roll Number</th>
                <th>Joining Fees</th>
                <th>Annual Fees</th>
                <th>Books Price</th>
                <th>Extra Price</th>
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <h3>No verified students available</h3>
                      <p>Verified students will appear here for selection.</p>
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
                    <td>{formatFee(student.joiningFees)}</td>
                    <td>{formatFee(student.annualFees)}</td>
                    <td>{formatFee(student.booksPrice)}</td>
                    <td>{formatFee(student.extraPrice)}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelect(student)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSelection;
