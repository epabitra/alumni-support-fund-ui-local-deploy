import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, AdminUserDTO } from '../../app/modules/auth/core/_user_requests';
import { isValidPhone } from '../../app/modules/auth/core/phone';
import { ROLE_USER, ROLE_ADMIN, ROLE_SERVICE_CENTER, ROLE_VERIFIER, ROLE_AUDITOR } from '../../app/Constants';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/professional-ui.css';
import './admin.css';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const availableRoles = [
    { value: ROLE_USER, label: 'User' },
    { value: ROLE_SERVICE_CENTER, label: 'Service Center' },
    { value: ROLE_VERIFIER, label: 'Verifier' },
    { value: ROLE_AUDITOR, label: 'Auditor' },
    { value: ROLE_ADMIN, label: 'Admin' },
  ];

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllUsers(page, 20);
      let filtered = response.data.content;

      // Client-side search filtering on current page
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        filtered = filtered.filter((user) => (
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.includes(query) ||
          user.login?.toLowerCase().includes(query)
        ));
      }

      setUsers(filtered);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUserDTO) => {
    setEditingUserId(user.id!);
    setSuccess('');
    setError('');
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setError('');
    setSuccess('');
  };

  const handleRoleChange = (userId: number, role: string, checked: boolean) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const currentRoles = user.authorities || [];
        let newRoles: string[];
        
        if (checked) {
          // Add role if not already present
          newRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];
        } else {
          // Remove role
          newRoles = currentRoles.filter(r => r !== role);
        }
        
        return { ...user, authorities: newRoles };
      }
      return user;
    }));
  };

  const handlePhoneChange = (userId: number, phone: string) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, phone } : user)));
  };

  const handleSave = async (user: AdminUserDTO) => {
    try {
      setError('');
      setSuccess('');
      
      // Ensure at least one role is selected
      if (!user.authorities || user.authorities.length === 0) {
        setError('User must have at least one role');
        return;
      }

      if (user.phone?.trim() && !isValidPhone(user.phone)) {
        setError('Please enter a valid mobile number. Outside India, start with the country code, like +1.');
        return;
      }

      await updateUser({ ...user, phone: user.phone?.trim() ?? null });
      setSuccess(`User updated successfully: ${user.firstName} ${user.lastName}`);
      setEditingUserId(null);
      // Reload current page to get fresh data
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Users are already filtered in loadUsers, but we keep this for display
  const filteredUsers = users;

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case ROLE_ADMIN:
        return 'badge badge-danger';
      case ROLE_SERVICE_CENTER:
        return 'badge badge-info';
      case ROLE_VERIFIER:
        return 'badge badge-success';
      case ROLE_AUDITOR:
        return 'badge badge-warning';
      default:
        return 'badge';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleObj = availableRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
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
          title="User Management"
          subtitle="View and manage all users and their roles in the system"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin' },
            { label: 'Users' }
          ]}
        />

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="filters-container">
          <div className="filters-row">
            <div className="form-group">
              <label htmlFor="search" className="form-label">Search Users</label>
              <div className="search-input-group">
                <input
                  id="search"
                  type="text"
                  className="form-input"
                  placeholder="Search by name, email, or login..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    // Reset to first page when searching
                    if (page !== 0) {
                      setPage(0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadUsers();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-card">
          <h2>All Users ({totalElements > 0 ? totalElements : filteredUsers.length})</h2>
          
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No users found</h3>
              <p>{searchTerm ? 'Try adjusting your search criteria' : 'No users in the system'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Login</th>
                    <th>Status</th>
                    <th>Roles</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {editingUserId === user.id ? (
                          <input
                            type="tel"
                            className="form-input"
                            style={{ minWidth: '10rem' }}
                            placeholder="98765 43210"
                            aria-label={`Phone number of ${user.firstName} ${user.lastName}`}
                            value={user.phone ?? ''}
                            onChange={(e) => handlePhoneChange(user.id!, e.target.value)}
                          />
                        ) : user.phone ? (
                          <span style={{ whiteSpace: 'nowrap' }}>{user.phone}</span>
                        ) : (
                          <span className="badge">Not added</span>
                        )}
                      </td>
                      <td>{user.login}</td>
                      <td>
                        <span className={user.activated ? 'status-badge verified' : 'status-badge rejected'}>
                          {user.activated ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <div className="role-checkboxes">
                            {availableRoles.map((role) => (
                              <label key={role.value} className="role-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={user.authorities?.includes(role.value) || false}
                                  onChange={(e) => handleRoleChange(user.id!, role.value, e.target.checked)}
                                  className="role-checkbox"
                                />
                                <span>{role.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="role-badges-group">
                            {user.authorities && user.authorities.length > 0 ? (
                              user.authorities.map((role) => (
                                <span key={role} className={getRoleBadgeClass(role)}>
                                  {getRoleLabel(role)}
                                </span>
                              ))
                            ) : (
                              <span className="badge">No roles</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {editingUserId === user.id ? (
                          <div className="table-actions">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSave(user)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page + 1} of {totalPages} ({totalElements} total users)
              </span>
              <button 
                className="pagination-button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
