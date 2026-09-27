import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { alertService } from '../../services/alertService';
import { storage } from '../../services/storage';
import { OverallStudentAttendance, SmartAlert } from '../../types';
import { KpiCard } from '../../components/common/KpiCard';
import { RiskBadge } from '../../components/common/RiskBadge';
import { AttendanceProgressBar } from '../../components/common/AttendanceProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatPercent } from '../../utils/formatters';
import {
  Percent,
  CheckSquare,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<OverallStudentAttendance | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStudentData = () => {
      if (currentUser?.id) {
        const studentStats = attendanceService.getStudentAttendance(currentUser.id);
        if (studentStats) {
          setStats(studentStats);
          const generatedAlerts = alertService.generateStudentAlerts(studentStats);
          setAlerts(generatedAlerts);
        }
      }
      setLoading(false);
    };

    fetchStudentData();
    const unsubscribe = storage.subscribe(() => {
      fetchStudentData();
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (loading || !stats) {
    return <LoadingSpinner message="Loading attendance records..." />;
  }

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const rawName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Anas';
  const firstName = rawName.toLowerCase() === 'aarav' ? 'Anas' : rawName;

  // Find most critical subject for Smart Insight
  const criticalSubject = stats.subjectStats.find((s) => s.percentage < 75);

  // SVG Circular Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, stats.percentage)) / 100) * circumference;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 6. WELCOMING HERO SECTION (Not a wall of KPI cards) */}
      <div className="saas-card p-6 sm:p-8 bg-gradient-to-r from-blue-50/70 via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 border border-slate-200/90 dark:border-slate-800 relative overflow-hidden shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          {/* Left: Friendly, Spacious Welcome */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Fall Semester • Verified Academic Roster</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {greeting}, {firstName} 👋
            </h1>

            <p className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">
              Stay on track with your attendance.
            </p>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Monitor your classes in real time, understand your attendance risk before shortages become issues, and plan your next classes with predictive tools.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('/student/simulator')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-teal-400 dark:text-teal-600" />
                Launch Attendance Simulator
              </button>

              <button
                onClick={() => onNavigate('/student/history')}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                Log History
              </button>
            </div>
          </div>

          {/* Right: Large Circular Attendance Visualization */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/90 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0">
            {/* Circular Gauge */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
                {/* Background Track */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-700"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Stroke */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className={
                    stats.percentage >= 75
                      ? 'stroke-emerald-500'
                      : stats.percentage >= 65
                      ? 'stroke-amber-500'
                      : 'stroke-rose-500'
                  }
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              {/* Center percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-sans text-slate-900 dark:text-white leading-none">
                  {formatPercent(stats.percentage)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Overall</span>
              </div>
            </div>

            {/* Gauge Label Summary */}
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Institutional Standing
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <RiskBadge risk={stats.risk} size="md" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[160px] leading-tight">
                {stats.percentage >= 75
                  ? 'Eligible for end-semester examinations.'
                  : 'Attendance shortage requires dynamic recovery.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 9. SMART INSIGHT CARD (The Visual Centerpiece) */}
      <div className="saas-card p-6 sm:p-7 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-teal-50/60 dark:from-blue-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-blue-200/80 dark:border-blue-900/60 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Smart Insight</span>
            </div>

            {criticalSubject ? (
              <>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {criticalSubject.subjectName} attendance needs attention.
                </h3>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  You're currently at{' '}
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                    {criticalSubject.percentage.toFixed(1)}%
                  </span>
                  . Attend the next{' '}
                  <span className="inline-block px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono font-black text-sm mx-1">
                    {criticalSubject.requiredClasses}
                  </span>{' '}
                  consecutive classes to reach the mandatory 75% target.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  All enrolled courses are currently safe 🎉
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  You are meeting or exceeding the 75% requirement across all subjects. Maintain this pace to secure exam hall ticket authorization.
                </p>
              </>
            )}
          </div>

          <div className="shrink-0">
            <button
              onClick={() => onNavigate('/student/simulator')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>View Risk Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. KPI CARDS (Mostly white with subtle accent icons, 18-24px radius) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Overall Attendance"
          value={formatPercent(stats.percentage)}
          subtitle={stats.percentage >= 75 ? 'Above 75% requirement' : 'Below mandatory 75%'}
          icon={<Percent className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          badge={{
            text: stats.risk.toUpperCase(),
            type: stats.risk === 'safe' ? 'positive' : stats.risk === 'warning' ? 'warning' : 'negative',
          }}
        />

        <KpiCard
          title="Classes Attended"
          value={stats.totalAttended}
          subtitle={`${stats.totalLate} attended with late permission`}
          icon={<CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          badge={{ text: 'Verified', type: 'positive' }}
        />

        <KpiCard
          title="Classes Conducted"
          value={stats.totalConducted}
          subtitle={`Across ${stats.subjectsCount} registered courses`}
          icon={<CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        />

        <KpiCard
          title="Subjects At Risk"
          value={stats.subjectsAtRiskCount}
          subtitle={
            stats.subjectsAtRiskCount === 0
              ? 'All enrolled subjects safe'
              : `${stats.subjectsAtRiskCount} course(s) require recovery`
          }
          icon={<AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          badge={{
            text: stats.subjectsAtRiskCount === 0 ? 'Optimal' : 'Shortage',
            type: stats.subjectsAtRiskCount === 0 ? 'positive' : 'negative',
          }}
          onClick={() => onNavigate('/student/simulator')}
        />
      </div>

      {/* 8. YOUR ATTENDANCE SECTION */}
      <div className="saas-card p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Your Attendance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              See how you're performing across your subjects.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            Mandatory Goal: 75.0%
          </span>
        </div>

        {/* Clean Subject Rows/Cards */}
        <div className="space-y-4">
          {stats.subjectStats.map((subj) => (
            <div
              key={subj.subjectId}
              className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {subj.subjectCode}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {subj.subjectName}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Instructor: {subj.facultyName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {formatPercent(subj.percentage)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-mono">
                      {subj.attended} / {subj.conducted} classes
                    </span>
                  </div>
                  <RiskBadge risk={subj.risk} size="md" />
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <AttendanceProgressBar percentage={subj.percentage} size="md" />

              {/* Dynamic Action / Buffer Message */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/50 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                {subj.percentage < 75 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Attend the next <span className="font-bold underline">{subj.requiredClasses}</span> consecutive classes to reach 75%.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Safe: You can miss up to {subj.canMissClasses} upcoming classes while maintaining ≥ 75%.
                  </span>
                )}

                <button
                  onClick={() => onNavigate('/student/simulator')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 shrink-0"
                >
                  Simulate Scenarios →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
