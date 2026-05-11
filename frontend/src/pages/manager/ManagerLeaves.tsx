import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCheck } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { LeaveRequest, Employee } from '../../types';
import { formatDate, LEAVE_TYPE_LABELS } from '../../utils/formatters';

function ActionModal({
  leave, action, onClose,
}: { leave: LeaveRequest | null; action: 'approve' | 'reject'; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.put(`/manager/leaves/${leave?._id}/${action}`, action === 'reject' ? { reason } : {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-leaves'] }); onClose(); },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal open={!!leave} onClose={onClose} title={action === 'approve' ? 'Approve Leave' : 'Reject Leave'} size="sm">
      <div className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        {leave && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium text-slate-800">{(leave.employeeId as Employee).firstName} {(leave.employeeId as Employee).lastName}</p>
            <p className="text-slate-500">{LEAVE_TYPE_LABELS[leave.type]} · {leave.days} day{leave.days !== 1 ? 's' : ''}</p>
            <p className="text-slate-500">{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</p>
            <p className="text-slate-600 mt-2">{leave.reason}</p>
          </div>
        )}
        {action === 'reject' && (
          <div>
            <label className="label">Rejection Reason <span className="text-danger-500">*</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (action === 'reject' && !reason.trim())}
            className={action === 'approve' ? 'btn-primary' : 'btn-danger'}
          >
            {mutation.isPending ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ManagerLeaves() {
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [filter, setFilter] = useState<'pending_manager' | 'all'>('pending_manager');

  const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['manager-leaves', filter],
    queryFn: () => api.get(`/manager/leaves${filter === 'pending_manager' ? '?status=pending_manager' : ''}`).then(r => r.data),
  });

  const openAction = (leave: LeaveRequest, act: 'approve' | 'reject') => {
    setSelected(leave);
    setAction(act);
  };

  return (
    <DashboardLayout title="Leave Approvals">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setFilter('pending_manager')} className={filter === 'pending_manager' ? 'btn-primary' : 'btn-secondary'}>
            Pending
          </button>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}>
            All
          </button>
        </div>

        <div className="card">
          {isLoading ? <LoadingSpinner /> : leaves.length === 0 ? (
            <EmptyState icon={FileCheck} title="No leave requests" description="Leave requests from your team will appear here." />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {filter === 'pending_manager' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => {
                    const emp = l.employeeId as Employee;
                    return (
                      <tr key={l._id}>
                        <td>
                          <p className="font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-slate-400">{emp.employeeId}</p>
                        </td>
                        <td>{LEAVE_TYPE_LABELS[l.type]}</td>
                        <td>{l.days} day{l.days !== 1 ? 's' : ''}</td>
                        <td className="text-slate-500 text-xs">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                        <td className="text-slate-500 max-w-xs truncate">{l.reason}</td>
                        <td><Badge status={l.status} /></td>
                        {filter === 'pending_manager' && (
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => openAction(l, 'approve')} className="btn-primary px-3 py-1 text-xs">Approve</button>
                              <button onClick={() => openAction(l, 'reject')} className="btn-danger px-3 py-1 text-xs">Reject</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ActionModal leave={selected} action={action} onClose={() => setSelected(null)} />
    </DashboardLayout>
  );
}
