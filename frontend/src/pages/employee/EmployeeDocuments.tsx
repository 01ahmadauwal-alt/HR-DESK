import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Download, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import { formatDate } from '../../utils/formatters';

interface Doc {
  _id: string;
  type: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const DOC_TYPES = [
  { value: 'birth_cert', label: 'Birth Certificate' },
  { value: 'edu_cert', label: 'Educational Certificate' },
  { value: 'id_card', label: 'Government ID / NIN' },
  { value: 'passport', label: 'International Passport' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'other', label: 'Other' },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmployeeDocuments() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('birth_cert');
  const [uploadError, setUploadError] = useState('');

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ['my-documents'],
    queryFn: () => api.get('/employee/documents').then(r => r.data),
  });

  const upload = useMutation({
    mutationFn: (fd: FormData) => api.post('/employee/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-documents'] }); setUploadError(''); },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setUploadError(err.response?.data?.message ?? 'Upload failed'),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', docType);
    upload.mutate(fd);
    e.target.value = '';
  };

  const handleDownload = async (docId: string, fileName: string) => {
    const res = await api.get(`/employee/documents/${docId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeLabel = (type: string) => DOC_TYPES.find(d => d.value === type)?.label ?? type;

  return (
    <DashboardLayout title="My Documents">
      <div className="space-y-4">
        {/* Upload section */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Upload Document</h3>
          </div>
          <div className="card-body">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="label">Document Type</label>
                <select className="input w-48" value={docType} onChange={e => setDocType(e.target.value)}>
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button
                className="btn-primary"
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
              >
                <Upload size={14} />
                {upload.isPending ? 'Uploading...' : 'Choose File'}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFile} />
            </div>
            {uploadError && <p className="text-sm text-danger-600 mt-2">{uploadError}</p>}
            <p className="text-xs text-slate-400 mt-2">Accepted: PDF, JPG, PNG, DOC, DOCX — max 10MB</p>
          </div>
        </div>

        {/* Documents list */}
        <div className="card">
          {isLoading ? <LoadingSpinner /> : docs.length === 0 ? (
            <EmptyState icon={FileText} title="No documents uploaded" description="Upload your documents and they will appear here for HR verification." />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc._id}>
                      <td className="font-medium text-slate-700">{doc.fileName}</td>
                      <td>{getTypeLabel(doc.type)}</td>
                      <td className="text-slate-500">{formatSize(doc.fileSize)}</td>
                      <td>{formatDate(doc.uploadedAt)}</td>
                      <td>
                        {doc.verifiedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-700 bg-success-50 rounded-full px-2 py-0.5 font-medium">
                            <CheckCircle size={11} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-warning-700 bg-warning-50 rounded-full px-2 py-0.5 font-medium">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDownload(doc._id, doc.fileName)}
                          className="btn-secondary px-3 py-1 text-xs"
                        >
                          <Download size={12} /> Download
                        </button>
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
