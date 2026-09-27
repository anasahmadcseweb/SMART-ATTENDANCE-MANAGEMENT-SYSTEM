import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { RiskBadge } from './RiskBadge';
import { AttendanceProgressBar } from './AttendanceProgressBar';
import { attendanceService, HistoryItem } from '../../services/attendanceService';
import { OverallStudentAttendance } from '../../types';
import { formatPercent, formatDate } from '../../utils/formatters';
import { User, BookOpen, AlertCircle, History, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StudentProfileModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<OverallStudentAttendance | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'history'>('overview');

  useEffect(() => {
    if (studentId && isOpen) {
      const data = attendanceService.getStudentAttendance(studentId);
      const hist = attendanceService.getStudentHistory(studentId);
      setStats(data);
      setHistory(hist);
    }
  }, [studentId, isOpen]);

  if (!isOpen || !stats) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Attendance Profile"
      subtitle={`Roll No: ${stats.rollNumber} • ${stats.department}`}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Header Profile Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {stats.studentName.charAt(0)}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {stats.studentName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semester {stats.semester} • Section {stats.section} • {stats.department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Overall Attendance</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {formatPercent(stats.percentage)}
              </span>
            </div>
            <RiskBadge risk={stats.risk} size="lg" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'subjects'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Subject Breakdown ({stats.subjectStats.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <History className="w-4 h-4" />
            Log History ({history.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Classes Attended</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {stats.totalAttended}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Classes Conducted</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {stats.totalConducted}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Subjects Enrolled</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {stats.subjectsCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Subjects At Risk</span>
                <span className={`text-xl font-bold mt-1 block ${stats.subjectsAtRiskCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {stats.subjectsAtRiskCount}
                </span>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Cumulative Institutional Standing</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatPercent(stats.percentage)}</span>
              </div>
              <AttendanceProgressBar percentage={stats.percentage} size="lg" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mandatory minimum for examination hall ticket generation is 75.0%.
              </p>
            </div>

            {/* Smart Risk Callout */}
            {stats.subjectsAtRiskCount > 0 ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                  <p className="font-bold">Intervention Recommended</p>
                  <p>
                    Student is below 75% in {stats.subjectsAtRiskCount} subject(s). Please review subject recommendations
                    for dynamic class recovery plans.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <p className="font-bold">Academic Good Standing</p>
                  <p>All enrolled subject attendances exceed the institutional 75% requirement.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Subjects Breakdown */}
        {activeTab === 'subjects' && (
          <div className="space-y-3">
            {stats.subjectStats.map((subj) => (
              <div
                key={subj.subjectId}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                        {subj.subjectCode}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                        {subj.subjectName}
                      </h5>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Instructor: {subj.facultyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {subj.attended}/{subj.conducted} ({formatPercent(subj.percentage)})
                    </span>
                    <RiskBadge risk={subj.risk} size="sm" />
                  </div>
                </div>

                <AttendanceProgressBar percentage={subj.percentage} size="md" />

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                  {subj.percentage < 75 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      ⚡ Action Required: Must attend next <span className="underline font-bold">{subj.requiredClasses}</span> consecutive classes to reach 75%.
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Safe: Can afford to miss up to {subj.canMissClasses} upcoming classes while maintaining ≥ 75%.
                    </span>
                  )}
                  {subj.consecutiveAbsences > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {subj.consecutiveAbsences} consecutive absence(s)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No attendance records logged yet.</div>
              ) : (
                history.slice(0, 30).map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.date)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.subjectName} ({item.subjectCode})
                        </span>
                        <span className="text-slate-400 ml-2">{item.period}</span>
                      </div>
                    </div>
                    <div>
                      {item.status === 'present' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </span>
                      )}
                      {item.status === 'absent' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                      {item.status === 'late' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" /> Late (Attended)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
