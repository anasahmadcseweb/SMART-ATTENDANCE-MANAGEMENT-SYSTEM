import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md' }) => {
  const configs = {
    safe: {
      label: 'Safe',
      dotColor: 'bg-emerald-500',
      pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    },
    warning: {
      label: 'Warning',
      dotColor: 'bg-amber-500',
      pillClass: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    },
    critical: {
      label: 'Critical',
      dotColor: 'bg-rose-500',
      pillClass: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    },
  }[risk];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs sm:text-sm px-3 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs tracking-tight ${configs.pillClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${configs.dotColor}`} />
      <span>{configs.label}</span>
    </span>
  );
};
