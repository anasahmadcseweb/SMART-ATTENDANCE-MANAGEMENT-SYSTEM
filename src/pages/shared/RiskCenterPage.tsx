import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { StudentUser, RiskLevel } from '../../types';
import { StudentProfileModal } from '../../components/common/StudentProfileModal';
import { RiskBadge } from '../../components/common/RiskBadge';
import { AttendanceProgressBar } from '../../components/common/AttendanceProgressBar';
import { formatPercent } from '../../utils/formatters';
import { downloadCsv } from '../../utils/exportCsv';
import { generatePdfReport } from '../../utils/exportPdf';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RiskRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  semester: number;
  section: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  conducted: number;
  attendancePercent: number;
  risk: RiskLevel;
  requiredClasses: number;
}

export const RiskCenterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [riskRows, setRiskRows] = useState<RiskRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'critical' | 'warning' | 'safe'>('ALL');
  const [attendanceRange, setAttendanceRange] = useState<'ALL' | '<65' | '65-74' | '>=75'>('ALL');

  useEffect(() => {
    const loadRiskData = () => {
      const allUsers = storage.getUsers();
      const students = allUsers.filter((u) => u.role === 'student') as StudentUser[];

      const rows: RiskRow[] = [];

      students.forEach((st) => {
        const stats = attendanceService.getStudentAttendance(st.id);
        if (!stats) return;

        stats.subjectStats.forEach((subj) => {
          rows.push({
            studentId: st.id,
            studentName: st.name,
            rollNumber: st.rollNumber,
            department: st.department,
            semester: st.semester,
            section: st.section,
            subjectId: subj.subjectId,
            subjectName: subj.subjectName,
            subjectCode: subj.subjectCode,
            attended: subj.attended,
            conducted: subj.conducted,
            attendancePercent: subj.percentage,
            risk: subj.risk,
            requiredClasses: subj.requiredClasses,
          });
        });
      });

      // Default sort: critical lowest percentages first
      rows.sort((a, b) => a.attendancePercent - b.attendancePercent);
      setRiskRows(rows);
    };

    loadRiskData();
    const unsubscribe = storage.subscribe(() => loadRiskData());
    return () => unsubscribe();
  }, []);

  const departments = storage.getDepartments();

  // Filtered dataset
  const filteredRows = useMemo(() => {
    return riskRows.filter((r) => {
      if (deptFilter !== 'ALL' && r.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (semesterFilter !== 'ALL' && String(r.semester) !== semesterFilter) return false;
      if (sectionFilter !== 'ALL' && r.section.toUpperCase() !== sectionFilter.toUpperCase()) return false;
      if (riskFilter !== 'ALL' && r.risk !== riskFilter) return false;
      if (attendanceRange === '<65' && r.attendancePercent >= 65) return false;
      if (attendanceRange === '65-74' && (r.attendancePercent < 65 || r.attendancePercent >= 75)) return false;
      if (attendanceRange === '>=75' && r.attendancePercent < 75) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesRoll = r.rollNumber.toLowerCase().includes(q);
        const matchesSubj = r.subjectName.toLowerCase().includes(q) || r.subjectCode.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesSubj) return false;
      }
      return true;
    });
  }, [riskRows, deptFilter, semesterFilter, sectionFilter, riskFilter, attendanceRange, searchQuery]);

  const handleExportCsv = () => {
    if (filteredRows.length === 0) {
      showToast('No records available to export.', 'warning');
      return;
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Department',
      'Sem',
      'Sec',
      'Subject Code',
      'Subject',
      'Attended',
      'Conducted',
      'Attendance %',
      'Risk Status',
      'Required Classes',
    ];

    const data = filteredRows.map((r) => [
      r.rollNumber,
      r.studentName,
      r.department,
      r.semester,
      r.section,
      r.subjectCode,
      r.subjectName,
      r.attended,
      r.conducted,
      `${r.attendancePercent.toFixed(1)}%`,
      r.risk.toUpperCase(),
      r.requiredClasses,
    ]);

    downloadCsv('risk-center-attendance-triage', headers, data);
    showToast('Risk Center CSV export downloaded.', 'success');
  };

  const handleExportPdf = () => {
    if (filteredRows.length === 0) {
      showToast('No records available to export.', 'warning');
      return;
    }

    generatePdfReport({
      title: 'Institutional Attendance Risk Assessment Report',
      subtitle: 'Official academic intervention roster generated for Department Chairs and Faculty',
      metadata: [
        { label: 'Scope', value: 'Active Academic Term' },
        { label: 'Total Subject Deficits', value: String(filteredRows.length) },
        { label: 'Mandatory Benchmark', value: '75.0% Attendance' },
        { label: 'Generated By', value: currentUser?.name || 'Administrator' },
      ],
      headers: ['Roll No', 'Student', 'Subject', 'Attended', 'Conducted', 'Attendance %', 'Risk', 'Required'],
      rows: filteredRows.slice(0, 50).map((r) => [
        r.rollNumber,
        r.studentName,
        r.subjectCode,
        r.attended,
        r.conducted,
        `${r.attendancePercent.toFixed(1)}%`,
        r.risk === 'critical' ? 'Critical' : r.risk === 'warning' ? 'Warning' : 'Safe',
        r.requiredClasses > 0 ? `${r.requiredClasses} classes` : '0',
      ]),
      summaryNotes: [
        'Intervention mandates: Students marked Critical (<65%) require formal faculty academic advisement.',
        'Required classes indicates the minimum consecutive lectures needed to re-attain the 75% threshold.',
      ],
      filename: 'smartattend-risk-assessment-report',
    });

    showToast('Risk Center PDF report generated.', 'success');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDeptFilter('ALL');
    setSemesterFilter('ALL');
    setSectionFilter('ALL');
    setRiskFilter('ALL');
    setAttendanceRange('ALL');
  };

  // Critical and Warning counts
  const criticalCount = riskRows.filter((r) => r.risk === 'critical').length;
  const warningCount = riskRows.filter((r) => r.risk === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Intervention & Action Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Risk Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic triage console identifying vulnerable students and computing consecutive class recovery quotas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            CSV Export
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            PDF Report
          </button>
        </div>
      </div>

      {/* Severity Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block uppercase tracking-wider">
              Critical Deficits (&lt;65%)
            </span>
            <span className="text-2xl font-black text-rose-900 dark:text-rose-100 font-mono mt-0.5 block">
              {criticalCount} instances
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block uppercase tracking-wider">
              Warning Range (65-74%)
            </span>
            <span className="text-2xl font-black text-amber-900 dark:text-amber-100 font-mono mt-0.5 block">
              {warningCount} instances
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold block uppercase tracking-wider">
              Smart Risk Engine
            </span>
            <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium block mt-1">
              Dynamic formula: ceil((T * C - A) / (1 - T))
            </span>
          </div>
        </div>
      </div>

      {/* Multidimensional Filter Console */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, roll no, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={String(num)}>
                  Sem {num}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="critical">Critical Only (&lt;65%)</option>
              <option value="warning">Warning Only (65-74%)</option>
              <option value="safe">Safe Only (≥75%)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Showing {filteredRows.length} subject attendance records</span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Main Risk Center Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-3">Subject</th>
                <th className="py-3.5 px-3 text-center">Attended / Total</th>
                <th className="py-3.5 px-4 w-44">Attendance %</th>
                <th className="py-3.5 px-3 text-center">Risk Tier</th>
                <th className="py-3.5 px-4 text-right">Required Classes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredRows.map((row, idx) => (
                <tr
                  key={`${row.studentId}_${row.subjectId}_${idx}`}
                  onClick={() => setSelectedStudentId(row.studentId)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  {/* Student Info */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {row.studentName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {row.rollNumber} • {row.department.split(' ')[0]} (Sem {row.semester})
                    </span>
                  </td>

                  {/* Subject Info */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      {row.subjectCode}
                    </span>
                    <span className="text-xs text-slate-500 block truncate max-w-[180px]">
                      {row.subjectName}
                    </span>
                  </td>

                  {/* Attended / Total */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {row.attended} / {row.conducted}
                  </td>

                  {/* Progress & Percent */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono font-bold">
                        <span>{formatPercent(row.attendancePercent)}</span>
                      </div>
                      <AttendanceProgressBar percentage={row.attendancePercent} size="sm" />
                    </div>
                  </td>

                  {/* Risk Badge */}
                  <td className="py-3.5 px-3 text-center">
                    <RiskBadge risk={row.risk} size="sm" />
                  </td>

                  {/* Required Classes Output (The core competition requirement) */}
                  <td className="py-3.5 px-4 text-right">
                    {row.attendancePercent >= 75 ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Above target (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        Attend next {row.requiredClasses} classes
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Student Profile Modal */}
      <StudentProfileModal
        studentId={selectedStudentId}
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};
