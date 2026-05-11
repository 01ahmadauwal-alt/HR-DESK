export function formatNaira(amount: number | undefined | null): string {
  if (amount == null) return '₦0.00';
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatTime(date: string | Date | undefined | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export function getMonthName(month: number, year: number): string {
  return new Date(year, month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${(firstName ?? '').charAt(0)}${(lastName ?? '').charAt(0)}`.toUpperCase() || '?';
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  study: 'Study Leave',
  unpaid: 'Unpaid Leave',
};

export const STATUS_BADGE: Record<string, string> = {
  approved: 'badge-success',
  active: 'badge-success',
  hired: 'badge-success',
  present: 'badge-success',
  pending: 'badge-warning',
  pending_manager: 'badge-warning',
  pending_hr: 'badge-warning',
  draft: 'badge-gray',
  open: 'badge-primary',
  in_progress: 'badge-primary',
  screening: 'badge-primary',
  interview: 'badge-primary',
  offer: 'badge-primary',
  rejected: 'badge-danger',
  cancelled: 'badge-danger',
  absent: 'badge-danger',
  late: 'badge-warning',
  on_leave: 'badge-warning',
  on_duty: 'badge-success',
  paid: 'badge-success',
  completed: 'badge-success',
  done: 'badge-success',
};
