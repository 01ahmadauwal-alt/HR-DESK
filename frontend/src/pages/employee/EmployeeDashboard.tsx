import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, DollarSign, Workflow, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import api from '../../api/client';
import type { LeaveBalance, LeaveRequest, Payslip, Task, Attendance } from '../../types';
import { formatNaira, formatDate, formatTime, getMonthName, LEAVE_TYPE_LABELS } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: balance } = useQuery<LeaveBalance>({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/employee/leaves/balance').then((r) => r.data),
  });

  const { data: leaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/employee/leaves').then((r) => r.data),
  });

  const { data: payslipsData } = useQuery<Payslip[]>({
    queryKey: ['my-payslips'],
    queryFn: () => api.get('/employee/payslips').then((r) => r.data),
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => api.get('/employee/tasks').then((r) => r.data),
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['my-attendance'],
    queryFn: () => {
      const now = new Date();
      return api.get(`/employee/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then((r) => r.data);
    },
  });

  const remainingLeave = balance ? balance.annual - balance.usedAnnual : 0;
  const pendingTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const latestPayslip = payslipsData?.[0];
  const todayAttendance = attendance.find((a) => {
    const d = new Date(a.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const recentLeaves = leaves.slice(0, 3);

  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-primary to-primary-700 rounded-2xl p-6 text-white">
          <p className="text-primary-100 text-sm">Welcome back,</p>
          <h2 className="text-xl font-bold mt-0.5">{user?.username ?? user?.email?.split('@')[0]}</h2>
          <p className="text-primary-200 text-xs mt-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Leave Balance"
            value={`${remainingLeave} days`}
            icon={Calendar}
            iconBg="bg-primary-50"
            iconColor="text-primary"
            subtitle="annual remaining"
          />
          <StatCard
            title="Today's Status"
            value={todayAttendance?.status === 'present' ? 'Present' : todayAttendance?.status === 'late' ? 'Late' : 'Not Checked In'}
            icon={Clock}
            iconBg={todayAttendance?.checkIn ? 'bg-success-50' : 'bg-slate-100'}
            iconColor={todayAttendance?.checkIn ? 'text-success' : 'text-slate-400'}
            subtitle={todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : undefined}
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks.length}
            icon={Workflow}
            iconBg="bg-warning-50"
            iconColor="text-warning"
            subtitle="to complete"
          />
          <StatCard
            title="Last Payslip"
            value={latestPayslip ? formatNaira((latestPayslip.payrollId as { netPay?: number })?.netPay) : '—'}
            icon={DollarSign}
            iconBg="bg-success-50"
            iconColor="text-success"
            subtitle={latestPayslip ? getMonthName(
              (latestPayslip.payrollId as { month?: number })?.month ?? 1,
              (latestPayslip.payrollId as { year?: number })?.year ?? new Date().getFullYear()
            ) : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leave Requests */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title">Recent Leave Requests</h3>
              <Link to="/employee/leave" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentLeaves.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No leave requests yet</p>
              ) : (
                recentLeaves.map((leave) => (
                  <div key={leave._id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{LEAVE_TYPE_LABELS[leave.type]}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.days} day{leave.days > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge status={leave.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title">My Tasks</h3>
              <Link to="/employee/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingTasks.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No pending tasks</p>
              ) : (
                pendingTasks.slice(0, 4).map((task) => (
                  <div key={task._id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Due {formatDate(task.dueDate)}</p>
                    </div>
                    <Badge status={task.priority} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
