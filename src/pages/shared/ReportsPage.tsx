import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { StudentUser, Subject, Department } from '../../types';
import { downloadCsv } from '../../utils/exportCsv';
import { generatePdfReport } from '../../utils/exportPdf';
import { useToast } from '../../context/ToastContext';
import { formatPercent } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Users,
  Building2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [activeReportType, setActiveReportType] = useState<'student' | 'faculty' | 'admin'>(
    role === 'student' ? 'student' : role === 'faculty' ? 'faculty' : 'admin'
  );

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');

  const departments = storage.getDepartments();
  const allUsers = storage.getUsers();
  const allStudents = useMemo(() => allUsers.filter((u) => u.role === 'student') as StudentUser[], [allUsers]);
  const allSubjects = storage.getSubjects();

  // 1. Student Report Data
  const studentReportData = useMemo(() => {
    let list = allStudents;
    if (role === 'student' && currentUser) {
      list = allStudents.filter((s) => s.id === currentUser.id);
    } else {
      if (selectedDept !== 'ALL') {
        list = list.filter((s) => s.department.toLowerCase() === selectedDept.toLowerCase());
      }
      if (selectedSemester !== 'ALL') {
        list = list.filter((s) => String(s.semester) === selectedSemester);
      }
    }

    return list.map((st) => {
      const stats = attendanceService.getStudentAttendance(st.id);
      return {
        id: st.id,
        name: st.name,
        rollNumber: st.rollNumber,
        department: st.department,
        semester: st.semester,
        section: st.section,
        overallAttendance: stats ? stats.percentage : 0,
        risk: stats ? stats.risk : 'safe',
        totalAttended: stats ? stats.totalAttended : 0,
        totalConducted: stats ? stats.totalConducted : 0,
        atRiskCount: stats ? stats.subjectsAtRiskCount : 0,
      };
    });
  }, [allStudents, role, currentUser, selectedDept, selectedSemester]);

  // 2. Faculty Report Data
  const facultyReportData = useMemo(() => {
    let list = allSubjects;
    if (role === 'faculty' && currentUser) {
      list = allSubjects.filter((s) => s.facultyId === currentUser.id);
    } else if (selectedDept !== 'ALL') {
      list = list.filter((s) => s.department.toLowerCase() === selectedDept.toLowerCase());
    }

    return list.map((sub) => {
      const enrolled = allStudents.filter(
        (st) =>
          st.department.toLowerCase() === sub.department.toLowerCase() &&
          st.semester === sub.semester &&
          st.section.toUpperCase() === sub.section.toUpperCase()
      );

      let sumPct = 0;
      let atRisk = 0;
      enrolled.forEach((st) => {
        const stats = attendanceService.getStudentAttendance(st.id);
        if (stats) {
          const sStat = stats.subjectStats.find((s) => s.subjectId === sub.id);
          if (sStat) {
            sumPct += sStat.percentage;
            if (sStat.percentage < 75) atRisk++;
          }
        }
      });

      const avg = enrolled.length > 0 ? sumPct / enrolled.length : 0;

      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        facultyName: sub.facultyName || 'Faculty',
        department: sub.department,
        semester: sub.semester,
        section: sub.section,
        totalStudents: enrolled.length,
        averageAttendance: Math.round(avg * 10) / 10,
        atRiskCount: atRisk,
      };
    });
  }, [allSubjects, allStudents, role, currentUser, selectedDept]);

  // 3. Admin Report Data
  const adminReportData = useMemo(() => {
    const adminStats = attendanceService.getAdminStats();
    return adminStats.departmentStats.map((dept) => ({
      department: dept.department,
      code: dept.code,
      studentCount: dept.studentCount,
      averageAttendance: dept.averageAttendance,
      safeCount: dept.riskDistribution.safe,
      warningCount: dept.riskDistribution.warning,
      criticalCount: dept.riskDistribution.critical,
    }));
  }, []);

  // CSV Export
  const handleExportCsv = () => {
    if (activeReportType === 'student') {
      const headers = ['Roll Number', 'Student Name', 'Department', 'Semester', 'Section', 'Attended', 'Conducted', 'Attendance %', 'Risk Status', 'Subjects At Risk'];
      const rows = studentReportData.map((r) => [
        r.rollNumber,
        r.name,
        r.department,
        r.semester,
        r.section,
        r.totalAttended,
        r.totalConducted,
        `${r.overallAttendance.toFixed(1)}%`,
        r.risk.toUpperCase(),
        r.atRiskCount,
      ]);
      downloadCsv('student-attendance-report', headers, rows);
    } else if (activeReportType === 'faculty') {
      const headers = ['Course Code', 'Course Title', 'Instructor', 'Department', 'Semester', 'Section', 'Enrolled Students', 'Average Attendance %', 'At-Risk Count'];
      const rows = facultyReportData.map((r) => [
        r.code,
        r.name,
        r.facultyName,
        r.department,
        r.semester,
        r.section,
        r.totalStudents,
        `${r.averageAttendance.toFixed(1)}%`,
        r.atRiskCount,
      ]);
      downloadCsv('faculty-attendance-report', headers, rows);
    } else {
      const headers = ['Department Code', 'Department Name', 'Total Students', 'Average Attendance %', 'Safe Students', 'Warning Students', 'Critical Students'];
      const rows = adminReportData.map((r) => [
        r.code,
        r.department,
        r.studentCount,
        `${r.averageAttendance.toFixed(1)}%`,
        r.safeCount,
        r.warningCount,
        r.criticalCount,
      ]);
      downloadCsv('admin-attendance-report', headers, rows);
    }
    showToast('Report CSV successfully generated and downloaded.', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    if (activeReportType === 'student') {
      generatePdfReport({
        title: 'Official Student Attendance Standing Report',
        subtitle: `Academic Term Record • Generated for ${currentUser?.name}`,
        metadata: [
          { label: 'Report Scope', value: 'Student Cohort Records' },
          { label: 'Total Records', value: String(studentReportData.length) },
          { label: 'Benchmark Requirement', value: '75.0% Mandatory' },
          { label: 'Authorized Officer', value: currentUser?.name || 'Administrator' },
        ],
        headers: ['Roll No', 'Student', 'Department', 'Sem', 'Attended', 'Total', 'Overall %', 'Standing'],
        rows: studentReportData.slice(0, 45).map((r) => [
          r.rollNumber,
          r.name,
          r.department.split(' ')[0],
          r.semester,
          r.totalAttended,
          r.totalConducted,
          `${r.overallAttendance.toFixed(1)}%`,
          r.risk === 'critical' ? 'Critical' : r.risk === 'warning' ? 'Warning' : 'Safe',
        ]),
        summaryNotes: [
          'Hall ticket eligibility is contingent upon maintaining ≥ 75.0% aggregate attendance.',
          'Records generated through the cryptographic SmartAttend transaction registry.',
        ],
        filename: 'student-attendance-report',
      });
    } else if (activeReportType === 'faculty') {
      generatePdfReport({
        title: 'Course Delivery & Attendance Audit Report',
        subtitle: 'Faculty Instructional Ledger and At-Risk Roll',
        metadata: [
          { label: 'Faculty / Division', value: currentUser?.name || 'Academic Council' },
          { label: 'Courses Audited', value: String(facultyReportData.length) },
          { label: 'Benchmark', value: '75.0% Institutional Minimum' },
        ],
        headers: ['Code', 'Course Title', 'Instructor', 'Sem/Sec', 'Enrolled', 'Avg %', 'At Risk'],
        rows: facultyReportData.map((r) => [
          r.code,
          r.name,
          r.facultyName,
          `Sem ${r.semester}-${r.section}`,
          r.totalStudents,
          `${r.averageAttendance.toFixed(1)}%`,
          r.atRiskCount,
        ]),
        summaryNotes: [
          'Faculty members must contact students with consecutive absences exceeding institutional limits.',
        ],
        filename: 'faculty-attendance-report',
      });
    } else {
      generatePdfReport({
        title: 'University Executive Attendance & Compliance Report',
        subtitle: 'Comprehensive Institutional Multi-Department Ledger',
        metadata: [
          { label: 'Campus Authority', value: 'Office of Academic Affairs' },
          { label: 'Term Code', value: 'Fall Semester' },
          { label: 'Accreditation Standard', value: 'UGC / NAAC Compliant' },
        ],
        headers: ['Code', 'Department', 'Students', 'Average %', 'Safe (≥75%)', 'Warning', 'Critical (<65%)'],
        rows: adminReportData.map((r) => [
          r.code,
          r.department,
          r.studentCount,
          `${r.averageAttendance.toFixed(1)}%`,
          r.safeCount,
          r.warningCount,
          r.criticalCount,
        ]),
        summaryNotes: [
          'Official audit record for institutional review board and senate approval.',
        ],
        filename: 'admin-attendance-report',
      });
    }
    showToast('Official PDF report generated and downloaded.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export & Verification Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Institutional Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate verifiable PDF ledgers and export raw filtered CSV datasets directly to your device.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download CSV
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(role === 'admin' || role === 'faculty' || role === 'student') && (
          <button
            onClick={() => setActiveReportType('student')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeReportType === 'student'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student Report
          </button>
        )}

        {(role === 'admin' || role === 'faculty') && (
          <button
            onClick={() => setActiveReportType('faculty')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeReportType === 'faculty'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Faculty Report
          </button>
        )}

        {role === 'admin' && (
          <button
            onClick={() => setActiveReportType('admin')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeReportType === 'admin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Admin Institutional Report
          </button>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Filter Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Filter Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <span className="text-xs text-slate-400 pb-2">
              Exports dynamically reflect the active filter selection.
            </span>
          </div>
        </div>
      </div>

      {/* Table Data Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {/* TAB 1: Student Report */}
          {activeReportType === 'student' && (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Cohort</th>
                  <th className="py-3 px-3 text-center">Attended / Total</th>
                  <th className="py-3 px-4 text-center">Cumulative %</th>
                  <th className="py-3 px-4 text-right">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {studentReportData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {row.department}
                    </td>
                    <td className="py-3.5 px-3 text-center text-xs text-slate-500 font-mono">
                      Sem {row.semester}-{row.section}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.totalAttended} / {row.totalConducted}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatPercent(row.overallAttendance)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          row.overallAttendance >= 75
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {row.overallAttendance >= 75 ? 'Safe Standing' : 'Deficit (<75%)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: Faculty Report */}
          {activeReportType === 'faculty' && (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Name</th>
                  <th className="py-3 px-3">Instructor</th>
                  <th className="py-3 px-3 text-center">Class</th>
                  <th className="py-3 px-3 text-center">Enrolled</th>
                  <th className="py-3 px-3 text-center">Average Attendance</th>
                  <th className="py-3 px-4 text-right">At-Risk Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {facultyReportData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                      {row.facultyName}
                    </td>
                    <td className="py-3.5 px-3 text-center text-xs text-slate-500 font-mono">
                      Sem {row.semester}-{row.section}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {row.totalStudents}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatPercent(row.averageAttendance)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          row.atRiskCount === 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        {row.atRiskCount} Student(s)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: Admin Report */}
          {activeReportType === 'admin' && (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-3 text-center">Total Students</th>
                  <th className="py-3 px-3 text-center">Average Attendance</th>
                  <th className="py-3 px-3 text-center text-emerald-600 font-bold">Safe (≥75%)</th>
                  <th className="py-3 px-3 text-center text-amber-600 font-bold">Warning</th>
                  <th className="py-3 px-4 text-right text-rose-600 font-bold">Critical (&lt;65%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {adminReportData.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {row.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.department}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {row.studentCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatPercent(row.averageAttendance)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600">
                      {row.safeCount}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-600">
                      {row.warningCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      {row.criticalCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
