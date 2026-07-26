import React, { useState, useEffect } from 'react';
import { getServiceCenterStudents } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import { useAuth } from '../../app/modules/auth/core/Auth';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import StudentDetailImages from '../../components/StudentDetailImages';
import '../service-center/service-center.css';

function formatDoB(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const MyApplications: React.FC = () => {
  const { currentUser: _currentUser } = useAuth();
  const [applications, setApplications] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'ALL'>('ALL');
  const [viewDetailsStudent, setViewDetailsStudent] = useState<StudentDTO | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadMyApplications();
  }, [page, searchTerm, statusFilter]);

  const loadMyApplications = async () => {
    try {
      setLoading(true);
      const response = await getServiceCenterStudents(
        page,
        pageSize,
        searchTerm || undefined,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setApplications(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load applications');
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
      <div className="service-center-container">
        <RoleBasedNav />
        <main className="service-center-main">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  const statusCounts = {
    applied: applications.filter(a => a.status === StudentStatus.APPLIED).length,
    verified: applications.filter(a => a.status === StudentStatus.VERIFIED).length,
    selected: applications.filter(a => a.status === StudentStatus.SELECTED).length,
    total: totalElements
  };

  return (
    <div className="service-center-container">
      <RoleBasedNav />
      <main className="service-center-main">
        <PageHeader
          title="My Applications"
          subtitle="Track and manage all student applications you have registered"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Service Center' },
            { label: 'My Applications' }
          ]}
          variant="service-center"
          actions={
            <button className="btn btn-secondary" onClick={() => loadMyApplications()}>
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
            <div className="stat-card-value">{statusCounts.applied}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-label">Verified</div>
            <div className="stat-card-value">{statusCounts.verified}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🎓</div>
            <div className="stat-card-label">Selected</div>
            <div className="stat-card-value">{statusCounts.selected}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📊</div>
            <div className="stat-card-label">Total</div>
            <div className="stat-card-value">{statusCounts.total}</div>
          </div>
        </div>

        <div className="filters-container">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => {
                  setPage(0);
                  setStatusFilter(event.target.value as StudentStatus | 'ALL');
                }}
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
              <label className="form-label">Total</label>
              <div className="form-help">{totalElements} applications</div>
            </div>
          </div>
        </div>

        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗂️</div>
              <h3>No Applications Found</h3>
              <p>You haven't registered any students yet.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <h3 className="application-title">{app.studentName}</h3>
                  <span className={getStatusBadgeClass(app.status)}>
                    {app.status || 'N/A'}
                  </span>
                </div>
                <div className="application-details">
                  <div className="detail-item">
                    <span className="detail-label">School</span>
                    <span className="detail-value">{app.schoolName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class Level</span>
                    <span className="detail-value">{app.classLevel || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Academic Year</span>
                    <span className="detail-value">{app.academicYear || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Roll Number</span>
                    <span className="detail-value">{app.rollNumber || '-'}</span>
                  </div>
                </div>
                <div className="application-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-view-details"
                    onClick={() => setViewDetailsStudent(app)}
                  >
                    View details
                  </button>
                </div>
              </div>
            ))
          )}
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

        {viewDetailsStudent && (
          <div className="modal-overlay" onClick={() => setViewDetailsStudent(null)}>
            <div className="modal-content student-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Application details</h2>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewDetailsStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyApplications;
