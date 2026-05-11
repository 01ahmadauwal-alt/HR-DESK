import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { Employee } from '../../types';
import { getInitials, formatDate } from '../../utils/formatters';

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    on_duty: 'bg-success-50 text-success-700',
    on_leave: 'bg-primary-50 text-primary',
    absent: 'bg-danger-50 text-danger-600',
  };
  const labels: Record<string, string> = { on_duty: 'On Duty', on_leave: 'On Leave', absent: 'Absent' };
  const cls = map[status ?? ''] ?? 'bg-slate-100 text-slate-500';
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${cls}`}>{labels[status ?? ''] ?? 'Unknown'}</span>;
}

export default function ManagerTeam() {
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['manager-team'],
    queryFn: () => api.get('/manager/team').then(r => r.data),
  });

  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName} ${m.position}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: members.length,
    onDuty: members.filter(m => m.todayStatus === 'on_duty').length,
    onLeave: members.filter(m => m.todayStatus === 'on_leave').length,
    absent: members.filter(m => m.todayStatus === 'absent').length,
  };

  return (
    <DashboardLayout title="My Team">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, cls: 'text-primary bg-primary-50' },
            { label: 'On Duty', value: stats.onDuty, cls: 'text-success-700 bg-success-50' },
            { label: 'On Leave', value: stats.onLeave, cls: 'text-primary bg-primary-50' },
            { label: 'Absent', value: stats.absent, cls: 'text-danger-600 bg-danger-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.cls} rounded-lg px-2 py-1 inline-block`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search team members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Team grid */}
        {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="card"><EmptyState icon={Users} title="No team members" description="Your team members will appear here." /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {getInitials(m.firstName, m.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.position}</p>
                    <p className="text-xs text-slate-400">{m.employeeId}</p>
                  </div>
                  <StatusBadge status={m.todayStatus} />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">Email</span>
                    <p className="truncate">{m.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Joined</span>
                    <p>{formatDate(m.hireDate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
