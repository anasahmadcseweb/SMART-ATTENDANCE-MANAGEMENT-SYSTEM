import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import { Subject, StudentUser, AttendanceStatus, AttendanceSession, AttendanceRecord } from '../../types';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  AlertCircle,
  Users,
  QrCode,
} from 'lucide-react';
import { QRAttendanceModal } from '../../components/attendance/QRAttendanceModal';

export const FacultyAttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('Period 3 (11:30 - 12:30)');
  const [section, setSection] = useState<string>('A');

  const [enrolledStudents, setEnrolledStudents] = useState<StudentUser[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alreadyRecorded, setAlreadyRecorded] = useState<boolean>(false);
  const [existingSession, setExistingSession] = useState<AttendanceSession | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Load faculty's subjects
  useEffect(() => {
    if (currentUser?.id) {
      const allSubjects = storage.getSubjects();
      const subs = currentUser.role === 'admin'
        ? allSubjects
        : allSubjects.filter((s) => s.facultyId === currentUser.id);

      setAssignedSubjects(subs);
      if (subs.length > 0 && !selectedSubjectId) {
        const dbms = subs.find((s) => s.code === 'CS503');
        setSelectedSubjectId(dbms ? dbms.id : subs[0].id);
      }
    }
  }, [currentUser]);

  // Load students for subject
  useEffect(() => {
    if (!selectedSubjectId) return;

    const subject = storage.getSubjectById(selectedSubjectId);
    if (!subject) return;

    const allUsers = storage.getUsers();
    const students = allUsers.filter(
      (u) =>
        u.role === 'student' &&
        u.department.toLowerCase() === subject.department.toLowerCase() &&
        u.semester === subject.semester &&
        u.section.toUpperCase() === section.toUpperCase()
    ) as StudentUser[];

    students.sort((a, b) => (a.rollNumber > b.rollNumber ? 1 : -1));
    setEnrolledStudents(students);

    // Duplicate check for: subjectId + date + period + section
    const existing = storage.findExistingSession(selectedSubjectId, date, period, section);
    if (existing) {
      setAlreadyRecorded(true);
      setExistingSession(existing);

      const existingRecords = storage.getRecordsForSession(existing.id);
      const initialMap: Record<string, AttendanceStatus> = {};
      students.forEach((st) => {
        const found = existingRecords.find((r) => r.studentId === st.id);
        initialMap[st.id] = found ? found.status : 'present';
      });
      setAttendanceMap(initialMap);
    } else {
      setAlreadyRecorded(false);
      setExistingSession(null);
      const initialMap: Record<string, AttendanceStatus> = {};
      students.forEach((st) => {
        initialMap[st.id] = 'present';
      });
      setAttendanceMap(initialMap);
    }
  }, [selectedSubjectId, date, period, section]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach((st) => {
      updated[st.id] = status;
    });
    setAttendanceMap(updated);
    showToast(`Marked all ${enrolledStudents.length} students as ${status.toUpperCase()}.`, 'info');
  };

  const handleSubmit = async () => {
    if (!selectedSubjectId || !date || !period || !section) {
      showToast('Please provide all session details (Subject, Date, Period, Section).', 'error');
      return;
    }

    if (enrolledStudents.length === 0) {
      showToast('No students enrolled in this section.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (existingSession) {
      const recordsToUpdate: AttendanceRecord[] = enrolledStudents.map((st) => ({
        id: `rec_${existingSession.id}_${st.id}`,
        sessionId: existingSession.id,
        studentId: st.id,
        status: attendanceMap[st.id] || 'present',
        timestamp: new Date().toISOString(),
      }));

      storage.saveRecordsBatch(recordsToUpdate);
      setIsSubmitting(false);
      showToast('Attendance records updated successfully!', 'success');
      return;
    }

    const duplicate = storage.findExistingSession(selectedSubjectId, date, period, section);
    if (duplicate) {
      setIsSubmitting(false);
      setAlreadyRecorded(true);
      showToast('Attendance has already been recorded for this session.', 'error');
      return;
    }

    const studentStatuses = enrolledStudents.map((st) => ({
      studentId: st.id,
      status: attendanceMap[st.id] || 'present',
    }));

    const result = attendanceService.submitAttendanceSession({
      subjectId: selectedSubjectId,
      facultyId: currentUser?.id || 'fac_unknown',
      date,
      period,
      section,
      studentStatuses,
    });

    setIsSubmitting(false);

    if (result.success) {
      setAlreadyRecorded(true);
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const selectedSubject = storage.getSubjectById(selectedSubjectId);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  enrolledStudents.forEach((st) => {
    const s = attendanceMap[st.id];
    if (s === 'present') presentCount++;
    else if (s === 'absent') absentCount++;
    else if (s === 'late') lateCount++;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mark Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record today's attendance for your class.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowQRModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs flex items-center gap-2 self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Launch QR Attendance</span>
        </button>
      </div>

      {/* Filters Ribbon Card */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              {assignedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            />
          </div>

          {/* Period */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="Period 1 (09:00 - 10:00)">Period 1 (09:00 - 10:00)</option>
              <option value="Period 2 (10:15 - 11:15)">Period 2 (10:15 - 11:15)</option>
              <option value="Period 3 (11:30 - 12:30)">Period 3 (11:30 - 12:30)</option>
              <option value="Period 4 (01:30 - 02:30)">Period 4 (01:30 - 02:30)</option>
              <option value="Period 5 (02:45 - 03:45)">Period 5 (02:45 - 03:45)</option>
            </select>
          </div>
        </div>

        {alreadyRecorded && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Existing Record Loaded:</span> Attendance for{' '}
              <span className="font-mono font-semibold">{selectedSubject?.code}</span> on{' '}
              <span className="font-mono font-semibold">{date}</span> is already on record. You can adjust statuses and update the session below.
            </div>
          </div>
        )}
      </div>

      {/* Clean Student Table */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {enrolledStudents.length} Students
            </span>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                {presentCount} Present
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                {absentCount} Absent
              </span>
              {lateCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                  {lateCount} Late
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-28">Roll</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
              {enrolledStudents.map((student) => {
                const currentStatus = attendanceMap[student.id] || 'present';

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {student.rollNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {student.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {student.email}
                      </span>
                    </td>

                    {/* Status Toggle Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Submit Bar with Visually Prominent Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Attendance updates reflect immediately in student dashboards and compliance reports.
          </p>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? 'Recording...'
              : alreadyRecorded
              ? 'Update Session Attendance'
              : 'Submit Attendance'}
          </button>
        </div>
      </div>

      {/* QR Attendance Modal */}
      <QRAttendanceModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        defaultSubjectId={selectedSubjectId}
      />
    </div>
  );
};
