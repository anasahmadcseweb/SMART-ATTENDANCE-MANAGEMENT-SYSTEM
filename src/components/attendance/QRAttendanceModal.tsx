import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { Subject, StudentUser, AttendanceStatus, AttendanceRecord } from '../../types';
import { Modal } from '../common/Modal';
import {
  QrCode,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Copy,
  Sparkles,
  Play,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface QRAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const QRAttendanceModal: React.FC<QRAttendanceModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId,
}) => {
  const { currentUser, role } = useAuth();
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [section, setSection] = useState<string>('A');
  const [period, setPeriod] = useState<string>('Period 3 (11:30 - 12:30)');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Session Code & Expiry
  const [sessionCode, setSessionCode] = useState<string>('SA-7482');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes
  const [isActiveSession, setIsActiveSession] = useState<boolean>(true);
  const [checkedInStudentIds, setCheckedInStudentIds] = useState<string[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentUser[]>([]);
  const [studentInputCode, setStudentInputCode] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize subjects
  useEffect(() => {
    const allSubjects = storage.getSubjects();
    const available = role === 'faculty' && currentUser
      ? allSubjects.filter((s) => s.facultyId === currentUser.id)
      : allSubjects;

    setSubjects(available.length > 0 ? available : allSubjects);
    if (defaultSubjectId) {
      setSelectedSubjectId(defaultSubjectId);
    } else if (available.length > 0) {
      setSelectedSubjectId(available[0].id);
    }
  }, [currentUser, role, defaultSubjectId]);

  // Load students for subject & section
  useEffect(() => {
    if (!selectedSubjectId) return;
    const sub = storage.getSubjectById(selectedSubjectId);
    if (!sub) return;

    const allUsers = storage.getUsers();
    const students = allUsers.filter(
      (u) =>
        u.role === 'student' &&
        u.department.toLowerCase() === sub.department.toLowerCase() &&
        u.semester === sub.semester &&
        u.section.toUpperCase() === section.toUpperCase()
    ) as StudentUser[];

    setEnrolledStudents(students);

    // Check if session already exists
    const existing = storage.findExistingSession(selectedSubjectId, date, period, section);
    if (existing) {
      const records = storage.getRecordsForSession(existing.id);
      const presentIds = records
        .filter((r) => r.status === 'present' || r.status === 'late')
        .map((r) => r.studentId);
      setCheckedInStudentIds(presentIds);
    } else {
      // Simulate initial 2 attendees already checked in
      setCheckedInStudentIds(students.slice(0, 2).map((s) => s.id));
    }
  }, [selectedSubjectId, section, period, date]);

  // Countdown timer for rotating QR
  useEffect(() => {
    if (!isOpen || !isActiveSession) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Generate new token
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          setSessionCode(`SA-${randomNum}`);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActiveSession]);

  const handleRefreshCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setSessionCode(`SA-${randomNum}`);
    setSecondsRemaining(600);
    showToast('New QR security token & passkey generated!', 'info');
  };

  const handleStudentSelfCheckIn = (studentIdToMark?: string) => {
    const studentToMark = studentIdToMark
      ? enrolledStudents.find((s) => s.id === studentIdToMark)
      : role === 'student' && currentUser
      ? (currentUser as StudentUser)
      : enrolledStudents.find((s) => !checkedInStudentIds.includes(s.id));

    if (!studentToMark) {
      showToast('All enrolled students have already checked in!', 'info');
      return;
    }

    if (checkedInStudentIds.includes(studentToMark.id)) {
      showToast(`${studentToMark.name} is already checked in.`, 'warning');
      return;
    }

    // Persist session and records in storage
    let session = storage.findExistingSession(selectedSubjectId, date, period, section);
    if (!session) {
      session = storage.createSession({
        id: `sess_qr_${Date.now()}`,
        subjectId: selectedSubjectId,
        facultyId: currentUser?.id || 'fac_jenkins',
        date,
        period,
        section,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedIds = [...checkedInStudentIds, studentToMark.id];
    setCheckedInStudentIds(updatedIds);

    const record: AttendanceRecord = {
      id: `rec_${session.id}_${studentToMark.id}`,
      sessionId: session.id,
      studentId: studentToMark.id,
      status: 'present',
      timestamp: new Date().toISOString(),
    };
    storage.saveRecordsBatch([record]);

    showToast(`Checked in ${studentToMark.name} (${studentToMark.rollNumber}) via QR code!`, 'success');
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInputCode.trim()) return;

    if (studentInputCode.toUpperCase().replace(/\s+/g, '') === sessionCode.toUpperCase().replace(/\s+/g, '')) {
      handleStudentSelfCheckIn();
      setStudentInputCode('');
    } else {
      showToast('Invalid QR session code. Please verify the 4-digit token on display.', 'error');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedSubject = storage.getSubjectById(selectedSubjectId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic QR Code Attendance"
      subtitle="Students scan the projected QR or enter the rotating passkey to check in instantly."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Controls Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div>
            <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Section & Period
            </label>
            <div className="flex gap-2">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
              </select>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold truncate"
              >
                <option value="Period 1 (09:00 - 10:00)">P1 (9:00-10:00)</option>
                <option value="Period 2 (10:15 - 11:15)">P2 (10:15-11:15)</option>
                <option value="Period 3 (11:30 - 12:30)">P3 (11:30-12:30)</option>
                <option value="Period 4 (01:30 - 02:30)">P4 (1:30-2:30)</option>
                <option value="Period 5 (02:45 - 03:45)">P5 (2:45-3:45)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Security Token
            </label>
            <div className="flex items-center gap-2">
              <span className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-extrabold text-sm border border-blue-200 dark:border-blue-800 text-center">
                {sessionCode}
              </span>
              <button
                onClick={handleRefreshCode}
                title="Regenerate token"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* QR Display Card & Live Attendance Stream */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: QR Canvas (6 cols) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <div className="w-full max-w-[260px] aspect-square p-4 rounded-2xl bg-white border-2 border-dashed border-blue-300 dark:border-blue-700/60 shadow-inner flex flex-col items-center justify-center relative">
              {/* Simulated Geometric QR Code SVG */}
              <svg viewBox="0 0 200 200" className="w-full h-full text-slate-900">
                {/* Corner Positioning Squares */}
                <rect x="10" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                <rect x="20" y="20" width="30" height="30" rx="3" fill="#FFFFFF" />
                <rect x="27" y="27" width="16" height="16" rx="2" fill="#2563EB" />

                <rect x="140" y="10" width="50" height="50" rx="6" fill="#0F172A" />
                <rect x="150" y="20" width="30" height="30" rx="3" fill="#FFFFFF" />
                <rect x="157" y="27" width="16" height="16" rx="2" fill="#2563EB" />

                <rect x="10" y="140" width="50" height="50" rx="6" fill="#0F172A" />
                <rect x="20" y="150" width="30" height="30" rx="3" fill="#FFFFFF" />
                <rect x="27" y="157" width="16" height="16" rx="2" fill="#2563EB" />

                {/* Pattern Data Dots */}
                <rect x="70" y="20" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="90" y="20" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="110" y="20" width="12" height="12" fill="#0F172A" rx="2" />

                <rect x="70" y="40" width="12" height="12" fill="#2563EB" rx="2" />
                <rect x="90" y="50" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="115" y="45" width="12" height="12" fill="#0F172A" rx="2" />

                <rect x="20" y="70" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="40" y="80" width="12" height="12" fill="#2563EB" rx="2" />
                <rect x="20" y="100" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="40" y="115" width="12" height="12" fill="#0F172A" rx="2" />

                <rect x="70" y="70" width="60" height="60" rx="12" fill="#DBEAFE" />
                <rect x="85" y="85" width="30" height="30" rx="6" fill="#2563EB" />

                <rect x="145" y="70" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="170" y="80" width="12" height="12" fill="#2563EB" rx="2" />
                <rect x="150" y="100" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="175" y="115" width="12" height="12" fill="#0F172A" rx="2" />

                <rect x="70" y="145" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="95" y="150" width="12" height="12" fill="#2563EB" rx="2" />
                <rect x="120" y="145" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="75" y="170" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="100" y="175" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="125" y="170" width="12" height="12" fill="#2563EB" rx="2" />
                <rect x="150" y="160" width="12" height="12" fill="#0F172A" rx="2" />
                <rect x="170" y="170" width="12" height="12" fill="#0F172A" rx="2" />
              </svg>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Rotates in:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatTime(secondsRemaining)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(sessionCode);
                  showToast(`Session code ${sessionCode} copied to clipboard!`, 'success');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copy Code
              </button>
              <button
                onClick={() => handleStudentSelfCheckIn()}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Simulate Scan
              </button>
            </div>
          </div>

          {/* Right: Live Stream & Checked-in Students (6 cols) */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Live Attendance Check-Ins
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {checkedInStudentIds.length} / {enrolledStudents.length} present (
                  {enrolledStudents.length > 0
                    ? Math.round((checkedInStudentIds.length / enrolledStudents.length) * 100)
                    : 0}
                  %)
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      enrolledStudents.length > 0
                        ? (checkedInStudentIds.length / enrolledStudents.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              {/* Stream list */}
              <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
                {checkedInStudentIds.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Waiting for students to scan QR code...
                  </div>
                ) : (
                  checkedInStudentIds.map((id) => {
                    const st = enrolledStudents.find((s) => s.id === id);
                    if (!st) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-xs animate-in fade-in"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {st.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({st.rollNumber})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          Verified
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Student Check-in Input for students or manual verification */}
            <form onSubmit={handleManualCodeSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Manual Code Check-in (e.g. for student smartphone):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code SA-XXXX"
                  value={studentInputCode}
                  onChange={(e) => setStudentInputCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Attendance updates persist directly to the institutional ledger.
          </p>
          <button
            onClick={() => {
              showToast('QR Attendance session completed and saved!', 'success');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Done & Save Session
          </button>
        </div>
      </div>
    </Modal>
  );
};
