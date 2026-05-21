import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, CheckCircle, XCircle, Search, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/client';

type UserRole = 'employee' | 'manager' | 'hr_manager' | 'super_admin';

interface RoleUser {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  active: boolean;
  isFirstLogin: boolean;
  employeeId?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    department?: { name: string };
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_manager: 'HR Manager',
  super_admin: 'Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  employee: 'bg-slate-100 text-slate-700',
  manager: 'bg-blue-50 text-blue-700',
  hr_manager: 'bg-purple-50 text-purple-700',
  super_admin: 'bg-amber-50 text-amber-700',
};

const ALL_ROLES: UserRole[] = ['employee', 'manager', 'hr_manager', 'super_admin'];

export default function HRRoleManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const { data: users = [], isLoading } = useQuery<RoleUser[]>({
    queryKey: ['hr-roles'],
    queryFn: () => api.get('/hr/roles').then(r => r.data),
  });

  const update = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Partial<{ role: UserRole; active: boolean }> }) =>
      api.put(`/hr/roles/${userId}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-roles'] }),
  });

  const confirmRole = (userId: string) => {
    if (!pendingRole) return;
    update.mutate({ userId, payload: { role: pendingRole } });
    setEditingId(null);
    setPendingRole(null);
  };

  const toggleActive = (userId: string, current: boolean) => {
    update.mutate({ userId, payload: { active: !current } });
  };

  const filtered = users.filter(u => {
    const name = u.employeeId ? `${u.employeeId.firstName} ${u.employeeId.lastName}` : u.email;
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employeeId?.employeeId ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = ALL_ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length }));

  return (
    <DashboardLayout title="Role Management">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roleCounts.map(({ role, count }) => (
            <div key={role} className="card">
              <div className="card-body py-4">
                <p className="text-xs text-slate-500">{ROLE_LABELS[role]}s</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{count}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, email or employee ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>First Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">No users found</td></tr>
                ) : filtered.map(u => {
                  const name = u.employeeId
                    ? `${u.employeeId.firstName} ${u.employeeId.lastName}`
                    : u.email.split('@')[0];
                  const isEditing = editingId === u._id;

                  return (
                    <tr key={u._id}>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{name}</p>
                          <p className="text-xs text-slate-400">{u.employeeId?.employeeId ?? '—'}</p>
                        </div>
                      </td>
                      <td className="text-sm text-slate-600">{u.email}</td>
                      <td className="text-sm text-slate-600">{u.employeeId?.department?.name ?? '—'}</td>
                      <td>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="input py-1 text-xs"
                              defaultValue={u.role}
                              onChange={e => setPendingRole(e.target.value as UserRole)}
                              autoFocus
                            >
                              {ALL_ROLES.map(r => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            <button onClick={() => confirmRole(u._id)} className="btn-primary text-xs px-2 py-1">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-2 py-1">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(u._id); setPendingRole(u.role); }}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.role]} hover:opacity-80 transition-opacity`}
                          >
                            <Shield size={11} />
                            {ROLE_LABELS[u.role]}
                            <ChevronDown size={11} />
                          </button>
                        )}
                      </td>
                      <td>
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-danger-700 bg-danger-50 px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isFirstLogin ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.isFirstLogin ? 'Pending setup' : 'Completed'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleActive(u._id, u.active)}
                          disabled={update.isPending}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                            u.active
                              ? 'text-danger-600 bg-danger-50 hover:bg-danger-100'
                              : 'text-success-600 bg-success-50 hover:bg-success-100'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
