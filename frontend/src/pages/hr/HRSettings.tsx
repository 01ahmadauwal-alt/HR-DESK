import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, Hash, MessageSquare, Briefcase, Building, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: React.ElementType;
  fields: { key: string; label: string; type?: string }[];
}

const INTEGRATIONS: Omit<Integration, 'connected'>[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to your Slack workspace when leave is approved, tasks are assigned, etc.',
    icon: Hash,
    fields: [{ key: 'webhookUrl', label: 'Webhook URL' }, { key: 'channel', label: 'Channel (e.g. #hr-notifications)' }],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Auto-create Asana tasks when workflow tasks are assigned to employees.',
    icon: Briefcase,
    fields: [{ key: 'accessToken', label: 'Personal Access Token', type: 'password' }, { key: 'workspaceId', label: 'Workspace ID' }, { key: 'projectId', label: 'Project ID' }],
  },
  {
    id: 'remita',
    name: 'Remita',
    description: 'Process payroll disbursements via Remita payment gateway.',
    icon: CreditCard,
    fields: [{ key: 'merchantId', label: 'Merchant ID' }, { key: 'apiKey', label: 'API Key', type: 'password' }, { key: 'serviceTypeId', label: 'Service Type ID' }],
  },
  {
    id: 'twilio',
    name: 'Twilio WhatsApp',
    description: 'Send WhatsApp notifications via Twilio for leave approvals, task assignments, and more.',
    icon: MessageSquare,
    fields: [{ key: 'accountSid', label: 'Account SID' }, { key: 'authToken', label: 'Auth Token', type: 'password' }, { key: 'fromNumber', label: 'WhatsApp From Number (e.g. +14155238886)' }],
  },
];

function IntegrationCard({ integration }: { integration: Omit<Integration, 'connected'> & { connected: boolean } }) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const connect = useMutation({
    mutationFn: () => api.post(`/hr/integrations/${integration.id}/connect`, fields),
    onSuccess: (res) => { setStatus('success'); setMessage(res.data?.message ?? 'Connected!'); },
    onError: (err: { response?: { data?: { message?: string } } }) => { setStatus('error'); setMessage(err.response?.data?.message ?? 'Connection failed'); },
  });

  const disconnect = useMutation({
    mutationFn: () => api.post(`/hr/integrations/${integration.id}/disconnect`),
    onSuccess: () => { setStatus('idle'); setMessage(''); },
  });

  const test = useMutation({
    mutationFn: () => api.post(`/hr/integrations/${integration.id}/test`),
    onSuccess: () => { setStatus('success'); setMessage('Connection test passed!'); },
    onError: () => { setStatus('error'); setMessage('Test failed — check your credentials.'); },
  });

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <integration.icon size={20} className="text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{integration.name}</h3>
                {integration.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success-700 bg-success-50 rounded-full px-2 py-0.5">
                    <CheckCircle size={11} /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    <XCircle size={11} /> Not connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {integration.connected && (
              <>
                <button onClick={() => test.mutate()} disabled={test.isPending} className="btn-secondary text-xs px-3 py-1">Test</button>
                <button onClick={() => disconnect.mutate()} disabled={disconnect.isPending} className="btn-danger text-xs px-3 py-1">Disconnect</button>
              </>
            )}
            {!integration.connected && (
              <button onClick={() => setExpanded(!expanded)} className="btn-primary text-xs px-3 py-1">
                <Link size={11} /> Configure
              </button>
            )}
          </div>
        </div>

        {expanded && !integration.connected && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {status === 'success' && <div className="bg-success-50 text-success-700 rounded-lg px-3 py-2 text-sm">{message}</div>}
            {status === 'error' && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{message}</div>}
            {integration.fields.map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input" type={f.type ?? 'text'} value={fields[f.key] ?? ''} onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => setExpanded(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => connect.mutate()} disabled={connect.isPending} className="btn-primary">
                {connect.isPending ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        )}

        {status !== 'idle' && integration.connected && (
          <p className={`text-xs mt-2 ${status === 'success' ? 'text-success-600' : 'text-danger-600'}`}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default function HRSettings() {
  const { data: connectedIntegrations = [] } = useQuery<string[]>({
    queryKey: ['hr-integrations'],
    queryFn: () => api.get('/hr/integrations').then(r => r.data?.connected ?? []),
  });

  return (
    <DashboardLayout title="Settings & Integrations">
      <div className="space-y-6">
        <div>
          <h2 className="section-title mb-1">API Integrations</h2>
          <p className="text-sm text-slate-500">Connect HR-DESK to your organisation's tools for notifications, payroll disbursement, and task management.</p>
        </div>

        <div className="space-y-3">
          {INTEGRATIONS.map(intg => (
            <IntegrationCard key={intg.id} integration={{ ...intg, connected: connectedIntegrations.includes(intg.id) }} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
