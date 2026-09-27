import { RiskLevel } from '../types';

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getRiskColorClass(risk: RiskLevel, type: 'badge' | 'text' | 'bg' | 'border' = 'badge'): string {
  switch (risk) {
    case 'safe':
      if (type === 'badge') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
      if (type === 'text') return 'text-emerald-600 dark:text-emerald-400';
      if (type === 'bg') return 'bg-emerald-500';
      if (type === 'border') return 'border-emerald-500';
      return '';
    case 'warning':
      if (type === 'badge') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
      if (type === 'text') return 'text-amber-600 dark:text-amber-400';
      if (type === 'bg') return 'bg-amber-500';
      if (type === 'border') return 'border-amber-500';
      return '';
    case 'critical':
      if (type === 'badge') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60';
      if (type === 'text') return 'text-rose-600 dark:text-rose-400';
      if (type === 'bg') return 'bg-rose-500';
      if (type === 'border') return 'border-rose-500';
      return '';
  }
}

export function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'safe':
      return 'Safe';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
  }
}
