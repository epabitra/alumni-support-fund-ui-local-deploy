import React, { useState, useEffect } from 'react';
import { blankToUndefined, getActiveSchools, getAllStudents, getStudentDetails, updateStudent } from '../../app/modules/scholarship/core/_requests';
import { SchoolDTO, StudentDTO, StudentStatus } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import './admin.css';

type TextFieldKey = 'parentName' | 'parentOccupation' | 'parentPhone' | 'parentEmail'
  | 'district' | 'state' | 'pincode' | 'phone' | 'email';

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
  const [editingStudent, setEditingStudent] = useState<StudentDTO | null>(null);
  const [formData, setFormData] = useState<StudentDTO>({ studentName: '', schoolId: 0 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<SchoolDTO[]>([]);

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

  const handleEdit = async (student: StudentDTO) => {
    // Saving replaces every field, so the form must start from the student's full details
    try {
      setError('');
      const { data } = await getStudentDetails(student.id!);
      setEditingStudent(data);
      setFormData(data);
      setFormError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student details');
      return;
    }
    if (schools.length === 0) {
      try {
        const response = await getActiveSchools(0, 1000);
        setSchools(response.data.content);
      } catch (err: any) {
        setFormError(err.response?.data?.message || 'Failed to load schools');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = {
      ...formData,
      studentName: formData.studentName.trim(),
      rollNumber: formData.rollNumber?.trim(),
      academicYear: formData.academicYear?.trim(),
      parentName: blankToUndefined(formData.parentName),
      parentRelation: blankToUndefined(formData.parentRelation),
      parentOccupation: blankToUndefined(formData.parentOccupation),
      parentPhone: blankToUndefined(formData.parentPhone),
      parentEmail: blankToUndefined(formData.parentEmail),
      financialRemarks: blankToUndefined(formData.financialRemarks),
      address: blankToUndefined(formData.address),
      district: blankToUndefined(formData.district),
      state: blankToUndefined(formData.state),
      pincode: blankToUndefined(formData.pincode),
      phone: blankToUndefined(formData.phone),
      email: blankToUndefined(formData.email)
    };
    if (!student.studentName || !student.rollNumber || !student.academicYear) {
      setFormError('Student name, roll number and academic year are required');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      await updateStudent(editingStudent!.id!, student);
      setEditingStudent(null);
      loadStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.fieldErrors?.[0]?.message || 'Failed to save student');
    } finally {
      setSaving(false);
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

  // Keep the student's current school selectable even if it has since been deactivated
  const schoolOptions: SchoolDTO[] = editingStudent && !schools.some((s) => s.id === editingStudent.schoolId)
    ? [{ id: editingStudent.schoolId, name: editingStudent.schoolName || '', code: editingStudent.schoolCode || '' }, ...schools]
    : schools;

  const renderTextField = (
    key: TextFieldKey,
    label: string,
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`edit-${key}`}>{label}</label>
      <input
        id={`edit-${key}`}
        className="form-input"
        type="text"
        value={formData[key] || ''}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        {...inputProps}
      />
    </div>
  );

  const phoneProps = { type: 'tel', maxLength: 10, pattern: '[0-9]{10}', title: 'Enter 10 digits' };
  const sectionTitleStyle = { margin: '1.5rem 0 0.75rem', fontSize: '1rem' };

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

        {editingStudent && (
          <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Student</h2>
              </div>
              <div className="modal-body">
                <p className="form-help">Status, fees and payments are not changed here.</p>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-studentName">Student Name</label>
                    <input
                      id="edit-studentName"
                      className="form-input"
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-dateOfBirth">Date of Birth</label>
                    <input
                      id="edit-dateOfBirth"
                      className="form-input"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-gender">Gender</label>
                    <select
                      id="edit-gender"
                      className="form-select"
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-classLevel">Class Level</label>
                    <input
                      id="edit-classLevel"
                      className="form-input"
                      type="number"
                      min={1}
                      max={10}
                      step={1}
                      value={formData.classLevel ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        classLevel: e.target.value === '' ? undefined : Number(e.target.value)
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-rollNumber">Roll Number</label>
                    <input
                      id="edit-rollNumber"
                      className="form-input"
                      type="text"
                      value={formData.rollNumber || ''}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-academicYear">Academic Year</label>
                    <input
                      id="edit-academicYear"
                      className="form-input"
                      type="text"
                      placeholder="e.g., 2024-2025"
                      value={formData.academicYear || ''}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      required
                      maxLength={20}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required" htmlFor="edit-schoolId">School</label>
                    <select
                      id="edit-schoolId"
                      className="form-select"
                      value={formData.schoolId}
                      onChange={(e) => setFormData({ ...formData, schoolId: Number(e.target.value) })}
                      required
                    >
                      {schoolOptions.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="form-help">The details below are optional here. Students registered earlier may not have them yet.</p>
                  <h3 style={sectionTitleStyle}>Parent/Guardian</h3>
                  {renderTextField('parentName', 'Parent/Guardian Name', { maxLength: 255 })}
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-parentRelation">Relation</label>
                    <select
                      id="edit-parentRelation"
                      className="form-select"
                      value={formData.parentRelation || ''}
                      onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                    >
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {renderTextField('parentOccupation', 'Occupation', { maxLength: 100 })}
                  {renderTextField('parentPhone', 'Parent Phone', phoneProps)}
                  {renderTextField('parentEmail', 'Parent Email', { type: 'email', maxLength: 254 })}
                  <h3 style={sectionTitleStyle}>Financial Condition</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-annualIncome">Annual Income (₹)</label>
                    <input
                      id="edit-annualIncome"
                      className="form-input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={formData.annualIncome ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        annualIncome: e.target.value === '' ? undefined : Number(e.target.value)
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-familyMembers">Family Members</label>
                    <input
                      id="edit-familyMembers"
                      className="form-input"
                      type="number"
                      min={1}
                      step={1}
                      value={formData.familyMembers ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        familyMembers: e.target.value === '' ? undefined : Number(e.target.value)
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-financialRemarks">Financial Remarks</label>
                    <textarea
                      id="edit-financialRemarks"
                      className="form-input"
                      rows={3}
                      maxLength={1000}
                      value={formData.financialRemarks || ''}
                      onChange={(e) => setFormData({ ...formData, financialRemarks: e.target.value })}
                    />
                  </div>
                  <h3 style={sectionTitleStyle}>Address &amp; Contact</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-address">Address</label>
                    <textarea
                      id="edit-address"
                      className="form-input"
                      rows={3}
                      maxLength={500}
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  {renderTextField('district', 'District', { maxLength: 100 })}
                  {renderTextField('state', 'State', { maxLength: 100 })}
                  {renderTextField('pincode', 'Pincode', { maxLength: 6, pattern: '[0-9]{6}', title: 'Enter 6 digits' })}
                  {renderTextField('phone', 'Contact Phone', phoneProps)}
                  {renderTextField('email', 'Email', { type: 'email', maxLength: 254 })}
                  {formError && <div className="alert alert-danger">{formError}</div>}
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingStudent(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(student)}>
                        Edit
                      </button>
                    </td>
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
