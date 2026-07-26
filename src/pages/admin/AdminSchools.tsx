import React, { useState, useEffect } from 'react';
import { getAllSchools, createSchool, updateSchool, updateSchoolActive } from '../../app/modules/scholarship/core/_requests';
import { SchoolDTO } from '../../app/modules/scholarship/core/_models';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../admin/admin.css';

const AdminSchools: React.FC = () => {
  const [schools, setSchools] = useState<SchoolDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [formData, setFormData] = useState<SchoolDTO>({
    name: '',
    code: '',
    address: '',
    district: '',
    state: ''
  });

  useEffect(() => {
    loadSchools();
  }, [searchTerm, statusFilter]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await getAllSchools(0, 100);
      let filtered = response.data.content;

      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        filtered = filtered.filter((school) => (
          school.name?.toLowerCase().includes(query) ||
          school.code?.toLowerCase().includes(query) ||
          school.district?.toLowerCase().includes(query) ||
          school.state?.toLowerCase().includes(query)
        ));
      }

      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((school) => (
          statusFilter === 'ACTIVE' ? school.active : !school.active
        ));
      }

      setSchools(filtered);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (editingSchool?.id) {
        await updateSchool(editingSchool.id, formData);
      } else {
        await createSchool(formData);
      }
      setShowForm(false);
      setEditingSchool(null);
      setFormData({ name: '', code: '', address: '', district: '', state: '' });
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save school');
    }
  };

  const handleEdit = (school: SchoolDTO) => {
    setEditingSchool(school);
    setFormData(school);
    setShowForm(true);
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateSchoolActive(id, !currentActive);
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update school status');
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

  const activeSchools = schools.filter(s => s.active).length;
  const inactiveSchools = schools.filter(s => !s.active).length;

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Manage Schools"
          subtitle="Create and manage partner schools across the program"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Schools' }
          ]}
          variant="admin"
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => loadSchools()}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowForm(true);
                  setEditingSchool(null);
                  setFormData({ name: '', code: '', address: '', district: '', state: '' });
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Add School
              </button>
            </>
          }
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon">🏫</div>
            <div className="stat-card-label">Total Schools</div>
            <div className="stat-card-value">{schools.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-label">Active</div>
            <div className="stat-card-value">{activeSchools}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⏸️</div>
            <div className="stat-card-label">Inactive</div>
            <div className="stat-card-value">{inactiveSchools}</div>
          </div>
        </div>

        <div className="filters-container">
          <div className="filters-row">
            <div className="form-group">
              <label className="form-label">Search</label>
              <div className="search-input-group">
                <input
                  className="form-input"
                  placeholder="Search by name, code, district, or state"
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
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total</label>
              <div className="form-help">{schools.length} schools</div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingSchool ? 'Edit School' : 'Add School'}</h2>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label required">School Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">School Code</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      maxLength={50}
                      disabled={!!editingSchool}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-textarea"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.district || ''}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                <th>Code</th>
                <th>Name</th>
                <th>District</th>
                <th>State</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏫</div>
                      <h3>No schools found</h3>
                      <p>Add a school to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td>{school.code}</td>
                    <td>{school.name}</td>
                    <td>{school.district || '-'}</td>
                    <td>{school.state || '-'}</td>
                    <td>
                      <span className={`status-badge ${school.active ? 'active' : 'inactive'}`}>
                        {school.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleEdit(school)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleToggleActive(school.id!, school.active || false)}
                        >
                          {school.active ? 'Deactivate' : 'Activate'}
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
      </main>
    </div>
  );
};

export default AdminSchools;
