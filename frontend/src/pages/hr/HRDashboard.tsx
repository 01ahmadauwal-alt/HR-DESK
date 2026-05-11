import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Calendar, Briefcase, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { HRMetrics, LeaveRequest, Employee } from '../../types';
import { formatNaira, formatDate, getMonthName, LEAVE_TYPE_LABELS } from '../../utils/formatters';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function HRDashboard() {
  const { data: metrics, isLoading } = useQuery<HRMetrics>({
    queryKey: ['hr-metrics'],
    queryFn: () => api.get('/hr/metrics').then((r) => r.data),
  });

  const { data: pendingLeaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['hr-pending-leaves'],
    queryFn: () => api.get('/hr/leaves?status=pending_hr').then((r) => r.data),
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['hr-employees'],
    queryFn: () => api.get('/hr/employees').then((r) => r.data),
  });

  if (isLoading) return <DashboardLayout title="HR Dashboard"><LoadingSpinner /></DashboardLayout>;

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => {
    const dept = typeof e.department === 'object' ? e.department?.name : 'Unassigned';
    deptCounts[dept ?? 'Unassigned'] = (deptCounts[dept ?? 'Unassigned'] ?? 0) + 1;
  });
  const deptData = Object.entries(deptCounts).map(([name, count]) => ({ name, count }));

  // Gender breakdown
  const genderData = [
    { name: 'Male', value: employees.filter((e) => e.gender === 'male').length },
    { name: 'Female', value: employees.filter((e) => e.gender === 'female').length },
    { name: 'Other', value: employees.filter((e) => !e.gender).length },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout title="HR Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={metrics?.totalEmployees ?? 0}
            icon={Users}
            iconBg="bg-primary-50"
            iconColor="text-primary"
            subtitle={`${metrics?.activeEmployees} active`}
          />
          <StatCard
            title="Payroll (This Month)"
            value={formatNaira(metrics?.payroll.totalNetPay)}
            icon={DollarSign}
            iconBg="bg-success-50"
            iconColor="text-success"
            subtitle={metrics?.payroll ? getMonthName(metrics.payroll.month, metrics.payroll.year) : ''}
          />
          <StatCard
            title="Pending Leaves"
            value={metrics?.pendingLeaves ?? 0}
            icon={Calendar}
            iconBg="bg-warning-50"
            iconColor="text-warning"
            subtitle="awaiting approval"
          />
          <StatCard
            title="Open Positions"
            value={metrics?.openJobs ?? 0}
            icon={Briefcase}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            subtitle="active job posts"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department headcount */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h3 className="section-title">Headcount by Department</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">Gender Ratio</h3>
            </div>
            <div className="p-4 flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {genderData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-slate-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pending HR Leave Approvals */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Pending Leave Approvals</h3>
            <Link to="/hr/leaves" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pendingLeaves.slice(0, 5).map((leave) => {
                    const emp = leave.employeeId as Employee;
                    return (
                      <tr key={leave._id}>
                        <td className="font-medium">{emp?.firstName} {emp?.lastName}</td>
                        <td>{LEAVE_TYPE_LABELS[leave.type]}</td>
                        <td>{leave.days} day{leave.days > 1 ? 's' : ''}</td>
                        <td>{formatDate(leave.createdAt)}</td>
                        <td><Badge status={leave.status} /></td>
                        <td>
                          <Link to={`/hr/leaves`} className="text-xs text-primary hover:underline">
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
