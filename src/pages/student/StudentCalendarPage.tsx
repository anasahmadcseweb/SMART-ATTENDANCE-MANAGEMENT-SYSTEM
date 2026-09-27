import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, HistoryItem } from '../../services/attendanceService';
import { storage } from '../../services/storage';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const StudentCalendarPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-01'));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHistory = () => {
      if (currentUser?.id) {
        const records = attendanceService.getStudentHistory(currentUser.id);
        setHistory(records);
      }
      setLoading(false);
    };

    loadHistory();
    const unsubscribe = storage.subscribe(() => loadHistory());
    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner message="Generating academic calendar map..." />;
  }

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Group history records by Date string (YYYY-MM-DD)
  const dateMap = new Map<string, HistoryItem[]>();
  history.forEach((h) => {
    const existing = dateMap.get(h.date) || [];
    existing.push(h);
    dateMap.set(h.date, existing);
  });

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Selected date details
  const selectedDateSessions = selectedDateStr ? dateMap.get(selectedDateStr) || [] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            Temporal Attendance View
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Day-by-day record of lectures attended, absences, and schedule events.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-300">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-slate-400">No class</span>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Month Selector Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
            {monthNames[month]} {year}
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase py-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] p-2 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const sessionsForDay = dateMap.get(dateStr) || [];
            const hasClasses = sessionsForDay.length > 0;

            const isPresentAll = hasClasses && sessionsForDay.every((s) => s.status === 'present');
            const hasAbsent = hasClasses && sessionsForDay.some((s) => s.status === 'absent');
            const hasLate = hasClasses && sessionsForDay.some((s) => s.status === 'late');

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (hasClasses) setSelectedDateStr(dateStr);
                }}
                className={`min-h-[85px] sm:min-h-[95px] p-2 sm:p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  hasClasses
                    ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:shadow-sm'
                    : 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${hasClasses ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {dayNum}
                  </span>
                  {hasClasses && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {sessionsForDay.length} class{sessionsForDay.length > 1 ? 'es' : ''}
                    </span>
                  )}
                </div>

                {/* Status Indicator Pills */}
                {hasClasses ? (
                  <div className="space-y-1 mt-1">
                    <div className="flex flex-wrap gap-1">
                      {sessionsForDay.map((s) => (
                        <span
                          key={s.id}
                          className={`w-2 h-2 rounded-full ${
                            s.status === 'present'
                              ? 'bg-emerald-500'
                              : s.status === 'absent'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          title={`${s.subjectCode}: ${s.status.toUpperCase()}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-bold block truncate ${
                        hasAbsent
                          ? 'text-rose-600 dark:text-rose-400'
                          : hasLate
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {hasAbsent ? 'Absence' : hasLate ? 'Late' : '100% Attended'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400/80 font-mono">No lecture</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal on Date Click */}
      <Modal
        isOpen={Boolean(selectedDateStr)}
        onClose={() => setSelectedDateStr(null)}
        title={selectedDateStr ? formatDate(selectedDateStr) : ''}
        subtitle={`Session breakdown for ${selectedDateSessions.length} conducted classes`}
        maxWidth="md"
      >
        <div className="space-y-3">
          {selectedDateSessions.map((session) => (
            <div
              key={session.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60">
                    {session.subjectCode}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {session.subjectName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {session.period} • {session.facultyName}
                </div>
              </div>

              <div>
                {session.status === 'present' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3.5 h-3.5" /> Present
                  </span>
                )}
                {session.status === 'absent' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-3.5 h-3.5" /> Absent
                  </span>
                )}
                {session.status === 'late' && (
                  <span className="inline-flex items-center gap-1 font-semibold text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" /> Late (Attended)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
