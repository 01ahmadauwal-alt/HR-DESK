import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, Calendar, DollarSign, TrendingUp, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { HRMetrics } from '../../types';
import { formatNaira } from '../../utils/formatters';

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useQuery<HRMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/hr/metrics').then(r => r.data),
  });

  const { data: deptData = [] } = useQuery<{ name: string; count: number; onDuty: number; onLeave: number }[]>({
    queryKey: ['admin-dept-summary'],
    queryFn: () => api.get('/hr/metrics/departments').then(r => r.data),
  });

  if (isLoading) return <DashboardLayout title="Admin Overview"><LoadingSpinner /></DashboardLayout>;

  const stats = [
    { label: 'Total Employees', value: metrics?.totalEmployees ?? 0, icon: Users, color: 'bg-primary-50 text-primary' },
    { label: 'Active Employees', value: metrics?.activeEmployees ?? 0, icon: TrendingUp, color: 'bg-success-50 text-success-700' },
    { label: 'Departments', value: metrics?.departments ?? 0, icon: Building, color: 'bg-warning-50 text-warning-600' },
    { label: 'Pending Leaves', value: metrics?.pendingLeaves ?? 0, icon: Calendar, color: 'bg-danger-50 text-danger-600' },
    { label: 'Open Positions', value: metrics?.openJobs ?? 0, icon: Briefcase, color: 'bg-primary-50 text-primary' },
    { label: 'Last Payroll Net', value: metrics?.payroll ? formatNaira(metrics.payroll.totalNetPay) : '₦0', icon: DollarSign, color: 'bg-success-50 text-success-700', isLarge: true },
  ];

  return (
    <DashboardLayout title="Admin Overview">
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          You are viewing in read-only mode. Contact HR to make any changes.
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`font-bold mt-1 ${s.isLarge ? 'text-lg' : 'text-2xl'} text-slate-800`}>{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Headcount chart */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Headcount by Department</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Employees" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department cards */}
        {deptData.length > 0 && (
          <div>
            <h3 className="section-title mb-3">Departments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptData.map(dept => (
                <div key={dept.name} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-800">{dept.name}</h4>
                    <span className="text-xs bg-primary-50 text-primary rounded-full px-2 py-0.5">{dept.count} employees</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-success-50 rounded-lg p-2 text-center">
                      <p className="font-bold text-success-700 text-lg">{dept.onDuty ?? 0}</p>
                      <p className="text-success-600">On Duty</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-2 text-center">
                      <p className="font-bold text-primary text-lg">{dept.onLeave ?? 0}</p>
                      <p className="text-primary">On Leave</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
