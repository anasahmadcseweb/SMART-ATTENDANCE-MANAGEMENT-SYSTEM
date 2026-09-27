export type UserRole = 'student' | 'faculty' | 'admin';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface StudentUser extends BaseUser {
  role: 'student';
  rollNumber: string;
  department: string;
  semester: number;
  section: string;
  phone?: string;
}

export interface FacultyUser extends BaseUser {
  role: 'faculty';
  department: string;
  assignedSubjects: string[]; // subject IDs or codes
  designation?: string;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  department?: string;
}

export type AppUser = StudentUser | FacultyUser | AdminUser;

export interface Subject {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  facultyName?: string;
  department: string;
  semester: number;
  section: string;
  totalCredits?: number;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment?: string;
}

export interface Semester {
  id: string;
  number: number;
  label: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceSession {
  id: string;
  subjectId: string;
  facultyId: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g. "Period 1 (09:00 - 10:00)"
  section: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  timestamp: string;
}

export type RiskLevel = 'safe' | 'warning' | 'critical';

export interface SubjectAttendanceStat {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  attended: number;
  conducted: number;
  late: number;
  percentage: number;
  risk: RiskLevel;
  requiredClasses: number;
  canMissClasses: number;
  consecutiveAbsences: number;
}

export interface OverallStudentAttendance {
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  semester: number;
  section: string;
  totalConducted: number;
  totalAttended: number;
  totalLate: number;
  percentage: number;
  risk: RiskLevel;
  subjectsCount: number;
  subjectsAtRiskCount: number;
  subjectStats: SubjectAttendanceStat[];
}

export interface SmartAlert {
  id: string;
  type: 'risk' | 'recovery' | 'consecutive_absence' | 'overall';
  title: string;
  message: string;
  severity: 'danger' | 'warning' | 'success' | 'info';
  timestamp: string;
  subjectId?: string;
  studentId?: string;
  dismissed?: boolean;
}
