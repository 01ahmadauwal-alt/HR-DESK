import { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, CheckCheck, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Notification } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

function notifIcon(type: string) {
  if (type.includes('approved') || type.includes('complete')) return <CheckCircle size={14} className="text-success-500 flex-shrink-0 mt-0.5" />;
  if (type.includes('rejected'))  return <AlertCircle  size={14} className="text-danger-500  flex-shrink-0 mt-0.5" />;
  return <Info size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />;
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/employee/notifications').then(r => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/employee/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter(n => !n.read);

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 bg-white rounded-xl ring-1 ring-slate-900/10 shadow-float z-50 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
          {unread.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white leading-none">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread.length > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell size={24} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">All caught up!</p>
            <p className="text-xs text-slate-300 mt-0.5">No notifications yet.</p>
          </div>
        ) : (
          notifications.slice(0, 25).map(n => (
            <div
              key={n._id}
              className={`px-4 py-3 hover:bg-slate-50/80 transition-colors ${!n.read ? 'bg-primary-25/60' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                {notifIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400 text-center">{notifications.length} total notification{notifications.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ title }: { title?: string }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/employee/notifications').then(r => r.data),
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const roleLabel: Record<string, string> = {
    employee:    'Employee',
    manager:     'Manager',
    hr_manager:  'HR Manager',
    super_admin: 'Admin',
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : user?.email?.split('@')[0] ?? '';

  return (
    <header className="fixed top-0 left-0 right-0 md:left-60 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 z-20">
      {/* Left — page title */}
      <div className="ml-12 md:ml-0">
        {title && <h1 className="page-title text-sm md:text-base">{title}</h1>}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-52 hover:border-slate-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            placeholder="Search…"
            className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-full text-slate-700"
          />
          <kbd className="hidden lg:inline-flex items-center rounded border border-slate-200 bg-white px-1 text-[10px] font-medium text-slate-400">/</kbd>
        </div>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              showNotifications ? 'bg-primary-50 text-primary' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger rounded-full text-white text-[10px] flex items-center justify-center font-bold px-1 animate-scale-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{user ? roleLabel[user.role] : ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
