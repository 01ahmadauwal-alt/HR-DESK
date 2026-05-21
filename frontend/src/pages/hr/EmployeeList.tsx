import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, Edit, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../api/client';
import type { Employee } from '../../types';
import { formatDate, getInitials } from '../../utils/formatters';

function AddEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', position: '',
    department: '', hireDate: '', basicSalary: '', employmentType: 'full_time',
    housingAllowance: '', transportAllowance: '', role: 'employee',
  });
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/hr/employees', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['hr-employees'] });
      setCredentials(res.data.credentials);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message ?? 'Failed to add employee');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(form);
  };

  if (credentials) {
    return (
      <Modal open={open} onClose={onClose} title="Employee Added Successfully">
        <div className="space-y-4">
          <div className="bg-success-50 border border-success-100 rounded-lg p-4">
            <p className="text-sm font-semibold text-success-700">Account created!</p>
            <p className="text-xs text-success-600 mt-1">Share these credentials with the employee securely.</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500">Username / Email</span>
              <span className="text-sm font-mono font-medium text-slate-800">{credentials.username}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500">Temp Password (phone)</span>
              <span className="text-sm font-mono font-medium text-slate-800">{credentials.password}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">The employee will be prompted to change their password on first login.</p>
          <button onClick={() => { onClose(); setCredentials(null); }} className="btn-primary w-full">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Employee" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-4 py-2 text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
          <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
          <div><label className="label">Position *</label><input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr_manager">HR Manager</option>
              <option value="super_admin">Admin</option>
            </select>
          </div>
          <div><label className="label">Hire Date *</label><input className="input" type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} required /></div>
          <div>
            <label className="label">Employment Type</label>
            <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </div>
          <div><label className="label">Basic Salary (₦) *</label><input className="input" type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} required /></div>
          <div><label className="label">Housing Allowance (₦)</label><input className="input" type="number" value={form.housingAllowance} onChange={(e) => setForm({ ...form, housingAllowance: e.target.value })} /></div>
          <div><label className="label">Transport Allowance (₦)</label><input className="input" type="number" value={form.transportAllowance} onChange={(e) => setForm({ ...form, transportAllowance: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeeList() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['hr-employees'],
    queryFn: () => api.get('/hr/employees').then((r) => r.data),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/hr/employees/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-employees'] }),
  });

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout title="Employees">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, ID..."
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary"><Filter size={14} /> Filter</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> Add Employee</button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No employees found"
              description={search ? 'No employees match your search.' : 'Add your first employee to get started.'}
              action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={14} /> Add Employee</button>}
            />
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Hire Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {emp.avatar ? (
                            <img src={emp.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                              {getInitials(emp.firstName, emp.lastName)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{emp.employeeId}</td>
                      <td>{emp.position}</td>
                      <td>{typeof emp.department === 'object' ? emp.department?.name : '—'}</td>
                      <td>{formatDate(emp.hireDate)}</td>
                      <td><Badge status={emp.isActive ? 'active' : 'rejected'} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link to={`/hr/employees/${emp._id}`} className="btn-ghost px-2 py-1">
                            <Eye size={14} />
                          </Link>
                          <Link to={`/hr/employees/${emp._id}/edit`} className="btn-ghost px-2 py-1">
                            <Edit size={14} />
                          </Link>
                          {emp.isActive ? (
                            <button
                              onClick={() => deactivate.mutate(emp._id)}
                              className="btn-ghost px-2 py-1 text-danger"
                            >
                              <UserX size={14} />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 px-2">Inactive</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} />
    </DashboardLayout>
  );
}
