import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Server, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import api from '../../api/client';
import type { Attendance, Employee } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';

interface Device {
  _id: string;
  name: string;
  deviceType: string;
  apiEndpoint: string;
  status: 'active' | 'inactive' | 'error';
  lastSynced?: string;
  syncFrequency: number;
}

type Tab = 'records' | 'devices' | 'manual';

function AddDeviceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', deviceType: 'biometric', apiEndpoint: '', apiKey: '', secret: '', syncFrequency: 30 });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/attendance/devices', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['att-devices'] }); onClose(); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Attendance Device" size="lg">
      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(); }} className="space-y-4">
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Device Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Device Type</label>
            <select className="input" value={form.deviceType} onChange={e => setForm(f => ({ ...f, deviceType: e.target.value }))}>
              <option value="biometric">Biometric / Fingerprint</option>
              <option value="face_recognition">Face Recognition</option>
              <option value="rfid">RFID / Card</option>
              <option value="pin">PIN</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">API Endpoint</label>
          <input className="input" type="url" value={form.apiEndpoint} onChange={e => setForm(f => ({ ...f, apiEndpoint: e.target.value }))} placeholder="https://device.example.com/api/logs" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">API Key</label>
            <input className="input" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} />
          </div>
          <div>
            <label className="label">Secret</label>
            <input className="input" type="password" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Sync Frequency (minutes)</label>
          <input className="input" type="number" value={form.syncFrequency} onChange={e => setForm(f => ({ ...f, syncFrequency: Number(e.target.value) }))} min={5} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Adding...' : 'Add Device'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function HRAttendancePage() {
  const qc = useQueryClient();
  const today = new Date();
  const [tab, setTab] = useState<Tab>('records');
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [manualForm, setManualForm] = useState({ employeeId: '', date: '', status: 'present', checkIn: '', checkOut: '' });
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');

  const { data: records = [], isLoading: recordsLoading } = useQuery<(Attendance & { employeeId: Employee })[]>({
    queryKey: ['hr-attendance', month, year],
    queryFn: () => api.get(`/attendance/records?month=${month}&year=${year}`).then(r => r.data),
    enabled: tab === 'records',
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ['att-devices'],
    queryFn: () => api.get('/attendance/devices').then(r => r.data),
    enabled: tab === 'devices',
  });

  const syncDevice = useMutation({
    mutationFn: (id: string) => api.post(`/attendance/devices/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['att-devices'] }),
  });

  const manualMutation = useMutation({
    mutationFn: () => api.post('/attendance/manual', manualForm),
    onSuccess: () => { setManualSuccess('Attendance recorded.'); setManualForm({ employeeId: '', date: '', status: 'present', checkIn: '', checkOut: '' }); setTimeout(() => setManualSuccess(''), 3000); },
    onError: (err: { response?: { data?: { message?: string } } }) => setManualError(err.response?.data?.message ?? 'Failed'),
  });

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const monthLabel = new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  const TABS = [
    { key: 'records' as Tab, label: 'Records', icon: Clock },
    { key: 'devices' as Tab, label: 'Devices', icon: Server },
    { key: 'manual' as Tab, label: 'Manual Entry', icon: Plus },
  ];

  return (
    <DashboardLayout title="Attendance Management">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Records */}
        {tab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={prev} className="btn-secondary px-2 py-1"><ChevronLeft size={16} /></button>
              <h2 className="text-base font-semibold text-slate-800 w-48 text-center">{monthLabel}</h2>
              <button onClick={next} className="btn-secondary px-2 py-1"><ChevronRight size={16} /></button>
            </div>
            <div className="card">
              {recordsLoading ? <LoadingSpinner /> : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Source</th></tr></thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No records for this period</td></tr>
                      ) : records.map(r => (
                        <tr key={r._id}>
                          <td><p className="font-medium">{r.employeeId.firstName} {r.employeeId.lastName}</p><p className="text-xs text-slate-400">{r.employeeId.employeeId}</p></td>
                          <td>{new Date(r.date).toLocaleDateString('en-NG', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                          <td>{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                          <td>{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                          <td>{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                          <td><Badge status={r.status} /></td>
                          <td><span className="badge-gray capitalize">{r.source}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Devices */}
        {tab === 'devices' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddDevice(true)} className="btn-primary"><Plus size={14} /> Add Device</button>
            </div>
            <div className="card">
              {devicesLoading ? <LoadingSpinner /> : devices.length === 0 ? (
                <EmptyState icon={Server} title="No devices" description="Add an attendance device to start syncing records." action={<button onClick={() => setShowAddDevice(true)} className="btn-primary"><Plus size={14} /> Add Device</button>} />
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Device</th><th>Type</th><th>Endpoint</th><th>Status</th><th>Last Synced</th><th>Actions</th></tr></thead>
                    <tbody>
                      {devices.map(d => (
                        <tr key={d._id}>
                          <td className="font-medium">{d.name}</td>
                          <td className="capitalize text-slate-500">{d.deviceType.replace('_', ' ')}</td>
                          <td className="text-slate-500 text-xs max-w-xs truncate">{d.apiEndpoint}</td>
                          <td><Badge status={d.status} /></td>
                          <td className="text-slate-400">{d.lastSynced ? formatDate(d.lastSynced) : 'Never'}</td>
                          <td>
                            <button onClick={() => syncDevice.mutate(d._id)} disabled={syncDevice.isPending} className="btn-secondary px-3 py-1 text-xs">
                              <RefreshCw size={11} /> Sync Now
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
        )}

        {/* Manual Entry */}
        {tab === 'manual' && (
          <div className="card max-w-lg">
            <div className="card-header"><h3 className="font-semibold">Manual Attendance Entry</h3></div>
            <div className="card-body space-y-4">
              {manualSuccess && <div className="bg-success-50 text-success-700 rounded-lg px-3 py-2 text-sm">{manualSuccess}</div>}
              {manualError && <div className="bg-danger-50 text-danger-700 rounded-lg px-3 py-2 text-sm">{manualError}</div>}
              <div>
                <label className="label">Employee ID</label>
                <input className="input" value={manualForm.employeeId} onChange={e => setManualForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="e.g. EMP0001" />
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={manualForm.date} onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={manualForm.status} onChange={e => setManualForm(f => ({ ...f, status: e.target.value }))}>
                  {['present', 'absent', 'late', 'half_day', 'on_leave'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Check In</label>
                  <input className="input" type="time" value={manualForm.checkIn} onChange={e => setManualForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Check Out</label>
                  <input className="input" type="time" value={manualForm.checkOut} onChange={e => setManualForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
              </div>
              <button onClick={() => { setManualError(''); manualMutation.mutate(); }} disabled={manualMutation.isPending || !manualForm.employeeId || !manualForm.date} className="btn-primary w-full">
                {manualMutation.isPending ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        )}
      </div>

      <AddDeviceModal open={showAddDevice} onClose={() => setShowAddDevice(false)} />
    </DashboardLayout>
  );
}
