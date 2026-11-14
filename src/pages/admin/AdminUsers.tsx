import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, updateUser, type AdminUserDTO } from '../../app/modules/auth/core/_user_requests';
import { isValidPhone } from '../../app/modules/auth/core/phone';
import { ROLE_USER, ROLE_ADMIN, ROLE_SERVICE_CENTER, ROLE_VERIFIER, ROLE_AUDITOR } from '../../app/Constants';
import RoleBasedNav from '../../components/RoleBasedNav';
import PageHeader from '../../components/PageHeader';
import { DataTablePagination, DataTableToolbar, SortHeader, type TableQuery } from '../../components/DataTable';
import { formatPhone, initials, memberName } from '../../components/admin/MemberPicker';
import { formatRupees } from '../../components/admin/amountWords';
import '../../styles/professional-ui.css';
import '../../styles/payment.css';
import './admin.css';
import '../../components/admin/admin-payments.css';

const ROLES = [
  { value: ROLE_USER, label: 'User' },
  { value: ROLE_SERVICE_CENTER, label: 'Service Center' },
  { value: ROLE_VERIFIER, label: 'Verifier' },
  { value: ROLE_AUDITOR, label: 'Auditor' },
  { value: ROLE_ADMIN, label: 'Admin' }
];

const ROLE_BADGE: Record<string, string> = {
  [ROLE_ADMIN]: 'badge badge-danger',
  [ROLE_SERVICE_CENTER]: 'badge badge-info',
  [ROLE_VERIFIER]: 'badge badge-success',
  [ROLE_AUDITOR]: 'badge badge-warning'
};

const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role;
const formatDay = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

type Query = TableQuery & { role: string; status: string; reload: number };
const DEFAULT_QUERY: Query = { page: 0, size: 25, search: '', from: '', to: '', sortBy: 'joined', sortDir: 'desc', role: '', status: '', reload: 0 };

