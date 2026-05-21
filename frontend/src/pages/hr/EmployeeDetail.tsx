import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, CreditCard, Shield, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import api from '../../api/client';
import type { Employee, Payroll } from '../../types';
import { formatNaira, formatDate, getMonthName } from '../../utils/formatters';

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'payroll' | 'leave'>('info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [saveError, setSaveError] = useState('');

  const { data: emp, isLoading } = useQuery<Employee>({
    queryKey: ['employee-detail', id],
    queryFn: () => api.get(`/hr/employees/${id}`).then(r => r.data),
  });

  const { data: payrolls = [] } = useQuery<Payroll[]>({
    queryKey: ['employee-payrolls', id],
    queryFn: () => api.get(`/hr/employees/${id}/payrolls`).then(r => r.data),
    enabled: tab === 'payroll',
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/hr/employees/${id}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employee-detail', id] }); setEditing(false); setSaveError(''); },
    onError: (err: { response?: { data?: { message?: string } } }) => setSaveError(err.response?.data?.message ?? 'Failed'),
  });

  const startEdit = () => {
    if (!emp) return;
    setForm({
      position: emp.position, phone: emp.phone,
      basicSalary: emp.basicSalary, housingAllowance: emp.housingAllowance, transportAllowance: emp.transportAllowance,
    });
    setEditing(true);
  };

  if (isLoading) return <DashboardLayout title="Employee Detail"><LoadingSpinner /></DashboardLayout>;
  if (!emp) return <DashboardLayout title="Employee Detail"><p className="text-slate-500 p-4">Employee not found.</p></DashboardLayout>;

  const TABS = [
    { key: 'info', label: 'Personal Info' },
    { key: 'payroll', label: 'Payroll History' },
  ];

  return (
    <DashboardLayout title="Employee Detail">
      <div className="space-y-4">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary px-2 py-1"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">{emp.firstName} {emp.middleName} {emp.lastName}</h2>
            <p className="text-sm text-slate-500">{emp.employeeId} · {emp.position} · {emp.department?.name}</p>
          </div>
          <Badge status={emp.isActive ? 'approved' : 'rejected'} />
          {!editing ? (
            <button onClick={startEdit} className="btn-secondary">Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {saveError && <div className="bg-danger-50 text-danger-700 rounded-lg px-4 py-2 text-sm">{saveError}</div>}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Employment */}
            <div className="card">
              <div className="card-header"><div className="flex items-center gap-2"><User size={16} className="text-primary" /><h3 className="font-semibold">Employment</h3></div></div>
              <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" value={emp.email} />
                <Field label="Phone" value={editing ? undefined : emp.phone} />
                {editing && (
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                )}
                <Field label="Position" value={editing ? undefined : emp.position} />
                {editing && (
                  <div>
                    <label className="label">Position</label>
                    <input className="input" value={form.position ?? ''} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                  </div>
                )}
                <Field label="Employment Type" value={emp.employmentType?.replace('_', ' ')} />
                <Field label="Hire Date" value={formatDate(emp.hireDate)} />
                <Field label="Gender" value={emp.gender} />
              </div>
            </div>

            {/* Salary */}
            <div className="card">
              <div className="card-header"><div className="flex items-center gap-2"><DollarSign size={16} className="text-primary" /><h3 className="font-semibold">Salary</h3></div></div>
              <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div>
                      <label className="label">Basic Salary (₦)</label>
                      <input className="input" type="number" value={form.basicSalary ?? ''} onChange={e => setForm(f => ({ ...f, basicSalary: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="label">Housing Allowance (₦)</label>
                      <input className="input" type="number" value={form.housingAllowance ?? ''} onChange={e => setForm(f => ({ ...f, housingAllowance: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="label">Transport Allowance (₦)</label>
                      <input className="input" type="number" value={form.transportAllowance ?? ''} onChange={e => setForm(f => ({ ...f, transportAllowance: Number(e.target.value) }))} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Basic Salary" value={formatNaira(emp.basicSalary)} />
                    <Field label="Housing Allowance" value={formatNaira(emp.housingAllowance)} />
                    <Field label="Transport Allowance" value={formatNaira(emp.transportAllowance)} />
                    <Field label="Gross" value={formatNaira(emp.basicSalary + emp.housingAllowance + emp.transportAllowance)} />
                  </>
                )}
              </div>
            </div>

            {/* Bank */}
            <div className="card">
              <div className="card-header"><div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><h3 className="font-semibold">Bank Details</h3></div></div>
              <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bank Name" value={emp.bankAccount?.bankName} />
                <Field label="Account Number" value={emp.bankAccount?.accountNumber} />
                <Field label="Account Name" value={emp.bankAccount?.accountName} />
              </div>
            </div>

            {/* Pension */}
            <div className="card">
              <div className="card-header"><div className="flex items-center gap-2"><Shield size={16} className="text-primary" /><h3 className="font-semibold">Pension</h3></div></div>
              <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="PFA Name" value={emp.pension?.pfaName} />
                <Field label="RSA PIN" value={emp.pension?.rsaPin} />
              </div>
            </div>
          </div>
        )}

        {tab === 'payroll' && (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                <tbody>
                  {payrolls.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No payroll records</td></tr>
                  ) : payrolls.map(p => (
                    <tr key={p._id}>
                      <td className="font-medium">{getMonthName(p.month, p.year)}</td>
                      <td>{formatNaira(p.grossSalary)}</td>
                      <td>{formatNaira(p.totalDeductions)}</td>
                      <td className="font-semibold text-success-700">{formatNaira(p.netPay)}</td>
                      <td><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
