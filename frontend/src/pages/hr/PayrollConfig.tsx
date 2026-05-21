import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { PayrollConfig as IPayrollConfig } from '../../types';

type Tab = 'tax' | 'pension' | 'deductions' | 'custom';

export default function PayrollConfig() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('tax');
  const [config, setConfig] = useState<Partial<IPayrollConfig>>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery<IPayrollConfig>({
    queryKey: ['payroll-config'],
    queryFn: () => api.get('/hr/payroll/config').then(r => r.data),
  });

  useEffect(() => { if (data) setConfig(data); }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.put('/hr/payroll/config', config),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payroll-config'] }); setSuccess('Configuration saved.'); setTimeout(() => setSuccess(''), 3000); },
    onError: (err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message ?? 'Failed to save'),
  });

  const updateBracket = (idx: number, field: string, value: string) =>
    setConfig(c => ({ ...c, taxBrackets: c.taxBrackets?.map((b, i) => i === idx ? { ...b, [field]: field === 'max' && value === '' ? null : Number(value) } : b) }));

  const addCustomDeduction = () =>
    setConfig(c => ({ ...c, deductions: [...(c.deductions ?? []), { name: '', code: '', type: 'fixed', value: 0, taxRelief: false, active: true }] }));

  const removeCustomDeduction = (idx: number) =>
    setConfig(c => ({ ...c, deductions: c.deductions?.filter((_, i) => i !== idx) }));

  const updateDeduction = (idx: number, field: string, value: unknown) =>
    setConfig(c => ({ ...c, deductions: c.deductions?.map((d, i) => i === idx ? { ...d, [field]: value } : d) }));

  if (isLoading) return <DashboardLayout title="Payroll Configuration"><LoadingSpinner /></DashboardLayout>;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'tax', label: 'Tax Brackets' },
    { key: 'pension', label: 'Pension & Statutory' },
    { key: 'deductions', label: 'Optional Deductions' },
    { key: 'custom', label: 'Custom Deductions' },
  ];

  return (
    <DashboardLayout title="Payroll Configuration">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {success && <div className="bg-success-50 text-success-700 rounded-lg px-4 py-2 text-sm">{success}</div>}
        {error && <div className="bg-danger-50 text-danger-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

        {/* Tax Brackets */}
        {tab === 'tax' && (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">PAYE Tax Brackets (Annual Taxable Income)</h3></div>
            <div className="card-body space-y-3">
              {config.taxBrackets?.map((b, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="label">Min (₦)</label>
                    <input className="input" type="number" value={b.min} onChange={e => updateBracket(i, 'min', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Max (₦) — blank = no limit</label>
                    <input className="input" type="number" value={b.max ?? ''} onChange={e => updateBracket(i, 'max', e.target.value)} placeholder="No limit" />
                  </div>
                  <div>
                    <label className="label">Rate (%)</label>
                    <input className="input" type="number" step="0.1" value={b.rate} onChange={e => updateBracket(i, 'rate', e.target.value)} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400">These are the standard Nigerian FIRS PAYE brackets. Modify only if regulations change.</p>
            </div>
          </div>
        )}

        {/* Pension & Statutory */}
        {tab === 'pension' && (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Pension & Statutory Rates</h3></div>
            <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Pension Employee Rate (%)</label>
                <input className="input" type="number" step="0.1" value={config.pensionEmployeeRate ?? ''} onChange={e => setConfig(c => ({ ...c, pensionEmployeeRate: Number(e.target.value) }))} />
                <p className="text-xs text-slate-400 mt-1">Default: 8% of pensionable pay (basic + housing + transport)</p>
              </div>
              <div>
                <label className="label">Pension Employer Rate (%)</label>
                <input className="input" type="number" step="0.1" value={config.pensionEmployerRate ?? ''} onChange={e => setConfig(c => ({ ...c, pensionEmployerRate: Number(e.target.value) }))} />
                <p className="text-xs text-slate-400 mt-1">Default: 10%</p>
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={config.nhfEnabled ?? true} onChange={e => setConfig(c => ({ ...c, nhfEnabled: e.target.checked }))} />
                  NHF Enabled
                </label>
              </div>
              <div>
                <label className="label">NHF Rate (%)</label>
                <input className="input" type="number" step="0.1" value={config.nhfRate ?? ''} onChange={e => setConfig(c => ({ ...c, nhfRate: Number(e.target.value) }))} disabled={!config.nhfEnabled} />
                <p className="text-xs text-slate-400 mt-1">Default: 2.5% of basic salary</p>
              </div>
            </div>
          </div>
        )}

        {/* Optional Deductions */}
        {tab === 'deductions' && (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Optional Deductions</h3></div>
            <div className="card-body space-y-4">
              {/* Life Insurance */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Life Insurance</p>
                  <p className="text-xs text-slate-400">Percentage of basic salary</p>
                </div>
                <div className="flex items-center gap-3">
                  <input className="input w-24" type="number" step="0.1" value={config.lifeInsuranceRate ?? ''} onChange={e => setConfig(c => ({ ...c, lifeInsuranceRate: Number(e.target.value) }))} disabled={!config.lifeInsuranceEnabled} placeholder="%" />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={config.lifeInsuranceEnabled ?? false} onChange={e => setConfig(c => ({ ...c, lifeInsuranceEnabled: e.target.checked }))} />
                    <span className="text-sm text-slate-600">Enable</span>
                  </label>
                </div>
              </div>
              {/* Health Insurance */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Health / HMO Insurance</p>
                  <p className="text-xs text-slate-400">Fixed amount per employee (₦)</p>
                </div>
                <div className="flex items-center gap-3">
                  <input className="input w-32" type="number" value={config.healthInsuranceAmount ?? ''} onChange={e => setConfig(c => ({ ...c, healthInsuranceAmount: Number(e.target.value) }))} disabled={!config.healthInsuranceEnabled} placeholder="₦" />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={config.healthInsuranceEnabled ?? false} onChange={e => setConfig(c => ({ ...c, healthInsuranceEnabled: e.target.checked }))} />
                    <span className="text-sm text-slate-600">Enable</span>
                  </label>
                </div>
              </div>
              {/* Union Dues */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Union / Association Dues</p>
                  <p className="text-xs text-slate-400">Fixed amount (₦)</p>
                </div>
                <div className="flex items-center gap-3">
                  <input className="input w-32" type="number" value={config.unionDueAmount ?? ''} onChange={e => setConfig(c => ({ ...c, unionDueAmount: Number(e.target.value) }))} disabled={!config.unionDueEnabled} placeholder="₦" />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={config.unionDueEnabled ?? false} onChange={e => setConfig(c => ({ ...c, unionDueEnabled: e.target.checked }))} />
                    <span className="text-sm text-slate-600">Enable</span>
                  </label>
                </div>
              </div>
              {/* Staff Welfare */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Staff Welfare Levy</p>
                  <p className="text-xs text-slate-400">Fixed amount (₦)</p>
                </div>
                <div className="flex items-center gap-3">
                  <input className="input w-32" type="number" value={config.staffWelfareLevyAmount ?? ''} onChange={e => setConfig(c => ({ ...c, staffWelfareLevyAmount: Number(e.target.value) }))} disabled={!config.staffWelfareLevyEnabled} placeholder="₦" />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={config.staffWelfareLevyEnabled ?? false} onChange={e => setConfig(c => ({ ...c, staffWelfareLevyEnabled: e.target.checked }))} />
                    <span className="text-sm text-slate-600">Enable</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Deductions */}
        {tab === 'custom' && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold">Custom Deductions</h3>
              <button onClick={addCustomDeduction} className="btn-secondary text-xs"><Plus size={13} /> Add</button>
            </div>
            <div className="card-body space-y-4">
              {(config.deductions ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No custom deductions. Click "Add" to create one.</p>
              ) : (
                (config.deductions ?? []).map((d, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    <button onClick={() => removeCustomDeduction(i)} className="absolute top-2 right-2 text-slate-400 hover:text-danger-500">
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <label className="label">Name</label>
                      <input className="input" value={d.name} onChange={e => updateDeduction(i, 'name', e.target.value)} placeholder="e.g. Cooperative" />
                    </div>
                    <div>
                      <label className="label">Code</label>
                      <input className="input" value={d.code} onChange={e => updateDeduction(i, 'code', e.target.value)} placeholder="e.g. COOP" />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="input" value={d.type} onChange={e => updateDeduction(i, 'type', e.target.value)}>
                        <option value="fixed">Fixed (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Value</label>
                      <input className="input" type="number" value={d.value} onChange={e => updateDeduction(i, 'value', Number(e.target.value))} />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" checked={d.taxRelief} onChange={e => updateDeduction(i, 'taxRelief', e.target.checked)} />
                        Tax Relief
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="rounded" checked={d.active} onChange={e => updateDeduction(i, 'active', e.target.checked)} />
                        Active
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button onClick={() => { setError(''); saveMutation.mutate(); }} disabled={saveMutation.isPending} className="btn-primary">
            <Settings size={14} />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
