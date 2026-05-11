import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { LoanApplication } from '../../types';
import { formatNaira, formatDate } from '../../utils/formatters';

function ApplyModal({ open, onClose, config }: { open: boolean; onClose: () => void; config: { maxLoanAmount: number; maxRepaymentMonths: number; loanInterestRate: number } }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: '', purpose: '', repaymentMonths: '3' });
  const [error, setError] = useState('');

  const monthly = form.amount && form.repaymentMonths
    ? Math.ceil((Number(form.amount) * (1 + (config?.loanInterestRate ?? 0) / 100)) / Number(form.repaymentMonths))
    : 0;

  const mutation = useMutation({
    mutationFn: (d: { amount: number; purpose: string; repaymentMonths: number }) => api.post('/employee/loans', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-loans'] }); onClose(); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Apply for Loan">
      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate({ amount: Number(form.amount), purpose: form.purpose, repaymentMonths: Number(form.repaymentMonths) }); }} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="label">Loan Amount (₦)</label>
          <input className="input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} max={config?.maxLoanAmount} required />
          {config?.maxLoanAmount && <p className="text-xs text-slate-400 mt-1">Maximum: {formatNaira(config.maxLoanAmount)}</p>}
        </div>
        <div>
          <label className="label">Repayment Period (months)</label>
          <select className="input" value={form.repaymentMonths} onChange={e => setForm({ ...form, repaymentMonths: e.target.value })}>
            {Array.from({ length: config?.maxRepaymentMonths ?? 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Purpose</label>
          <textarea className="input resize-none" rows={3} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required />
        </div>
        {monthly > 0 && (
          <div className="bg-primary-50 rounded-lg px-4 py-3">
            <p className="text-xs text-primary-700 font-medium">Estimated monthly deduction: {formatNaira(monthly)}</p>
            {config?.loanInterestRate > 0 && <p className="text-xs text-primary-600 mt-0.5">Includes {config.loanInterestRate}% interest</p>}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Applying...' : 'Apply'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeeLoan() {
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => api.get('/employee/loans').then(r => r.data),
  });

  const loans: LoanApplication[] = data?.loans ?? [];
  const loanEnabled: boolean = data?.loanEnabled ?? true;

  if (!loanEnabled) {
    return (
      <DashboardLayout title="Loan">
        <div className="card">
          <EmptyState icon={CreditCard} title="Loans not available" description="Your organisation has not enabled loan facilities at this time." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Loan">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowApply(true)} className="btn-primary"><Plus size={14} /> Apply for Loan</button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : loans.length === 0 ? (
          <div className="card">
            <EmptyState icon={CreditCard} title="No loan applications" description="Apply for a loan and your applications will appear here." action={<button onClick={() => setShowApply(true)} className="btn-primary"><Plus size={14} />Apply</button>} />
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Amount</th><th>Purpose</th><th>Repayment</th><th>Monthly</th><th>Status</th><th>Applied</th></tr></thead>
                <tbody>
                  {loans.map(l => (
                    <tr key={l._id}>
                      <td className="font-semibold">{formatNaira(l.amount)}</td>
                      <td className="text-slate-500 max-w-xs truncate">{l.purpose}</td>
                      <td>{l.repaymentMonths} months</td>
                      <td>{formatNaira(l.monthlyDeduction)}</td>
                      <td><Badge status={l.status} /></td>
                      <td>{formatDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ApplyModal open={showApply} onClose={() => setShowApply(false)} config={data ?? {}} />
    </DashboardLayout>
  );
}
