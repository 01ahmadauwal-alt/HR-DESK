import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/client';
import type { Attendance, Employee } from '../../types';
import { formatTime } from '../../utils/formatters';

export default function ManagerAttendance() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: records = [], isLoading } = useQuery<(Attendance & { employeeId: Employee })[]>({
    queryKey: ['manager-attendance', month, year],
    queryFn: () => api.get(`/manager/attendance?month=${month}&year=${year}`).then(r => r.data),
  });

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const monthLabel = new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
  };

  return (
    <DashboardLayout title="Team Attendance">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="btn-secondary px-2 py-1"><ChevronLeft size={16} /></button>
          <h2 className="text-base font-semibold text-slate-800 w-48 text-center">{monthLabel}</h2>
          <button onClick={next} className="btn-secondary px-2 py-1"><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Present', value: stats.present, cls: 'text-success-700 bg-success-50' },
            { label: 'Late', value: stats.late, cls: 'text-warning-600 bg-warning-50' },
            { label: 'Absent', value: stats.absent, cls: 'text-danger-600 bg-danger-50' },
            { label: 'On Leave', value: stats.onLeave, cls: 'text-primary bg-primary-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.cls} rounded-lg px-2 py-1 inline-block`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          {isLoading ? <LoadingSpinner /> : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No attendance records for this period</td></tr>
                  ) : records.map(r => (
                    <tr key={r._id}>
                      <td>
                        <p className="font-medium text-slate-800">{r.employeeId.firstName} {r.employeeId.lastName}</p>
                        <p className="text-xs text-slate-400">{r.employeeId.employeeId}</p>
                      </td>
                      <td>{new Date(r.date).toLocaleDateString('en-NG', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                      <td>{r.checkIn ? formatTime(r.checkIn) : '—'}</td>
                      <td>{r.checkOut ? formatTime(r.checkOut) : '—'}</td>
                      <td>{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                      <td><Badge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