/** Users with search (name, mobile, email), role / status / joined-date filters, sorting and paging, all on the server */
const AdminUsers: React.FC = () => {
  const [query, setQuery] = useState<Query>(DEFAULT_QUERY);
  const [rows, setRows] = useState<AdminUserDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<AdminUserDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);

  const update = (patch: Partial<Query>) => setQuery((q) => ({ ...q, ...patch }));
  const onSort = (sortBy: string, sortDir: 'asc' | 'desc') => update({ sortBy, sortDir, page: 0 });

  useEffect(() => {
    if (query.from && query.to && query.from > query.to) return;
    const id = ++requestId.current;
    setLoading(true);
    getAllUsers(query.page, query.size, {
      search: query.search, role: query.role, status: query.status, from: query.from, to: query.to,
      sortBy: query.sortBy as 'name' | 'email' | 'joined', sortDir: query.sortDir
    })
      .then((res) => {
        if (id !== requestId.current) return;
        setRows(res.data.content);
        setTotalElements(res.data.totalElements);
        setTotalPages(res.data.totalPages || Math.ceil(res.data.totalElements / query.size));
        setError('');
      })
      .catch((e) => id === requestId.current && setError(e?.response?.data?.message || 'Failed to load users.'))
      .finally(() => id === requestId.current && setLoading(false));
  }, [JSON.stringify(query)]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRole = (role: string, checked: boolean) => {
    if (!editing) return;
    const current = editing.authorities ?? [];
    setEditing({ ...editing, authorities: checked ? Array.from(new Set([...current, role])) : current.filter((r) => r !== role) });
  };

  const save = async () => {
    if (!editing) return;
    setError('');
    setSuccess('');
    if (!editing.authorities?.length) return setError('A user must have at least one role.');
    if (editing.phone?.trim() && !isValidPhone(editing.phone)) {
      return setError('Please enter a valid mobile number. Outside India, start with the country code, like +1.');
    }
    setSaving(true);
    try {
      await updateUser({ ...editing, phone: editing.phone?.trim() ?? null });
      setSuccess(`Saved ${memberName(editing)}.`);
      setEditing(null);
      update({ reload: query.reload + 1 });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update the user.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = !!(query.search || query.from || query.to || query.role || query.status);

  return (
    <div className="admin-container">
      <RoleBasedNav />
      <main className="admin-main">
        <PageHeader
          title="Users"
          subtitle="Find members by name, mobile or email, manage their roles and mobile number, and record payments for them."
          breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Admin' }, { label: 'Users' }]}
        />

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="admin-card">
          <div className="users-head">
            <h2>{filtered ? 'Matching users' : 'All users'} <span className="users-count">{totalElements}</span></h2>
          </div>
          <DataTableToolbar
            query={query}
            onChange={update}
            searchPlaceholder="Name, mobile or email"
            hasExtraFilters={!!(query.role || query.status)}
            onClear={() => setQuery((q) => ({ ...DEFAULT_QUERY, size: q.size, reload: q.reload }))}
          >
            <div className="dt-field">
              <label className="dt-label" htmlFor="users-role">Role</label>
              <select id="users-role" className="dt-input custom-select" value={query.role} onChange={(e) => update({ role: e.target.value, page: 0 })}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="dt-field">
              <label className="dt-label" htmlFor="users-status">Status</label>
              <select id="users-status" className="dt-input custom-select" value={query.status} onChange={(e) => update({ status: e.target.value, page: 0 })}>
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Not verified / inactive</option>
              </select>
            </div>
          </DataTableToolbar>
          <p className="dt-note users-period-note">Period, From and To filter by the date the user joined.</p>

          <div className={`table-scroll-wrap dt-table-wrap ${loading ? 'loading' : ''}`}>
            <table className="payment-history-table users-table">
              <thead>
                <tr>
                  <SortHeader label="Member" field="name" query={query} onSort={onSort} firstDir="asc" />
                  <th>Mobile</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <SortHeader label="Joined" field="joined" query={query} onSort={onSort} />
                  <th>Contributed</th>
                  <th><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="dt-empty">{loading ? 'Loading…' : filtered ? 'No users match these filters.' : 'No users yet.'}</td></tr>
                ) : rows.map((u) => {
                  const isEditing = editing?.id === u.id;
                  const row = isEditing ? editing! : u;
                  const name = memberName(u);
                  return (
                    <tr key={u.id} className={isEditing ? 'users-editing' : ''}>
                      <td>
                        <div className="contributor-cell">
                          <span className="mp-avatar" aria-hidden>{initials(name)}</span>
                          <div className="contributor-text">
                            <span className="contributor-name">{name}</span>
                            <small className="contributor-email">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="tel" className="form-input users-phone-input" placeholder="98765 43210"
                            aria-label={`Mobile number of ${name}`} value={row.phone ?? ''}
                            onChange={(e) => setEditing({ ...row, phone: e.target.value })} />
                        ) : u.phone ? <span className="users-nowrap">{formatPhone(u.phone)}</span> : <span className="badge">Not added</span>}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="role-checkboxes">
                            {ROLES.map((r) => (
                              <label key={r.value} className="role-checkbox-label">
                                <input type="checkbox" className="role-checkbox" checked={row.authorities?.includes(r.value) || false}
                                  onChange={(e) => toggleRole(r.value, e.target.checked)} />
                                <span>{r.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="role-badges-group">
                            {u.authorities?.length
                              ? u.authorities.map((r) => <span key={r} className={ROLE_BADGE[r] ?? 'badge'}>{roleLabel(r)}</span>)
                              : <span className="badge">No roles</span>}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={u.activated ? 'status-badge verified' : 'status-badge rejected'}>{u.activated ? 'Active' : 'Not verified'}</span>
                      </td>
                      <td className="users-nowrap">{formatDay(u.createdDate)}</td>
                      <td className="users-nowrap">
                        {u.contributionCount ? (
                          <>
                            <strong>{formatRupees(u.totalContributed ?? 0)}</strong>
                            <small className="users-sub">{u.contributionCount} payment{u.contributionCount === 1 ? '' : 's'} · last {formatDay(u.lastContributionDate)}</small>
                          </>
                        ) : <span className="users-muted">—</span>}
                      </td>
                      <td>
                        <div className="table-actions">
                          {isEditing ? (
                            <>
                              <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                              <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setEditing(null); setError(''); }} disabled={saving}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="btn btn-sm btn-secondary" disabled={!u.activated}
                                title={u.activated ? undefined : 'Users can be edited after they verify their email'}
                                onClick={() => { setEditing({ ...u }); setSuccess(''); setError(''); }}>Edit</button>
                              <Link to={`/admin/add-payment?user=${encodeURIComponent(u.email)}`} className="btn btn-sm btn-secondary">Add payment</Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DataTablePagination query={query} totalElements={totalElements} totalPages={totalPages} loading={loading} onChange={update} />
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
