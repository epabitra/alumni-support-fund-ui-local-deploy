import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../../app/modules/scholarship/core/_requests';
import { StudentDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import './admin.css';

const AdminReviews: React.FC = () => {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDTO | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    academicYear: '',
    attendanceRemarks: '',
    performanceRemarks: '',
    continuationApproved: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadSelectedStudents();
  }, [searchTerm]);

  const loadSelectedStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents(
        0,
        100,
        searchTerm || undefined,
        StudentStatus.SELECTED
      );
      setStudents(response.data.content);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (student: StudentDTO) => {
    setSelectedStudent(student);
    setReviewData({
      academicYear: student.academicYear || '',
      attendanceRemarks: '',
      performanceRemarks: '',
      continuationApproved: false
    });
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call when endpoint is available
    alert('Annual review functionality will be implemented when backend endpoint is ready');
    setShowReviewForm(false);
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
          title="Annual Reviews"
          subtitle="Conduct annual performance reviews for selected scholarship students"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Reviews' }
          ]}
          variant="admin"
          actions={
            <button className="btn btn-secondary" onClick={() => loadSelectedStudents()}>
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
            <div className="stat-card-icon">🎓</div>
            <div className="stat-card-label">Selected Students</div>
            <div className="stat-card-value">{students.length}</div>
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
              <label className="form-label">Selected</label>
              <div className="form-help">{students.length} students</div>
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
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No selected students found</h3>
                        <p>Selected students will appear here for annual review.</p>
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
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleReview(student)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </table>
          </div>
        </div>

        {showReviewForm && selectedStudent && (
          <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Annual Review - {selectedStudent.studentName}</h2>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label className="form-label required">Academic Year</label>
                    <input
                      className="form-input"
                      type="text"
                      value={reviewData.academicYear}
                      onChange={(e) => setReviewData({ ...reviewData, academicYear: e.target.value })}
                      required
                      maxLength={20}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attendance Remarks</label>
                    <textarea
                      className="form-textarea"
                      value={reviewData.attendanceRemarks}
                      onChange={(e) => setReviewData({ ...reviewData, attendanceRemarks: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Performance Remarks</label>
                    <textarea
                      className="form-textarea"
                      value={reviewData.performanceRemarks}
                      onChange={(e) => setReviewData({ ...reviewData, performanceRemarks: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={reviewData.continuationApproved}
                        onChange={(e) => setReviewData({ ...reviewData, continuationApproved: e.target.checked })}
                      />
                      {' '}Approve Continuation
                    </label>
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">Save Review</button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowReviewForm(false)}
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

export default AdminReviews;
