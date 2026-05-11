import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, CheckCircle, Clock, Download, Shield } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import { formatDate } from '../../utils/formatters';

interface Doc {
  _id: string;
  employeeId: { _id: string; firstName: string; lastName: string; employeeId: string };
  type: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  birth_cert: 'Birth Certificate',
  edu_cert: 'Educational Certificate',
  id_card: 'Government ID / NIN',
  passport: 'International Passport',
  offer_letter: 'Offer Letter',
  other: 'Other',
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HRDocuments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ['hr-documents'],
    queryFn: () => api.get('/hr/documents').then(r => r.data),
  });

  const verify = useMutation({
    mutationFn: (id: string) => api.put(`/hr/documents/${id}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr-documents'] }),
  });

  const handleDownload = async (docId: string, fileName: string) => {
    const res = await api.get(`/hr/documents/${docId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = docs.filter(d => {
    const name = `${d.employeeId.firstName} ${d.employeeId.lastName} ${d.employeeId.employeeId}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchVerified = verifiedFilter === 'all' || (verifiedFilter === 'verified' ? !!d.verifiedAt : !d.verifiedAt);
    return matchSearch && matchType && matchVerified;
  });

  return (
    <DashboardLayout title="Documents">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 w-56" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="input w-40" value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Documents', value: docs.length },
            { label: 'Verified', value: docs.filter(d => d.verifiedAt).length },
            { label: 'Pending Verification', value: docs.filter(d => !d.verifiedAt).length },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="card">
          {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Employee documents will appear here." />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Document</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <p className="font-medium text-slate-800">{doc.employeeId.firstName} {doc.employeeId.lastName}</p>
                        <p className="text-xs text-slate-400">{doc.employeeId.employeeId}</p>
                      </td>
                      <td className="font-medium text-slate-700 max-w-xs truncate">{doc.fileName}</td>
                      <td>{DOC_TYPE_LABELS[doc.type] ?? doc.type}</td>
                      <td className="text-slate-500">{formatSize(doc.fileSize)}</td>
                      <td>{formatDate(doc.uploadedAt)}</td>
                      <td>
                        {doc.verifiedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-700 bg-success-50 rounded-full px-2 py-0.5">
                            <CheckCircle size={11} /> Verified {formatDate(doc.verifiedAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-warning-700 bg-warning-50 rounded-full px-2 py-0.5">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => handleDownload(doc._id, doc.fileName)} className="btn-secondary px-2 py-1 text-xs">
                            <Download size={11} />
                          </button>
                          {!doc.verifiedAt && (
                            <button onClick={() => verify.mutate(doc._id)} disabled={verify.isPending} className="btn-primary px-2 py-1 text-xs">
                              <Shield size={11} /> Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
