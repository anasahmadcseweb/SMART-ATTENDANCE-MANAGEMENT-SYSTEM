import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService, HistoryItem } from '../../services/attendanceService';
import { storage } from '../../services/storage';
import { formatDate } from '../../utils/formatters';
import { downloadCsv } from '../../utils/exportCsv';
import { generatePdfReport } from '../../utils/exportPdf';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  History,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

export const StudentHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

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

  // Extract unique subjects for dropdown
  const subjectOptions = useMemo(() => {
    const set = new Map<string, string>();
    history.forEach((h) => set.set(h.subjectId, `${h.subjectCode} — ${h.subjectName}`));
    return Array.from(set.entries());
  }, [history]);

  // Filtered dataset
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (subjectFilter !== 'ALL' && item.subjectId !== subjectFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (dateFilter && item.date !== dateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.subjectName.toLowerCase().includes(q);
        const matchesCode = item.subjectCode.toLowerCase().includes(q);
        const matchesFaculty = item.facultyName.toLowerCase().includes(q);
        const matchesDate = item.date.includes(q);
        if (!matchesName && !matchesCode && !matchesFaculty && !matchesDate) return false;
      }
      return true;
    });
  }, [history, subjectFilter, statusFilter, dateFilter, searchQuery]);

  const handleExportCsv = () => {
    if (filteredHistory.length === 0) {
      showToast('No history records to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Period', 'Subject Code', 'Subject Name', 'Faculty', 'Status'];
    const rows = filteredHistory.map((h) => [
      h.date,
      h.period,
      h.subjectCode,
      h.subjectName,
      h.facultyName,
      h.status.toUpperCase(),
    ]);

    downloadCsv(`student-attendance-history-${currentUser?.name.replace(/\s+/g, '-').toLowerCase()}`, headers, rows);
    showToast('Attendance log exported to CSV successfully.', 'success');
  };

  const handleExportPdf = () => {
    if (filteredHistory.length === 0) {
      showToast('No history records to export.', 'warning');
      return;
    }

    generatePdfReport({
      title: 'Individual Student Attendance Log History',
      subtitle: `Official institutional record for ${currentUser?.name}`,
      metadata: [
        { label: 'Student Name', value: currentUser?.name || '' },
        { label: 'Department', value: (currentUser as any)?.department || 'Engineering' },
        { label: 'Total Records Displayed', value: String(filteredHistory.length) },
        { label: 'Exported By', value: 'SmartAttend Verification Service' },
      ],
      headers: ['Date', 'Period', 'Code', 'Subject', 'Instructor', 'Status'],
      rows: filteredHistory.map((h) => [
        h.date,
        h.period.split(' ')[0] + ' ' + h.period.split(' ')[1],
        h.subjectCode,
        h.subjectName,
        h.facultyName,
        h.status === 'present' ? 'Present' : h.status === 'absent' ? 'Absent' : 'Late',
      ]),
      summaryNotes: [
        'Late entries are recorded under institutionally excused attendance protocol.',
        'Official inquiries regarding session corrections must be submitted within 3 academic days.',
      ],
      filename: `student-attendance-report-${currentUser?.name.replace(/\s+/g, '-').toLowerCase()}`,
    });

    showToast('Attendance report PDF generated successfully.', 'success');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSubjectFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('');
  };

  if (loading) {
    return <LoadingSpinner message="Fetching verified session records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            Full Audit Log
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete, immutable session logs of all attended and missed lectures.
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

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Subjects</option>
              {subjectOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Attendance Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
              <option value="late">Late (Attended) Only</option>
            </select>
          </div>

          {/* Date Filter & Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
            {(searchQuery || subjectFilter !== 'ALL' || statusFilter !== 'ALL' || dateFilter) && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Showing {filteredHistory.length} of {history.length} verified sessions</span>
          <span className="font-mono">Live database query</span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Attendance Records Found"
            description="Try modifying or resetting your search and filter criteria."
            action={{
              label: 'Clear Filters',
              onClick: handleResetFilters,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-3">Period</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Logged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                      {formatDate(item.date)}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {item.period}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.subjectCode}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.subjectName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.facultyName}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'present' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </span>
                      )}
                      {item.status === 'absent' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                      {item.status === 'late' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5" /> Late (Attended)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
