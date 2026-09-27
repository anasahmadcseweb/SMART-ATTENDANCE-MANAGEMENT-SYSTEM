import {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  OverallStudentAttendance,
  RiskLevel,
  StudentUser,
  Subject,
  SubjectAttendanceStat,
} from '../types';
import {
  calculateAttendance,
  calculateConsecutiveAbsences,
  calculateMaximumMisses,
  calculateRequiredClasses,
  calculateRisk,
} from '../utils/attendanceCalculations';
import { storage } from './storage';

export interface HistoryItem {
  id: string;
  sessionId: string;
  studentId: string;
  date: string;
  period: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  status: AttendanceStatus;
  timestamp: string;
}

export interface FacultyStats {
  totalStudents: number;
  averageAttendance: number;
  studentsAtRisk: number;
  todayAttendance: number;
  subjectAverages: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    enrolledCount: number;
    attendancePercent: number;
    conductedCount: number;
  }[];
  trendData: {
    date: string;
    presentPercent: number;
  }[];
  riskDistribution: {
    safe: number;
    warning: number;
    critical: number;
  };
}

export interface AdminStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  averageAttendance: number;
  departmentStats: {
    department: string;
    code: string;
    studentCount: number;
    averageAttendance: number;
    riskDistribution: {
      safe: number;
      warning: number;
      critical: number;
    };
  }[];
  overallRiskDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  monthlyTrend: {
    month: string;
    attendance: number;
  }[];
}

