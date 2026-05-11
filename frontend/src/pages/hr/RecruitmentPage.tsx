import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, Users, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { Job, Applicant, ApplicantStage } from '../../types';
import { formatDate } from '../../utils/formatters';

const STAGES: ApplicantStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_LABELS: Record<ApplicantStage, string> = {
  applied: 'Applied', screening: 'Screening', interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected',
};

function CreateJobModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', type: 'full_time', level: 'mid', location: '', deadline: '', status: 'draft' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/hr/jobs', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hr-jobs'] }); onClose(); setForm({ title: '', description: '', type: 'full_time', level: 'mid', location: '', deadline: '', status: 'draft' }); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Job Posting" size="lg">
      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div>
          <label className="label">Job Title</label>
          <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['full_time', 'part_time', 'contract', 'intern'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              {['entry', 'mid', 'senior', 'lead', 'director'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label className="label">Application Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="active">Active (Public)</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Creating...' : 'Create Job'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<'jobs' | 'pipeline'>('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['hr-jobs'],
    queryFn: () => api.get('/hr/jobs').then(r => r.data),
  });

  const { data: applicants = [], isLoading: appLoading } = useQuery<Applicant[]>({
    queryKey: ['applicants', selectedJob?._id],
    queryFn: () => api.get(`/hr/jobs/${selectedJob?._id}/applicants`).then(r => r.data),
    enabled: !!selectedJob,
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.put(`/hr/applicants/${id}/stage`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applicants', selectedJob?._id] }),
  });

  const toggleJobStatus = useMutation({
    mutationFn: (job: Job) => api.put(`/hr/jobs/${job._id}`, { status: job.status === 'active' ? 'closed' : 'active' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-jobs'] }),
  });

  return (
    <DashboardLayout title="Recruitment">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button onClick={() => { setView('jobs'); setSelectedJob(null); }} className={view === 'jobs' ? 'btn-primary' : 'btn-secondary'}>Jobs</button>
            {selectedJob && <button onClick={() => setView('pipeline')} className={view === 'pipeline' ? 'btn-primary' : 'btn-secondary'}>Pipeline: {selectedJob.title}</button>}
          </div>
          {view === 'jobs' && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} /> Post Job</button>}
        </div>

        {/* Jobs list */}
        {view === 'jobs' && (
          <div className="card">
            {jobsLoading ? <LoadingSpinner /> : jobs.length === 0 ? (
              <EmptyState icon={Briefcase} title="No job postings" description="Create a job posting to start receiving applications." action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} /> Post Job</button>} />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>Title</th><th>Type</th><th>Level</th><th>Applicants</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j._id}>
                        <td className="font-medium text-slate-800">{j.title}</td>
                        <td className="capitalize text-slate-500">{j.type.replace('_', ' ')}</td>
                        <td className="capitalize text-slate-500">{j.level}</td>
                        <td><span className="inline-flex items-center gap-1 text-xs"><Users size={11} /> {j.applicantCount}</span></td>
                        <td className="text-slate-500">{j.deadline ? formatDate(j.deadline) : '—'}</td>
                        <td><Badge status={j.status} /></td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => { setSelectedJob(j); setView('pipeline'); }} className="btn-secondary px-3 py-1 text-xs">
                              Pipeline <ChevronRight size={11} />
                            </button>
                            <button onClick={() => toggleJobStatus.mutate(j)} className="btn-secondary px-3 py-1 text-xs">
                              {j.status === 'active' ? 'Close' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pipeline / Kanban */}
        {view === 'pipeline' && selectedJob && (
          <div>
            {appLoading ? <LoadingSpinner /> : (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {STAGES.map(stage => {
                  const stageApplicants = applicants.filter(a => a.stage === stage);
                  return (
                    <div key={stage} className="flex-shrink-0 w-60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{STAGE_LABELS[stage]}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{stageApplicants.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stageApplicants.map(a => (
                          <div key={a._id} className="card p-3">
                            <p className="text-sm font-medium text-slate-800">{a.firstName} {a.lastName}</p>
                            <p className="text-xs text-slate-500">{a.email}</p>
                            <p className="text-xs text-slate-400 mt-1">{formatDate(a.createdAt)}</p>
                            <div className="mt-2">
                              <select
                                className="input text-xs py-1"
                                value={a.stage}
                                onChange={e => updateStage.mutate({ id: a._id, stage: e.target.value })}
                              >
                                {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                        {stageApplicants.length === 0 && (
                          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                            <p className="text-xs text-slate-400">No applicants</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateJobModal open={showCreate} onClose={() => setShowCreate(false)} />
    </DashboardLayout>
  );
}
