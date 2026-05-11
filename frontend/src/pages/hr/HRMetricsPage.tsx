import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Briefcase, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { HRMetrics } from '../../types';
import { formatNaira } from '../../utils/formatters';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function HRMetricsPage() {
  const { data: metrics, isLoading } = useQuery<HRMetrics>({
    queryKey: ['hr-metrics'],
    queryFn: () => api.get('/hr/metrics').then(r => r.data),
  });

  const { data: deptData = [] } = useQuery<{ name: string; count: number }[]>({
    queryKey: ['dept-headcount'],
    queryFn: () => api.get('/hr/metrics/departments').then(r => r.data),
  });

  const { data: genderData = [] } = useQuery<{ name: string; value: number }[]>({
    queryKey: ['gender-dist'],
    queryFn: () => api.get('/hr/metrics/gender').then(r => r.data),
  });

  const { data: leaveData = [] } = useQuery<{ month: string; count: number }[]>({
    queryKey: ['leave-trend'],
    queryFn: () => api.get('/hr/metrics/leave-trend').then(r => r.data),
  });

  if (isLoading) return <DashboardLayout title="HR Metrics"><LoadingSpinner /></DashboardLayout>;

  const stats = [
    { label: 'Total Employees', value: metrics?.totalEmployees ?? 0, icon: Users, color: 'text-primary bg-primary-50' },
    { label: 'Active Employees', value: metrics?.activeEmployees ?? 0, icon: Users, color: 'text-success-700 bg-success-50' },
    { label: 'Departments', value: metrics?.departments ?? 0, icon: Briefcase, color: 'text-warning-600 bg-warning-50' },
    { label: 'Pending Leaves', value: metrics?.pendingLeaves ?? 0, icon: Calendar, color: 'text-danger-600 bg-danger-50' },
    { label: 'Open Positions', value: metrics?.openJobs ?? 0, icon: TrendingUp, color: 'text-primary bg-primary-50' },
    { label: 'Payroll (Net)', value: metrics?.payroll ? formatNaira(metrics.payroll.totalNetPay) : '₦0', icon: DollarSign, color: 'text-success-700 bg-success-50', isLarge: true },
  ];

  return (
    <DashboardLayout title="HR Metrics">
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`font-bold mt-1 ${s.isLarge ? 'text-xl' : 'text-2xl'} text-slate-800`}>{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payroll summary */}
        {metrics?.payroll && (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-800">Last Payroll Run</h3>
            </div>
            <div className="card-body grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total Gross</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{formatNaira(metrics.payroll.totalGross)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Total Net Pay</p>
                <p className="text-xl font-bold text-success-700 mt-1">{formatNaira(metrics.payroll.totalNetPay)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Employees Paid</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{metrics.payroll.processedCount}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Headcount by department */}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Headcount by Department</h3></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender distribution */}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Gender Distribution</h3></div>
            <div className="p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPie>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leave trend */}
          <div className="card lg:col-span-2">
            <div className="card-header"><h3 className="font-semibold">Leave Requests (Last 6 Months)</h3></div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
