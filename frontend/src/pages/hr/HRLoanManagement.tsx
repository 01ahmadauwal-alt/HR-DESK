import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Banknote, Settings } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { LoanApplication, SalaryAdvance, Employee, PayrollConfig } from '../../types';
import { formatNaira, formatDate, getMonthName } from '../../utils/formatters';

type MainTab = 'loans' | 'advances' | 'settings';

function LoanActionModal({ loan, action, onClose }: { loan: LoanApplication | null; action: 'approve' | 'reject'; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.put(`/hr/loans/${loan?._id}/${action}`, action === 'reject' ? { reason } : {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-loans'] }); onClose(); setReason(''); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  const emp = loan?.employeeId as Employee | undefined;
  return (
    <Modal open={!!loan} onClose={onClose} title={action === 'approve' ? 'Approve Loan' : 'Reject Loan'} size="sm">
      <div className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        {loan && emp && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
            <p className="text-slate-500">{formatNaira(loan.amount)} over {loan.repaymentMonths} months</p>
            <p className="text-slate-500">Monthly: {formatNaira(loan.monthlyDeduction)}</p>
            <p className="text-slate-600 mt-1">{loan.purpose}</p>
          </div>
        )}
        {action === 'reject' && (
          <div>
            <label className="label">Rejection Reason <span className="text-danger-500">*</span></label>
            <textarea className="input resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || (action === 'reject' && !reason.trim())} className={action === 'approve' ? 'btn-primary' : 'btn-danger'}>
            {mutation.isPending ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AdvanceActionModal({ advance, action, onClose }: { advance: SalaryAdvance | null; action: 'approve' | 'reject'; onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date();
  const [deductMonth, setDeductMonth] = useState(today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2);
  const [deductYear, setDeductYear] = useState(today.getMonth() + 2 > 12 ? today.getFullYear() + 1 : today.getFullYear());
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.put(`/hr/salary-advances/${advance?._id}/${action}`,
      action === 'approve' ? { deductMonth, deductYear } : { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-advances'] }); onClose(); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  const emp = advance?.employeeId as Employee | undefined;
  return (
    <Modal open={!!advance} onClose={onClose} title={action === 'approve' ? 'Approve Advance' : 'Reject Advance'} size="sm">
      <div className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        {advance && emp && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{emp.firstName} {emp.lastName}</p>
            <p className="text-slate-500">{formatNaira(advance.amount)}</p>
            <p className="text-slate-600">{advance.reason}</p>
          </div>
        )}
        {action === 'approve' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Deduct Month</label>
              <select className="input" value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))}>
                {[today.getFullYear(), today.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
        {action === 'reject' && (
          <div>
            <label className="label">Rejection Reason <span className="text-danger-500">*</span></label>
            <textarea className="input resize-none" rows={3} value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || (action === 'reject' && !reason.trim())} className={action === 'approve' ? 'btn-primary' : 'btn-danger'}>
            {mutation.isPending ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function HRLoanManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<MainTab>('loans');
  const [loanAction, setLoanAction] = useState<{ loan: LoanApplication; action: 'approve' | 'reject' } | null>(null);
  const [advAction, setAdvAction] = useState<{ advance: SalaryAdvance; action: 'approve' | 'reject' } | null>(null);
  const [configSuccess, setConfigSuccess] = useState('');

  const { data: loans = [], isLoading: loansLoading } = useQuery<LoanApplication[]>({
    queryKey: ['hr-loans'],
    queryFn: () => api.get('/hr/loans').then(r => r.data),
    enabled: tab === 'loans',
  });

  const { data: advances = [], isLoading: advLoading } = useQuery<SalaryAdvance[]>({
    queryKey: ['hr-advances'],
    queryFn: () => api.get('/hr/salary-advances').then(r => r.data),
    enabled: tab === 'advances',
  });

  const { data: config } = useQuery<PayrollConfig>({
    queryKey: ['payroll-config'],
    queryFn: () => api.get('/hr/payroll/config').then(r => r.data),
    enabled: tab === 'settings',
  });

  const [settings, setSettings] = useState<Partial<PayrollConfig>>({});
  useEffect(() => { if (config) setSettings(config); }, [config]);

  const saveSettings = useMutation({
    mutationFn: () => api.put('/hr/payroll/config', settings),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-config'] }); setConfigSuccess('Settings saved.'); setTimeout(() => setConfigSuccess(''), 3000); },
  });

  const TABS = [
    { key: 'loans' as MainTab, label: 'Loan Applications', icon: CreditCard },
    { key: 'advances' as MainTab, label: 'Salary Advances', icon: Banknote },
    { key: 'settings' as MainTab, label: 'Settings', icon: Settings },
  ];

  return (
    <DashboardLayout title="Loan & Advance Management">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Loans */}
        {tab === 'loans' && (
          <div className="card">
            {loansLoading ? <LoadingSpinner /> : loans.length === 0 ? (
              <EmptyState icon={CreditCard} title="No loan applications" description="Employee loan applications will appear here." />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Employee</th><th>Amount</th><th>Purpose</th><th>Repayment</th><th>Monthly</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
                  <tbody>
                    {loans.map(l => {
                      const emp = l.employeeId as Employee;
                      return (
                        <tr key={l._id}>
                          <td><p className="font-medium">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{emp.employeeId}</p></td>
                          <td className="font-semibold">{formatNaira(l.amount)}</td>
                          <td className="text-slate-500 max-w-xs truncate">{l.purpose}</td>
                          <td>{l.repaymentMonths}m</td>
                          <td>{formatNaira(l.monthlyDeduction)}</td>
                          <td><Badge status={l.status} /></td>
                          <td className="text-slate-400">{formatDate(l.createdAt)}</td>
                          <td>
                            {l.status === 'pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => setLoanAction({ loan: l, action: 'approve' })} className="btn-primary px-3 py-1 text-xs">Approve</button>
                                <button onClick={() => setLoanAction({ loan: l, action: 'reject' })} className="btn-danger px-3 py-1 text-xs">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Advances */}
        {tab === 'advances' && (
          <div className="card">
            {advLoading ? <LoadingSpinner /> : advances.length === 0 ? (
              <EmptyState icon={Banknote} title="No salary advance requests" description="Employee salary advance requests will appear here." />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Employee</th><th>Amount</th><th>Reason</th><th>Deduct Month</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
                  <tbody>
                    {advances.map(a => {
                      const emp = a.employeeId as Employee;
                      return (
                        <tr key={a._id}>
                          <td><p className="font-medium">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{emp.employeeId}</p></td>
                          <td className="font-semibold">{formatNaira(a.amount)}</td>
                          <td className="text-slate-500 max-w-xs truncate">{a.reason}</td>
                          <td>{a.deductMonth && a.deductYear ? getMonthName(a.deductMonth, a.deductYear) : '—'}</td>
                          <td><Badge status={a.status} /></td>
                          <td className="text-slate-400">{formatDate(a.createdAt)}</td>
                          <td>
                            {a.status === 'pending' && (
                              <div className="flex gap-1">
                                <button onClick={() => setAdvAction({ advance: a, action: 'approve' })} className="btn-primary px-3 py-1 text-xs">Approve</button>
                                <button onClick={() => setAdvAction({ advance: a, action: 'reject' })} className="btn-danger px-3 py-1 text-xs">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {configSuccess && <div className="bg-success-50 text-success-700 rounded-lg px-4 py-2 text-sm">{configSuccess}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Loan Settings */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><CreditCard size={15} className="text-primary" /> Loan Settings</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={settings.loanEnabled ?? true} onChange={e => setSettings(s => ({ ...s, loanEnabled: e.target.checked }))} />
                    <span className="text-sm">{settings.loanEnabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                <div className="card-body space-y-3" style={{ opacity: settings.loanEnabled ? 1 : 0.4, pointerEvents: settings.loanEnabled ? 'auto' : 'none' }}>
                  <div>
                    <label className="label">Max Loan Amount (₦)</label>
                    <input className="input" type="number" value={settings.maxLoanAmount ?? ''} onChange={e => setSettings(s => ({ ...s, maxLoanAmount: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Max Repayment Months</label>
                    <input className="input" type="number" value={settings.maxRepaymentMonths ?? ''} onChange={e => setSettings(s => ({ ...s, maxRepaymentMonths: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Interest Rate (%)</label>
                    <input className="input" type="number" step="0.1" value={settings.loanInterestRate ?? ''} onChange={e => setSettings(s => ({ ...s, loanInterestRate: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Eligibility (months of employment)</label>
                    <input className="input" type="number" value={settings.eligibilityMonths ?? ''} onChange={e => setSettings(s => ({ ...s, eligibilityMonths: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>

              {/* Salary Advance Settings */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Banknote size={15} className="text-primary" /> Salary Advance Settings</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={settings.salaryAdvanceEnabled ?? true} onChange={e => setSettings(s => ({ ...s, salaryAdvanceEnabled: e.target.checked }))} />
                    <span className="text-sm">{settings.salaryAdvanceEnabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                <div className="card-body space-y-3" style={{ opacity: settings.salaryAdvanceEnabled ? 1 : 0.4, pointerEvents: settings.salaryAdvanceEnabled ? 'auto' : 'none' }}>
                  <div>
                    <label className="label">Max Advance (% of gross salary)</label>
                    <input className="input" type="number" step="1" value={settings.maxAdvancePercent ?? ''} onChange={e => setSettings(s => ({ ...s, maxAdvancePercent: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">Max Advances Per Year</label>
                    <input className="input" type="number" value={settings.maxAdvancePerYear ?? ''} onChange={e => setSettings(s => ({ ...s, maxAdvancePerYear: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} className="btn-primary">
                {saveSettings.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      <LoanActionModal loan={loanAction?.loan ?? null} action={loanAction?.action ?? 'approve'} onClose={() => setLoanAction(null)} />
      <AdvanceActionModal advance={advAction?.advance ?? null} action={advAction?.action ?? 'approve'} onClose={() => setAdvAction(null)} />
    </DashboardLayout>
  );
}

