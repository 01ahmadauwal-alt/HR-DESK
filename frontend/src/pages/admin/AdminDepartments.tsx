import { useQuery } from '@tanstack/react-query';
import { Building, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';

interface DeptSummary {
  _id: string;
  name: string;
  code: string;
  headcount: number;
  onDuty: number;
  onLeave: number;
  absent: number;
  hod?: { firstName: string; lastName: string; position: string };
  manager?: { firstName: string; lastName: string; position: string };
}

export default function AdminDepartments() {
  const { data: departments = [], isLoading } = useQuery<DeptSummary[]>({
    queryKey: ['admin-departments'],
    queryFn: () => api.get('/admin/departments').then(r => r.data),
  });

  if (isLoading) return <DashboardLayout title="Departments"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout title="Departments">
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Read-only view. Contact HR to create or modify departments.
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Departments', value: departments.length },
            { label: 'Total Headcount', value: departments.reduce((a, d) => a + d.headcount, 0) },
            { label: 'Currently On Duty', value: departments.reduce((a, d) => a + d.onDuty, 0) },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {departments.length === 0 ? (
          <div className="card"><EmptyState icon={Building} title="No departments" description="No departments have been created yet." /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div key={dept._id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 text-base">{dept.name}</h3>
                      <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-0.5 font-mono">{dept.code}</span>
                    </div>
                    {dept.hod && (
                      <p className="text-xs text-slate-500 mt-0.5">HOD: {dept.hod.firstName} {dept.hod.lastName} · {dept.hod.position}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                    <Users size={14} className="text-primary" />
                    {dept.headcount}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  <div className="bg-success-50 rounded-lg p-2.5 text-center">
                    <p className="text-xl font-bold text-success-700">{dept.onDuty}</p>
                    <p className="text-xs text-success-600">On Duty</p>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-2.5 text-center">
                    <p className="text-xl font-bold text-primary">{dept.onLeave}</p>
                    <p className="text-xs text-primary">On Leave</p>
                  </div>
                  <div className="bg-danger-50 rounded-lg p-2.5 text-center">
                    <p className="text-xl font-bold text-danger-600">{dept.absent}</p>
                    <p className="text-xs text-danger-600">Absent</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-success-400 rounded-full" style={{ width: `${dept.headcount > 0 ? (dept.onDuty / dept.headcount) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{dept.headcount > 0 ? Math.round((dept.onDuty / dept.headcount) * 100) : 0}% on duty today</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
