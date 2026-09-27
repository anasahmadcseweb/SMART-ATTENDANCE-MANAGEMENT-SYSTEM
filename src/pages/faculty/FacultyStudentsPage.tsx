import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { StudentUser, OverallStudentAttendance } from '../../types';
import { StudentProfileModal } from '../../components/common/StudentProfileModal';
import { RiskBadge } from '../../components/common/RiskBadge';
import { AttendanceProgressBar } from '../../components/common/AttendanceProgressBar';
import { formatPercent } from '../../utils/formatters';
import {
  GraduationCap,
  Search,
  Filter,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const FacultyStudentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [studentsWithStats, setStudentsWithStats] = useState<
    { student: StudentUser; stats: OverallStudentAttendance }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'safe' | 'warning' | 'critical'>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const loadEnrolled = () => {
      const allSubjects = storage.getSubjects();
      const mySubjects = currentUser?.role === 'admin'
        ? allSubjects
        : allSubjects.filter((s) => s.facultyId === currentUser?.id);

      const allUsers = storage.getUsers();
      const allStudents = allUsers.filter((u) => u.role === 'student') as StudentUser[];

      const enrolled = allStudents.filter((st) =>
        mySubjects.some(
          (subj) =>
            subj.department.toLowerCase() === st.department.toLowerCase() &&
            subj.semester === st.semester &&
            subj.section.toUpperCase() === st.section.toUpperCase()
        )
      );

      const data = enrolled.map((st) => {
        const stats = attendanceService.getStudentAttendance(st.id)!;
        return { student: st, stats };
      });

      // Sort with critical/warning first for quick triage
      data.sort((a, b) => (a.stats.percentage > b.stats.percentage ? 1 : -1));
      setStudentsWithStats(data);
    };

    loadEnrolled();
    const unsubscribe = storage.subscribe(() => loadEnrolled());
    return () => unsubscribe();
  }, [currentUser]);

  const filtered = useMemo(() => {
    return studentsWithStats.filter(({ student, stats }) => {
      if (riskFilter !== 'ALL' && stats.risk !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesRoll = student.rollNumber.toLowerCase().includes(q);
        const matchesEmail = student.email.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesEmail) return false;
      }
      return true;
    });
  }, [studentsWithStats, riskFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          <GraduationCap className="w-3.5 h-3.5" />
          Enrolled Cohort
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Enrolled Students Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review individual student standing, identify low attendance patterns, and trigger proactive interventions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or roll number (e.g. Anas, 21CS042)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Risk Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'critical', 'warning', 'safe'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
                  riskFilter === lvl
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'All Risks' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ student, stats }) => (
          <div
            key={student.id}
            onClick={() => setSelectedStudentId(student.id)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {student.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      {student.rollNumber} • Sem {student.semester} ({student.section})
                    </span>
                  </div>
                </div>
                <RiskBadge risk={stats.risk} size="sm" />
              </div>

              {/* Progress & Standing */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Cumulative Attendance</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {formatPercent(stats.percentage)} ({stats.totalAttended}/{stats.totalConducted})
                  </span>
                </div>
                <AttendanceProgressBar percentage={stats.percentage} size="sm" />
              </div>
            </div>

            {/* Bottom Details */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {stats.subjectsAtRiskCount > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {stats.subjectsAtRiskCount} subject(s) at risk
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    All subjects safe
                  </span>
                )}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Profile <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Modal */}
      <StudentProfileModal
        studentId={selectedStudentId}
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};
