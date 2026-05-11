import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Play, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { Payroll, Employee } from '../../types';
import { formatNaira, getMonthName } from '../../utils/formatters';

interface PayrollRow extends Payroll {
  employeeId: Employee;
}

export default function PayrollManagement() {
  const qc = useQueryClient();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showConfirm, setShowConfirm] = useState<'process' | 'approve' | null>(null);
  const [error, setError] = useState('');

  const { data: records = [], isLoading } = useQuery<PayrollRow[]>({
    queryKey: ['payroll-records', month, year],
    queryFn: () => api.get(`/hr/payroll?month=${month}&year=${year}`).then(r => r.data),
  });

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const monthLabel = new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  const processMutation = useMutation({
    mutationFn: () => api.post('/hr/payroll/process', { month, year }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-records', month, year] }); setShowConfirm(null); },
    onError: (err: { response?: { data?: { message?: string } } }) => { setError(err.response?.data?.message ?? 'Failed to process payroll'); setShowConfirm(null); },
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post('/hr/payroll/approve', { month, year }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-records', month, year] }); setShowConfirm(null); },
    onError: (err: { response?: { data?: { message?: string } } }) => { setError(err.response?.data?.message ?? 'Failed to approve payroll'); setShowConfirm(null); },
  });

  const hasDraft = records.some(r => r.status === 'draft');
  const allDraft = records.length > 0 && records.every(r => r.status === 'draft');

  const totals = records.reduce((acc, r) => ({
    gross: acc.gross + r.grossSalary,
    deductions: acc.deductions + r.totalDeductions,
    net: acc.net + r.netPay,
  }), { gross: 0, deductions: 0, net: 0 });

  return (
    <DashboardLayout title="Payroll">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={prev} className="btn-secondary px-2 py-1"><ChevronLeft size={16} /></button>
            <h2 className="text-base font-semibold text-slate-800 w-48 text-center">{monthLabel}</h2>
            <button onClick={next} className="btn-secondary px-2 py-1"><ChevronRight size={16} /></button>
          </div>
          <div className="flex gap-2">
            {records.length === 0 && (
              <button onClick={() => { setError(''); setShowConfirm('process'); }} className="btn-primary">
                <Play size={14} /> Process Payroll
              </button>
            )}
            {allDraft && (
              <button onClick={() => { setError(''); setShowConfirm('approve'); }} className="btn-primary">
                <CheckCircle size={14} /> Approve & Generate Payslips
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* Summary */}
        {records.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Gross', value: formatNaira(totals.gross) },
              { label: 'Total Deductions', value: formatNaira(totals.deductions) },
              { label: 'Total Net Pay', value: formatNaira(totals.net) },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card">
          {isLoading ? <LoadingSpinner /> : records.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No payroll for {monthLabel}</p>
              <p className="text-sm text-slate-400 mt-1">Click "Process Payroll" to generate this month's payroll.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Basic</th><th>Gross</th><th>PAYE</th><th>Pension</th><th>Other Deductions</th><th>Net Pay</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id}>
                      <td>
                        <p className="font-medium text-slate-800">{r.employeeId.firstName} {r.employeeId.lastName}</p>
                        <p className="text-xs text-slate-400">{r.employeeId.employeeId}</p>
                      </td>
                      <td>{formatNaira(r.basicSalary)}</td>
                      <td>{formatNaira(r.grossSalary)}</td>
                      <td className="text-danger-600">{formatNaira(r.paye)}</td>
                      <td className="text-warning-600">{formatNaira(r.pensionEmployee)}</td>
                      <td>{formatNaira(r.totalDeductions - r.paye - r.pensionEmployee)}</td>
                      <td className="font-semibold text-success-700">{formatNaira(r.netPay)}</td>
                      <td><Badge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Process confirm */}
      <Modal open={showConfirm === 'process'} onClose={() => setShowConfirm(null)} title="Process Payroll" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will calculate payroll for all active employees for <strong>{monthLabel}</strong>. The records will be in <em>draft</em> status for your review.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => processMutation.mutate()} disabled={processMutation.isPending} className="btn-primary">
              {processMutation.isPending ? 'Processing...' : 'Process'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve confirm */}
      <Modal open={showConfirm === 'approve'} onClose={() => setShowConfirm(null)} title="Approve Payroll" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will approve all draft payroll records for <strong>{monthLabel}</strong> and generate payslips for <strong>{records.length}</strong> employees. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="btn-primary">
              {approveMutation.isPending ? 'Approving...' : 'Approve & Generate'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
