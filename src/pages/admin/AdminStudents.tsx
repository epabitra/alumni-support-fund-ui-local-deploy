import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import './admin.css';

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadStudents();
  }, [page, filterStatus, searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents(
        page,
        20,
        searchTerm || undefined,
        filterStatus === 'ALL' ? undefined : filterStatus
      );
      setStudents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status?: StudentStatus) => {
    switch (status) {
      case StudentStatus.SELECTED:
        return 'status-badge selected';
      case StudentStatus.VERIFIED:
        return 'status-badge verified';
      case StudentStatus.APPLIED:
        return 'status-badge applied';
      case StudentStatus.REJECTED:
        return 'status-badge rejected';
      case StudentStatus.DISCONTINUED:
        return 'status-badge discontinued';
      default:
        return 'status-badge';
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

  const getStatusCounts = () => {
    return {
      applied: students.filter(s => s.status === StudentStatus.APPLIED).length,
      verified: students.filter(s => s.status === StudentStatus.VERIFIED).length,
      selected: students.filter(s => s.status === StudentStatus.SELECTED).length,
      total: students.length
    };
  };

  const counts = getStatusCounts();

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="All Students"
          subtitle="Monitor all applications and student statuses across the program"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Students' }
          ]}
          variant="admin"
          actions={
            <button className="btn btn-secondary" onClick={() => loadStudents()}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          }
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon">📝</div>
            <div className="stat-card-label">Applied</div>
            <div className="stat-card-value">{counts.applied}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-label">Verified</div>
            <div className="stat-card-value">{counts.verified}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🎓</div>
            <div className="stat-card-label">Selected</div>
            <div className="stat-card-value">{counts.selected}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">👥</div>
            <div className="stat-card-label">Total Students</div>
            <div className="stat-card-value">{totalElements}</div>
          </div>
        </div>

        <div className="filters-container">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => {
                  setPage(0);
                  setFilterStatus(e.target.value as StudentStatus | 'ALL');
                }}
                className="form-select"
              >
                <option value="ALL">All</option>
                <option value={StudentStatus.APPLIED}>Applied</option>
                <option value={StudentStatus.VERIFIED}>Verified</option>
                <option value={StudentStatus.SELECTED}>Selected</option>
                <option value={StudentStatus.REJECTED}>Rejected</option>
                <option value={StudentStatus.DISCONTINUED}>Discontinued</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Search</label>
              <div className="search-input-group">
                <input
                  className="form-input"
                  placeholder="Search by name, school, or roll number"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onBlur={() => {
                    setPage(0);
                    setSearchTerm(searchInput);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPage(0);
                      setSearchTerm(searchInput);
                    }
                  }}
                />
                <button 
                  className="btn btn-secondary btn-sm search-btn"
                  onClick={() => {
                    setPage(0);
                    setSearchTerm(searchInput);
                  }}
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Total</label>
              <div className="form-help">{totalElements} students</div>
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
                <th>Status</th>
                <th>Roll Number</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🎓</div>
                      <h3>No students found</h3>
                      <p>Try adjusting filters or search terms.</p>
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
                    <td>
                      <span className={getStatusBadgeClass(student.status)}>
                        {student.status || 'N/A'}
                      </span>
                    </td>
                    <td>{student.rollNumber || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-button"
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="pagination-info">Page {page + 1} of {totalPages}</span>
            <button 
              className="pagination-button"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
              disabled={page >= totalPages - 1}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStudents;
