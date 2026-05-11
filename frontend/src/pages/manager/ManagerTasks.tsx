import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { Task, Employee } from '../../types';
import { formatDate } from '../../utils/formatters';

function CreateTaskModal({ open, onClose, team }: { open: boolean; onClose: () => void; team: Employee[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', priority: 'medium',
    assignedTo: [] as string[], isOpenForCollaboration: false,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/manager/tasks', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manager-tasks'] }); onClose(); setForm({ title: '', description: '', dueDate: '', priority: 'medium', assignedTo: [], isOpenForCollaboration: false }); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  const toggleAssign = (id: string) =>
    setForm(f => ({ ...f, assignedTo: f.assignedTo.includes(id) ? f.assignedTo.filter(x => x !== id) : [...f.assignedTo, id] }));

  return (
    <Modal open={open} onClose={onClose} title="Create Task" size="lg">
      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Assign To</label>
          <div className="space-y-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {team.map(m => (
              <label key={m._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1">
                <input type="checkbox" checked={form.assignedTo.includes(m._id)} onChange={() => toggleAssign(m._id)} className="rounded" />
                <span className="text-sm text-slate-700">{m.firstName} {m.lastName}</span>
                <span className="text-xs text-slate-400">{m.position}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isOpenForCollaboration} onChange={e => setForm(f => ({ ...f, isOpenForCollaboration: e.target.checked }))} className="rounded" />
          <span className="text-sm text-slate-700">Open for collaboration</span>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending || form.assignedTo.length === 0} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManagerTasks() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['manager-tasks'],
    queryFn: () => api.get('/manager/tasks').then(r => r.data),
  });

  const { data: team = [] } = useQuery<Employee[]>({
    queryKey: ['manager-team'],
    queryFn: () => api.get('/manager/team').then(r => r.data),
  });

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);

  return (
    <DashboardLayout title="Tasks">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {['all', 'open', 'in_progress', 'done'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'btn-primary' : 'btn-secondary'}>
                {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} /> New Task</button>
        </div>

        <div className="card">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={CheckSquare} title="No tasks" description="Create tasks and assign them to your team members." action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} /> New Task</button>} />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Title</th><th>Assignees</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Comments</th></tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t._id}>
                      <td>
                        <p className="font-medium text-slate-800">{t.title}</p>
                        {t.isOpenForCollaboration && <span className="text-xs text-primary">Open for collaboration</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-500">{t.assignedTo.length}</span>
                        </div>
                      </td>
                      <td><Badge status={t.priority} /></td>
                      <td><Badge status={t.status} /></td>
                      <td className="text-slate-500">{formatDate(t.dueDate)}</td>
                      <td className="text-slate-500">{t.comments.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} team={team} />
    </DashboardLayout>
  );
}
