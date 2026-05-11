import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { SalaryAdvance } from '../../types';
import { formatNaira, formatDate, getMonthName } from '../../utils/formatters';

export default function EmployeeSalaryAdvance() {
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '' });
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-advances'],
    queryFn: () => api.get('/employee/salary-advances').then(r => r.data),
  });

  const advances: SalaryAdvance[] = data?.advances ?? [];
  const enabled: boolean = data?.salaryAdvanceEnabled ?? true;

  const mutation = useMutation({
    mutationFn: (d: { amount: number; reason: string }) => api.post('/employee/salary-advances', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-advances'] }); setShowApply(false); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  if (!enabled) {
    return (
      <DashboardLayout title="Salary Advance">
        <div className="card">
          <EmptyState icon={Banknote} title="Not available" description="Salary advance is not currently available in your organisation." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Salary Advance">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowApply(true)} className="btn-primary"><Plus size={14} /> Request Advance</button>
        </div>

        {isLoading ? <LoadingSpinner /> : advances.length === 0 ? (
          <div className="card">
            <EmptyState icon={Banknote} title="No advance requests" description="Request a salary advance and it will appear here." />
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Amount</th><th>Reason</th><th>Status</th><th>Deduct Month</th><th>Applied</th></tr></thead>
                <tbody>
                  {advances.map(a => (
                    <tr key={a._id}>
                      <td className="font-semibold">{formatNaira(a.amount)}</td>
                      <td className="text-slate-500 max-w-xs truncate">{a.reason}</td>
                      <td><Badge status={a.status} /></td>
                      <td>{a.deductMonth && a.deductYear ? getMonthName(a.deductMonth, a.deductYear) : '—'}</td>
                      <td>{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Request Salary Advance">
        <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate({ amount: Number(form.amount), reason: form.reason }); }} className="space-y-4">
          {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div>
            <label className="label">Amount (₦)</label>
            <input className="input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input resize-none" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
