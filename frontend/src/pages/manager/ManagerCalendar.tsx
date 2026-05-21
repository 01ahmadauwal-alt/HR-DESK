import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, CalendarDays, Briefcase } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api/client';

interface CalendarEvent {
  id: string;
  type: 'leave' | 'task';
  title: string;
  start: string;
  end: string;
  color: 'amber' | 'blue';
  priority?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function eventsBetween(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.start);
    const end   = new Date(e.end);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return day >= start && day <= end;
  });
}

export default function ManagerCalendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [selected, setSelected] = useState<Date | null>(null);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ['manager-calendar', month, year],
    queryFn: () => api.get(`/manager/calendar?month=${month}&year=${year}`).then(r => r.data),
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= daysInMonth ? new Date(year, month - 1, d) : null;
  });

  const selectedEvents = selected ? eventsBetween(events, selected) : [];
  const leaveCount = events.filter(e => e.type === 'leave').length;
  const taskCount  = events.filter(e => e.type === 'task').length;

  return (
    <DashboardLayout title="Team Calendar">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xs">
          <div className="card">
            <div className="card-body py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <CalendarDays size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Leaves</p>
                <p className="text-lg font-bold text-slate-800">{leaveCount}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Briefcase size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tasks due</p>
                <p className="text-lg font-bold text-slate-800">{taskCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-2 card">
            <div className="card-body">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-800">
                  {MONTHS[month - 1]} {year}
                </h2>
                <div className="flex gap-1">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Today
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} className="bg-slate-50 min-h-[72px]" />;
                  const dayEvents = eventsBetween(events, day);
                  const isToday = day.toDateString() === now.toDateString();
                  const isSelected = selected?.toDateString() === day.toDateString();

                  return (
                    <div
                      key={i}
                      onClick={() => setSelected(isSelected ? null : day)}
                      className={`bg-white min-h-[72px] p-1.5 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isToday ? 'bg-primary text-white' : 'text-slate-600'
                      }`}>
                        {day.getDate()}
                      </span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev, j) => (
                          <div
                            key={j}
                            className={`text-xs truncate rounded px-1 py-0.5 leading-tight ${
                              ev.type === 'leave'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-slate-400 pl-1">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-200" />
                  <span className="text-xs text-slate-500">Approved leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-200" />
                  <span className="text-xs text-slate-500">Task due date</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                {selected
                  ? selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Select a day'}
              </h3>
              {!selected && (
                <p className="text-sm text-slate-400">Click any date on the calendar to see events for that day.</p>
              )}
              {selected && selectedEvents.length === 0 && (
                <p className="text-sm text-slate-400">No events on this day.</p>
              )}
              <div className="space-y-2">
                {selectedEvents.map((ev) => (
                  <div
                    key={String(ev.id)}
                    className={`rounded-lg p-3 border-l-4 ${
                      ev.type === 'leave'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {ev.type === 'leave' ? (
                        <CalendarDays size={13} className="text-amber-600 flex-shrink-0" />
                      ) : (
                        <Briefcase size={13} className="text-blue-600 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium uppercase tracking-wide ${
                        ev.type === 'leave' ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {ev.type === 'leave' ? 'Leave' : 'Task Due'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                    {ev.type === 'leave' && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(ev.start).toLocaleDateString()} – {new Date(ev.end).toLocaleDateString()}
                      </p>
                    )}
                    {ev.type === 'task' && ev.priority && (
                      <span className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded ${
                        ev.priority === 'high' ? 'bg-danger-100 text-danger-700' :
                        ev.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ev.priority} priority
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* All month events list */}
              {events.length > 0 && !selected && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">This month</p>
                  <div className="space-y-1.5">
                    {events.slice(0, 8).map(ev => (
                      <div key={String(ev.id)} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          ev.type === 'leave' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-xs text-slate-700 leading-tight">{ev.title}</p>
                          <p className="text-xs text-slate-400">{new Date(ev.start).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {events.length > 8 && (
                      <p className="text-xs text-slate-400">+{events.length - 8} more events</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
