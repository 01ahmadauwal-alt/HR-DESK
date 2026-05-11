import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Clock, FileText, TrendingUp,
  Settings, LogOut, Briefcase, Bell, DollarSign,
  UserCheck, Building2, PieChart, Workflow, CreditCard, Banknote, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const employeeGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/employee' },
    ],
  },
  {
    label: 'Self Service',
    items: [
      { label: 'My Leave',       icon: Calendar,  to: '/employee/leave' },
      { label: 'Payslips',       icon: DollarSign, to: '/employee/payslips' },
      { label: 'Attendance',     icon: Clock,      to: '/employee/attendance' },
      { label: 'My Tasks',       icon: Workflow,   to: '/employee/tasks' },
    ],
  },
  {
    label: 'Financial',
    items: [
      { label: 'Loan',           icon: CreditCard, to: '/employee/loan' },
      { label: 'Salary Advance', icon: Banknote,   to: '/employee/salary-advance' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Documents',  icon: FileText,  to: '/employee/documents' },
      { label: 'My Profile', icon: UserCheck, to: '/employee/profile' },
    ],
  },
];

const managerGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/manager' },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'My Team',         icon: Users,     to: '/manager/team' },
      { label: 'Leave Approvals', icon: Calendar,  to: '/manager/leaves' },
      { label: 'Team Attendance', icon: Clock,     to: '/manager/attendance' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { label: 'Tasks',    icon: Workflow,  to: '/manager/tasks' },
      { label: 'Calendar', icon: Calendar,  to: '/manager/calendar' },
    ],
  },
];

const hrGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/hr' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Employees',        icon: Users,     to: '/hr/employees' },
      { label: 'Leave Management', icon: Calendar,  to: '/hr/leaves' },
      { label: 'Roles & Access',   icon: UserCheck, to: '/hr/roles' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payroll',         icon: DollarSign, to: '/hr/payroll' },
      { label: 'Loans & Advances',icon: CreditCard, to: '/hr/loans' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Attendance',   icon: Clock,     to: '/hr/attendance' },
      { label: 'Recruitment',  icon: Briefcase, to: '/hr/recruitment' },
      { label: 'Documents',    icon: FileText,  to: '/hr/documents' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'HR Metrics', icon: PieChart,  to: '/hr/metrics' },
      { label: 'Settings',   icon: Settings,  to: '/hr/settings' },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    items: [
      { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
    ],
  },
  {
    label: 'Organisation',
    items: [
      { label: 'Departments', icon: Building2, to: '/admin/departments' },
      { label: 'Employees',   icon: Users,     to: '/admin/employees' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Payroll',     icon: DollarSign, to: '/admin/payroll' },
      { label: 'Attendance',  icon: Clock,      to: '/admin/attendance' },
      { label: 'Analytics',   icon: TrendingUp, to: '/admin/analytics' },
      { label: 'Recruitment', icon: Briefcase,  to: '/admin/recruitment' },
    ],
  },
];

const groupMap: Record<string, NavGroup[]> = {
  employee:    employeeGroups,
  manager:     managerGroups,
  hr_manager:  hrGroups,
  super_admin: adminGroups,
};

const roleLabel: Record<string, string> = {
  employee:    'Employee',
  manager:     'Manager',
  hr_manager:  'HR Manager',
  super_admin: 'Administrator',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = user ? (groupMap[user.role] ?? employeeGroups) : [];

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : user?.email?.split('@')[0] ?? 'User';

  const initials = getInitials(
    displayName.split(/[\s._-]/)[0] ?? '',
    displayName.split(/[\s._-]/)[1] ?? '',
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-60 flex flex-col z-30 select-none"
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #0d1525 100%)' }}
    >
      {/* ── Logo ───────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-bold text-sm tracking-tight">H</span>
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight leading-none">HR-DESK</span>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Management Suite</p>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-2.5 pb-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="sidebar-group-label">{group.label}</p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length === 2}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={16} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User footer ────────────────────────────── */}
      <div className="px-2.5 py-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-default mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {initials || displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{displayName}</p>
            <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{user ? roleLabel[user.role] : ''}</p>
          </div>
          <ChevronRight size={13} className="text-slate-600 flex-shrink-0" />
        </div>

        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-danger-400 hover:text-danger-300 hover:bg-danger-900/20"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