export const attendanceService = {
  /**
   * Computes complete attendance stats for a specific student
   */
  getStudentAttendance(studentId: string): OverallStudentAttendance | null {
    const student = storage.getUserById(studentId) as StudentUser | null;
    if (!student || student.role !== 'student') return null;

    const allSubjects = storage.getSubjects();
    const enrolledSubjects = allSubjects.filter(
      (s) =>
        s.department.toLowerCase() === student.department.toLowerCase() &&
        s.semester === student.semester &&
        s.section.toUpperCase() === student.section.toUpperCase()
    );

    const allSessions = storage.getSessions();
    const allRecords = storage.getRecordsForStudent(studentId);

    const subjectStats: SubjectAttendanceStat[] = enrolledSubjects.map((subj) => {
      const subjSessions = allSessions.filter((s) => s.subjectId === subj.id);
      const sessionIds = new Set(subjSessions.map((s) => s.id));

      const subjRecords = allRecords.filter((r) => sessionIds.has(r.sessionId));

      // Sort records chronologically
      const sortedRecords = subjRecords.map((r) => {
        const sess = subjSessions.find((s) => s.id === r.sessionId);
        return {
          ...r,
          date: sess?.date || '',
          period: sess?.period || '',
        };
      }).sort((a, b) => (a.date > b.date ? 1 : -1));

      let attended = 0;
      let late = 0;

      subjRecords.forEach((r) => {
        if (r.status === 'present') attended++;
        else if (r.status === 'late') {
          attended++; // Late counts as attended by default
          late++;
        }
      });

      const conducted = subjSessions.length;
      const percentage = calculateAttendance(attended, conducted);
      const risk = calculateRisk(percentage);
      const requiredClasses = calculateRequiredClasses(attended, conducted, 75);
      const canMissClasses = calculateMaximumMisses(attended, conducted, 75);
      const consecutiveAbsences = calculateConsecutiveAbsences(sortedRecords);

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        subjectCode: subj.code,
        facultyName: subj.facultyName || 'Faculty',
        attended,
        conducted,
        late,
        percentage,
        risk,
        requiredClasses,
        canMissClasses,
        consecutiveAbsences,
      };
    });

    let totalConducted = 0;
    let totalAttended = 0;
    let totalLate = 0;
    let subjectsAtRiskCount = 0;

    subjectStats.forEach((s) => {
      totalConducted += s.conducted;
      totalAttended += s.attended;
      totalLate += s.late;
      if (s.risk === 'warning' || s.risk === 'critical') {
        subjectsAtRiskCount++;
      }
    });

    const percentage = calculateAttendance(totalAttended, totalConducted);
    const overallRisk = calculateRisk(percentage);

    return {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      semester: student.semester,
      section: student.section,
      totalConducted,
      totalAttended,
      totalLate,
      percentage,
      risk: overallRisk,
      subjectsCount: enrolledSubjects.length,
      subjectsAtRiskCount,
      subjectStats,
    };
  },

  /**
   * Retrieves enriched student history with session details
   */
  getStudentHistory(studentId: string): HistoryItem[] {
    const studentRecords = storage.getRecordsForStudent(studentId);
    const sessions = storage.getSessions();
    const subjects = storage.getSubjects();

    const sessionMap = new Map<string, AttendanceSession>();
    sessions.forEach((s) => sessionMap.set(s.id, s));

    const subjectMap = new Map<string, Subject>();
    subjects.forEach((s) => subjectMap.set(s.id, s));

    const items: HistoryItem[] = [];

    studentRecords.forEach((rec) => {
      const sess = sessionMap.get(rec.sessionId);
      if (!sess) return;
      const subj = subjectMap.get(sess.subjectId);

      items.push({
        id: rec.id,
        sessionId: sess.id,
        studentId: rec.studentId,
        date: sess.date,
        period: sess.period,
        subjectId: sess.subjectId,
        subjectName: subj?.name || 'Subject',
        subjectCode: subj?.code || '',
        facultyName: subj?.facultyName || 'Faculty',
        status: rec.status,
        timestamp: rec.timestamp,
      });
    });

    // Sort descending by date
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  /**
   * Mark attendance for a session
   * Verifies no duplicates exist for: subjectId + date + period + section
   */
  submitAttendanceSession(params: {
    subjectId: string;
    facultyId: string;
    date: string;
    period: string;
    section: string;
    studentStatuses: { studentId: string; status: AttendanceStatus }[];
  }): { success: boolean; message: string; sessionId?: string } {
    const { subjectId, facultyId, date, period, section, studentStatuses } = params;

    if (!subjectId || !date || !period || !section) {
      return { success: false, message: 'All session fields are required.' };
    }

    if (!studentStatuses || studentStatuses.length === 0) {
      return { success: false, message: 'No student attendance data provided.' };
    }

    // Duplicate check
    const existing = storage.findExistingSession(subjectId, date, period, section);
    if (existing) {
      return {
        success: false,
        message: 'Attendance has already been recorded for this session.',
      };
    }

    const sessionId = `sess_${subjectId}_${date.replace(/-/g, '')}_${Date.now().toString().slice(-4)}`;

    const newSession: AttendanceSession = {
      id: sessionId,
      subjectId,
      facultyId,
      date,
      period,
      section,
      createdAt: new Date().toISOString(),
    };

    storage.createSession(newSession);

    const newRecords: AttendanceRecord[] = studentStatuses.map((st) => ({
      id: `rec_${sessionId}_${st.studentId}`,
      sessionId,
      studentId: st.studentId,
      status: st.status,
      timestamp: new Date().toISOString(),
    }));

    storage.saveRecordsBatch(newRecords);

    return {
      success: true,
      message: `Attendance recorded successfully for ${studentStatuses.length} students.`,
      sessionId,
    };
  },

  /**
   * Update an existing student's record directly (for live testing)
   */
  updateStudentRecord(recordId: string, status: AttendanceStatus): boolean {
    return storage.updateRecordStatus(recordId, status);
  },

  /**
   * Faculty dashboard statistics
   */
  getFacultyStats(facultyId: string): FacultyStats {
    const allSubjects = storage.getSubjects();
    const assignedSubjects = allSubjects.filter((s) => s.facultyId === facultyId);
    const assignedSubjectIds = new Set(assignedSubjects.map((s) => s.id));

    const allUsers = storage.getUsers();
    const allStudents = allUsers.filter((u) => u.role === 'student') as StudentUser[];
    const allSessions = storage.getSessions();
    const allRecords = storage.getRecords();

    // Students enrolled in this faculty's subjects
    const enrolledStudents = allStudents.filter((student) =>
      assignedSubjects.some(
        (subj) =>
          subj.department.toLowerCase() === student.department.toLowerCase() &&
          subj.semester === student.semester &&
          subj.section.toUpperCase() === student.section.toUpperCase()
      )
    );

    // Subject statistics
    const subjectAverages = assignedSubjects.map((subj) => {
      const subjSessions = allSessions.filter((s) => s.subjectId === subj.id);
      const sessionIds = new Set(subjSessions.map((s) => s.id));
      const subjRecords = allRecords.filter((r) => sessionIds.has(r.sessionId));

      const enrolledCount = allStudents.filter(
        (st) =>
          st.department.toLowerCase() === subj.department.toLowerCase() &&
          st.semester === subj.semester &&
          st.section.toUpperCase() === subj.section.toUpperCase()
      ).length;

      let attended = 0;
      subjRecords.forEach((r) => {
        if (r.status === 'present' || r.status === 'late') attended++;
      });

      const totalPossible = subjRecords.length;
      const attendancePercent = totalPossible > 0 ? calculateAttendance(attended, totalPossible) : 0;

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        subjectCode: subj.code,
        enrolledCount,
        attendancePercent,
        conductedCount: subjSessions.length,
      };
    });

    // Overall average
    const totalSubjectPct = subjectAverages.reduce((acc, curr) => acc + curr.attendancePercent, 0);
    const averageAttendance = subjectAverages.length > 0 ? Math.round((totalSubjectPct / subjectAverages.length) * 10) / 10 : 0;

    // Risk count
    let safeCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    enrolledStudents.forEach((st) => {
      const stats = this.getStudentAttendance(st.id);
      if (stats) {
        if (stats.risk === 'critical') criticalCount++;
        else if (stats.risk === 'warning') warningCount++;
        else safeCount++;
      }
    });

    // Today's attendance
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = allSessions.filter((s) => assignedSubjectIds.has(s.subjectId) && s.date === todayStr);
    const todaySessionIds = new Set(todaySessions.map((s) => s.id));
    const todayRecords = allRecords.filter((r) => todaySessionIds.has(r.sessionId));

    let todayAttended = 0;
    todayRecords.forEach((r) => {
      if (r.status === 'present' || r.status === 'late') todayAttended++;
    });
    const todayAttendance = todayRecords.length > 0 ? calculateAttendance(todayAttended, todayRecords.length) : averageAttendance;

    // Trend data (last 7 recorded dates)
    const facultySessions = allSessions
      .filter((s) => assignedSubjectIds.has(s.subjectId))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    const dateMap = new Map<string, { attended: number; total: number }>();
    facultySessions.forEach((sess) => {
      const sessRecs = allRecords.filter((r) => r.sessionId === sess.id);
      const curr = dateMap.get(sess.date) || { attended: 0, total: 0 };
      sessRecs.forEach((r) => {
        curr.total++;
        if (r.status === 'present' || r.status === 'late') curr.attended++;
      });
      dateMap.set(sess.date, curr);
    });

    const trendData = Array.from(dateMap.entries())
      .slice(-7)
      .map(([date, d]) => ({
        date: date.slice(5), // MM-DD
        presentPercent: d.total > 0 ? Math.round((d.attended / d.total) * 100) : 0,
      }));

    return {
      totalStudents: enrolledStudents.length,
      averageAttendance,
      studentsAtRisk: warningCount + criticalCount,
      todayAttendance,
      subjectAverages,
      trendData,
      riskDistribution: {
        safe: safeCount,
        warning: warningCount,
        critical: criticalCount,
      },
    };
  },

  /**
   * Admin dashboard & Institutional analytics
   */
  getAdminStats(): AdminStats {
    const allUsers = storage.getUsers();
    const students = allUsers.filter((u) => u.role === 'student') as StudentUser[];
    const faculty = allUsers.filter((u) => u.role === 'faculty');
    const departments = storage.getDepartments();

    let safeCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let sumOverallPct = 0;

    const studentAttendances = students.map((st) => {
      const stat = this.getStudentAttendance(st.id);
      if (stat) {
        sumOverallPct += stat.percentage;
        if (stat.risk === 'critical') criticalCount++;
        else if (stat.risk === 'warning') warningCount++;
        else safeCount++;
      }
      return { student: st, stat };
    });

    const averageAttendance = students.length > 0 ? Math.round((sumOverallPct / students.length) * 10) / 10 : 81.5;

    // Department Stats
    const departmentStats = departments.map((dept) => {
      const deptStudents = studentAttendances.filter(
        (sa) => sa.student.department.toLowerCase() === dept.name.toLowerCase()
      );

      let deptSafe = 0;
      let deptWarn = 0;
      let deptCrit = 0;
      let deptSum = 0;

      deptStudents.forEach((sa) => {
        if (sa.stat) {
          deptSum += sa.stat.percentage;
          if (sa.stat.risk === 'critical') deptCrit++;
          else if (sa.stat.risk === 'warning') deptWarn++;
          else deptSafe++;
        }
      });

      const avg = deptStudents.length > 0 ? Math.round((deptSum / deptStudents.length) * 10) / 10 : 80;

      return {
        department: dept.name,
        code: dept.code,
        studentCount: deptStudents.length,
        averageAttendance: avg,
        riskDistribution: {
          safe: deptSafe,
          warning: deptWarn,
          critical: deptCrit,
        },
      };
    });

    return {
      totalStudents: students.length,
      totalFaculty: faculty.length,
      totalDepartments: departments.length,
      averageAttendance,
      departmentStats,
      overallRiskDistribution: [
        { name: 'Safe (>=75%)', value: safeCount, color: '#10B981' },
        { name: 'Warning (65-74%)', value: warningCount, color: '#F59E0B' },
        { name: 'Critical (<65%)', value: criticalCount, color: '#EF4444' },
      ],
      monthlyTrend: [
        { month: 'Jun', attendance: 84.5 },
        { month: 'Jul', attendance: 83.2 },
        { month: 'Aug', attendance: 82.0 },
        { month: 'Sep', attendance: averageAttendance },
      ],
    };
  },
};
