import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { LeaveRequest, LeaveBalance } from '../../types';
import { formatDate, LEAVE_TYPE_LABELS } from '../../utils/formatters';

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'study', 'unpaid'];

function ApplyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/employee/leaves', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      onClose();
      setForm({ type: 'annual', startDate: '', endDate: '', reason: '' });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed to submit'),
  });

  const days =
    form.startDate && form.endDate
      ? Math.max(0, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1)
      : 0;

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(form); }} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="label">Leave Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          </div>
          <div>
            <label className="label">End Date</label>
            <input className="input" type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          </div>
        </div>
        {days > 0 && <p className="text-xs text-primary font-medium">{days} working day{days > 1 ? 's' : ''}</p>}
        <div>
          <label className="label">Reason</label>
          <textarea className="input resize-none" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe the reason..." required />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeeLeave() {
  const [showApply, setShowApply] = useState(false);

  const { data: balance } = useQuery<LeaveBalance>({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/employee/leaves/balance').then((r) => r.data),
  });

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/employee/leaves').then((r) => r.data),
  });

  const balanceItems = [
    { label: 'Annual', total: balance?.annual ?? 0, used: balance?.usedAnnual ?? 0 },
    { label: 'Sick', total: balance?.sick ?? 0, used: balance?.usedSick ?? 0 },
    { label: 'Casual', total: balance?.casual ?? 0, used: balance?.usedCasual ?? 0 },
  ];

  return (
    <DashboardLayout title="My Leave">
      <div className="space-y-6">
        {/* Leave balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {balanceItems.map((b) => (
            <div key={b.label} className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{b.label} Leave</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{b.total - b.used}</p>
              <p className="text-xs text-slate-400 mt-0.5">{b.used} used of {b.total} days</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${b.total ? Math.min(100, (b.used / b.total) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowApply(true)} className="btn-primary">
            <Plus size={14} /> Apply for Leave
          </button>
        </div>

        {/* Leave history */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Leave History</h3>
          </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : leaves.length === 0 ? (
            <EmptyState icon={Calendar} title="No leave requests" description="Apply for your first leave above." />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l._id}>
                      <td className="font-medium">{LEAVE_TYPE_LABELS[l.type]}</td>
                      <td>{formatDate(l.startDate)}</td>
                      <td>{formatDate(l.endDate)}</td>
                      <td>{l.days}</td>
                      <td className="max-w-xs truncate text-slate-500">{l.reason}</td>
                      <td><Badge status={l.status} /></td>
                      <td>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ApplyModal open={showApply} onClose={() => setShowApply(false)} />
    </DashboardLayout>
  );
}
