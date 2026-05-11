import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { Employee, LeaveRequest, Task } from '../../types';
import { formatDate, getInitials, LEAVE_TYPE_LABELS } from '../../utils/formatters';

export default function ManagerDashboard() {
  const { data: team = [], isLoading } = useQuery<(Employee & { todayStatus: string })[]>({
    queryKey: ['manager-team'],
    queryFn: () => api.get('/manager/team').then((r) => r.data),
  });

  const { data: pendingLeaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['manager-pending-leaves'],
    queryFn: () => api.get('/manager/leaves/pending').then((r) => r.data),
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['manager-tasks'],
    queryFn: () => api.get('/manager/tasks').then((r) => r.data),
  });

  const onDuty = team.filter((e) => e.todayStatus === 'on_duty').length;
  const onLeave = team.filter((e) => e.todayStatus === 'on_leave').length;
  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');

  if (isLoading) return <DashboardLayout title="Manager Dashboard"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Team" value={team.length} icon={Users} iconBg="bg-primary-50" iconColor="text-primary" />
          <StatCard title="On Duty Today" value={onDuty} icon={Clock} iconBg="bg-success-50" iconColor="text-success" />
          <StatCard title="On Leave" value={onLeave} icon={Calendar} iconBg="bg-warning-50" iconColor="text-warning" />
          <StatCard title="Pending Approvals" value={pendingLeaves.length} icon={Calendar} iconBg="bg-danger-50" iconColor="text-danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Status */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title">Team Status Today</h3>
              <Link to="/manager/team" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {team.slice(0, 6).map((emp) => (
                <div key={emp._id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-400">{emp.position}</p>
                    </div>
                  </div>
                  <Badge status={emp.todayStatus} />
                </div>
              ))}
              {team.length === 0 && (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No team members found</p>
              )}
            </div>
          </div>

          {/* Pending Leave Approvals */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title">Leave Requests</h3>
              <Link to="/manager/leaves" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingLeaves.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No pending requests</p>
              ) : (
                pendingLeaves.slice(0, 4).map((leave) => {
                  const emp = leave.employeeId as Employee;
                  return (
                    <div key={leave._id} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{emp?.firstName} {emp?.lastName}</p>
                          <p className="text-xs text-slate-400">
                            {LEAVE_TYPE_LABELS[leave.type]} · {leave.days} day{leave.days > 1 ? 's' : ''} · {formatDate(leave.startDate)}
                          </p>
                        </div>
                        <Link to="/manager/leaves" className="text-xs text-primary hover:underline">Review</Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Department Tasks</h3>
            <Link to="/manager/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No active tasks</td></tr>
                ) : (
                  activeTasks.slice(0, 5).map((task) => (
                    <tr key={task._id}>
                      <td className="font-medium">{task.title}</td>
                      <td>
                        {task.assignedTo.map((a) => {
                          const emp = a.employeeId as Employee;
                          return emp?.firstName ? `${emp.firstName} ${emp.lastName}` : '—';
                        }).join(', ')}
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td><Badge status={task.priority} /></td>
                      <td><Badge status={task.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
