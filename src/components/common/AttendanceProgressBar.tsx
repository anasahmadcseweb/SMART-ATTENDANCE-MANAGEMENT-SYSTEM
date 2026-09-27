import React from 'react';
import { TARGET_ATTENDANCE_PERCENT } from '../../utils/attendanceCalculations';

interface AttendanceProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTargetMarker?: boolean;
}

export const AttendanceProgressBar: React.FC<AttendanceProgressBarProps> = ({
  percentage,
  showLabel = false,
  size = 'md',
  showTargetMarker = true,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  let barColor = 'bg-rose-500';
  if (clamped >= TARGET_ATTENDANCE_PERCENT) {
    barColor = 'bg-emerald-500';
  } else if (clamped >= 65) {
    barColor = 'bg-amber-500';
  }

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="w-full">
      <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        {/* Progress Fill */}
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />

        {/* 75% Target Marker */}
        {showTargetMarker && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400/70 dark:bg-slate-500/80 z-10"
            style={{ left: `${TARGET_ATTENDANCE_PERCENT}%` }}
            title="75% Mandatory Attendance Threshold"
          />
        )}
      </div>

      {showLabel && (
        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
          <span>{percentage.toFixed(1)}%</span>
          <span>Target: {TARGET_ATTENDANCE_PERCENT}%</span>
        </div>
      )}
    </div>
  );
};
