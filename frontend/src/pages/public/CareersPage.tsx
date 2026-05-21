import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Briefcase, MapPin, Clock, ChevronRight, X, Upload, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import type { Job } from '../../types';
import { formatDate } from '../../utils/formatters';

function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', coverLetter: '' });
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('jobId', job._id);
      if (resume) fd.append('resume', resume);
      return api.post('/careers/apply', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => setSuccess(true),
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Application failed. Please try again.'),
  });

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Application Submitted!</h3>
          <p className="text-slate-500 mb-6">Thank you for applying to <strong>{job.title}</strong>. We'll be in touch if your profile matches our requirements.</p>
          <button onClick={onClose} className="btn-primary w-full">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Apply for {job.title}</h3>
            <p className="text-sm text-slate-500">{job.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(); }} className="p-6 space-y-4">
          {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={f('firstName')} required />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={f('lastName')} required />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={f('email')} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={form.phone} onChange={f('phone')} required />
          </div>
          <div>
            <label className="label">Resume / CV</label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileRef.current?.click()}>
              {resume ? (
                <p className="text-sm text-success-600 font-medium">{resume.name}</p>
              ) : (
                <>
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-sm text-slate-500">Click to upload PDF or DOCX</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="label">Cover Letter (optional)</label>
            <textarea className="input resize-none" rows={4} value={form.coverLetter} onChange={f('coverLetter')} placeholder="Tell us why you're a great fit..." />
          </div>
          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
            {mutation.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

function JobCard({ job, onApply }: { job: Job; onApply: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
            {job.location && (
              <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
            )}
            <span className="flex items-center gap-1"><Clock size={13} /> {job.type?.replace('_', ' ')}</span>
            {job.department?.name && <span className="flex items-center gap-1"><Briefcase size={13} /> {job.department.name}</span>}
          </div>
        </div>
        <span className="flex-shrink-0 text-xs bg-primary-50 text-primary rounded-full px-3 py-1 font-medium capitalize">{job.level}</span>
      </div>

      {job.deadline && <p className="text-xs text-slate-400 mb-3">Apply by {formatDate(job.deadline)}</p>}

      {expanded && (
        <div className="mt-3 text-sm text-slate-600 space-y-3">
          <p className="whitespace-pre-line">{job.description}</p>
          {job.requirements?.length > 0 && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">Requirements</p>
              <ul className="list-disc list-inside space-y-0.5">
                {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => setExpanded(!expanded)} className="btn-secondary text-sm flex items-center gap-1">
          {expanded ? 'Show Less' : 'Read More'} <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <button onClick={onApply} className="btn-primary text-sm">Apply Now</button>
      </div>
    </div>
  );
}

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState('');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['public-jobs'],
    queryFn: () => api.get('/careers').then(r => r.data),
  });

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-primary px-6 py-16 text-center text-white">
        <h1 className="text-4xl font-bold mb-3">Join Our Team</h1>
        <p className="text-primary-200 text-lg mb-8">Explore opportunities and grow your career with us</p>
        <input
          className="w-full max-w-md mx-auto block bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 outline-none focus:bg-white/20 transition-colors"
          placeholder="Search by role, department, or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Jobs */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Loading opportunities...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">{search ? 'No matching positions' : 'No open positions at this time'}</p>
            <p className="text-sm text-slate-400 mt-1">{search ? 'Try a different search term.' : 'Check back soon for new opportunities.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{filtered.length} open position{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(job => (
              <JobCard key={job._id} job={job} onApply={() => setSelectedJob(job)} />
            ))}
          </div>
        )}
      </div>

      {selectedJob && <ApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
