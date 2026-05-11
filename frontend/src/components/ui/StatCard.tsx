import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: number; label?: string };
  subtitle?: string;
}

export default function StatCard({
  title, value, icon: Icon,
  iconBg = 'bg-primary-50', iconColor = 'text-primary',
  trend, subtitle,
}: StatCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</p>
        {(trend || subtitle) && (
          <div className="flex items-center gap-1.5 mt-1">
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-md px-1.5 py-0.5 ${
                trend.value >= 0
                  ? 'text-success-700 bg-success-50'
                  : 'text-danger-600 bg-danger-50'
              }`}>
                {trend.value >= 0
                  ? <TrendingUp size={11} />
                  : <TrendingDown size={11} />}
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
            )}
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
