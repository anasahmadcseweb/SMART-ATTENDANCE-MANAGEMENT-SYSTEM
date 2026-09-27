import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { attendanceService, FacultyStats, AdminStats } from '../../services/attendanceService';
import { OverallStudentAttendance } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatPercent } from '../../utils/formatters';
import {
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Building2,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { currentUser, role } = useAuth();

  const [studentStats, setStudentStats] = useState<OverallStudentAttendance | null>(null);
  const [facultyStats, setFacultyStats] = useState<FacultyStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAnalytics = () => {
      if (!currentUser) return;

      if (role === 'student') {
        const data = attendanceService.getStudentAttendance(currentUser.id);
        setStudentStats(data);
      } else if (role === 'faculty') {
        const data = attendanceService.getFacultyStats(currentUser.id);
        setFacultyStats(data);
      } else {
        const data = attendanceService.getAdminStats();
        setAdminStats(data);
      }
      setLoading(false);
    };

    loadAnalytics();
    const unsubscribe = storage.subscribe(() => loadAnalytics());
    return () => unsubscribe();
  }, [currentUser, role]);

  if (loading) {
    return <LoadingSpinner message="Generating multi-dimensional analytics charts..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          <LineChartIcon className="w-3.5 h-3.5" />
          Institutional Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Attendance Analytics & Insights
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {role === 'student' && 'Personalized course progression, historical trends, and risk distribution.'}
          {role === 'faculty' && 'Cohort attendance trajectory, course performance comparisons, and absence analysis.'}
          {role === 'admin' && 'Cross-department performance metrics, institutional trends, and compliance tracking.'}
        </p>
      </div>

      {/* STUDENT VIEW */}
      {role === 'student' && studentStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Subject Comparison Bar Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Subject Performance Comparison
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your percentage in each course against the 75% university benchmark
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">Benchmark: 75%</span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studentStats.subjectStats.map((s) => ({
                      code: s.subjectCode,
                      percentage: s.percentage,
                      name: s.subjectName,
                    }))}
                    margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Attendance']}
                    />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '75% Minimum', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <Bar dataKey="percentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Status Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Enrolled Subjects Risk
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Course compliance distribution
                </p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Safe', value: studentStats.subjectStats.filter((s) => s.risk === 'safe').length, color: '#10B981' },
                        { name: 'Warning', value: studentStats.subjectStats.filter((s) => s.risk === 'warning').length, color: '#F59E0B' },
                        { name: 'Critical', value: studentStats.subjectStats.filter((s) => s.risk === 'critical').length, color: '#EF4444' },
                      ].filter((x) => x.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { color: '#10B981' },
                        { color: '#F59E0B' },
                        { color: '#EF4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe Subjects:
                  </span>
                  <span className="font-bold font-mono">{studentStats.subjectStats.filter((s) => s.risk === 'safe').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> At Risk Subjects:
                  </span>
                  <span className="font-bold font-mono text-rose-600">{studentStats.subjectsAtRiskCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY VIEW */}
      {role === 'faculty' && facultyStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Class Attendance Trend Line Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Lecture Attendance Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Percentage of students present across recent class dates
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={facultyStats.trendData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Present Rate']}
                    />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '75% Floor', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <Line type="monotone" dataKey="presentPercent" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Distribution Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Student Risk Tiering
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Classification of {facultyStats.totalStudents} enrolled students
                </p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Safe', value: facultyStats.riskDistribution.safe, color: '#10B981' },
                        { name: 'Warning', value: facultyStats.riskDistribution.warning, color: '#F59E0B' },
                        { name: 'Critical', value: facultyStats.riskDistribution.critical, color: '#EF4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">Safe</span>
                  <span className="font-mono font-black text-emerald-900 dark:text-emerald-200 text-base">{facultyStats.riskDistribution.safe}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">Warning</span>
                  <span className="font-mono font-black text-amber-900 dark:text-amber-200 text-base">{facultyStats.riskDistribution.warning}</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">Critical</span>
                  <span className="font-mono font-black text-rose-900 dark:text-rose-200 text-base">{facultyStats.riskDistribution.critical}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN VIEW */}
      {role === 'admin' && adminStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Department Comparison Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inter-Departmental Attendance Index
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparative analysis across all engineering divisions
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.departmentStats} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Average Attendance']}
                    />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '75% Requirement', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <Bar dataKey="averageAttendance" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Campus Monthly Trajectory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semester aggregate curve
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adminStats.monthlyTrend} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis domain={[70, 95]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${val}%`, 'Attendance']}
                    />
                    <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
