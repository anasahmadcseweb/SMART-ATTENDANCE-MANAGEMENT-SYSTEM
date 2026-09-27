import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    type: 'positive' | 'warning' | 'negative' | 'neutral';
  };
  highlight?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  highlight = false,
  onClick,
}) => {
  const badgeClasses = {
    positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50',
    negative: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50',
    neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/50',
  };

  return (
    <div
      onClick={onClick}
      className={`saas-card p-5 sm:p-6 ${
        onClick ? 'cursor-pointer saas-card-hover' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
              {value}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        {subtitle && (
          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
            {subtitle}
          </span>
        )}
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold shrink-0 ${badgeClasses[badge.type]}`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
};
