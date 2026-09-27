import {
  AppUser,
  Subject,
  Department,
  Semester,
  AttendanceSession,
  AttendanceRecord,
  StudentUser,
  FacultyUser,
  AdminUser,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'smartattend_users',
  SUBJECTS: 'smartattend_subjects',
  DEPARTMENTS: 'smartattend_departments',
  SESSIONS: 'smartattend_sessions',
  RECORDS: 'smartattend_records',
  ACTIVE_USER_ID: 'smartattend_active_uid',
  THEME: 'smartattend_theme',
};

// Seed dataset
const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept_cse', name: 'Computer Science & Engineering', code: 'CSE', headOfDepartment: 'Dr. Sarah Jenkins' },
  { id: 'dept_ece', name: 'Electronics & Communication', code: 'ECE', headOfDepartment: 'Dr. Meera Nambiar' },
  { id: 'dept_me', name: 'Mechanical Engineering', code: 'ME', headOfDepartment: 'Dr. Robert Chen' },
  { id: 'dept_civil', name: 'Civil Engineering', code: 'CIVIL', headOfDepartment: 'Dr. Emily Watson' },
];

const SEED_USERS: AppUser[] = [
  // Student 1: Anas Ahmad (The key demo student)
  {
    id: 'student_aarav',
    name: 'Anas Ahmad',
    email: 'aanasahmad713@gmail.com',
    role: 'student',
    rollNumber: '21CS042',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 234-5678',
    createdAt: '2024-08-01T09:00:00Z',
  },
  // Student 2: Priya Patel (Safe student ~90%)
  {
    id: 'student_priya',
    name: 'Priya Patel',
    email: 'priya.patel@smartattend.edu',
    role: 'student',
    rollNumber: '21CS018',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 345-6789',
    createdAt: '2024-08-01T09:00:00Z',
  },
  // Student 3: Rohan Verma (Warning student ~70%)
  {
    id: 'student_rohan',
    name: 'Rohan Verma',
    email: 'rohan.verma@smartattend.edu',
    role: 'student',
    rollNumber: '21CS029',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 456-7890',
    createdAt: '2024-08-01T09:00:00Z',
  },
  // Student 4: Sneha Gupta (High performer 95%)
  {
    id: 'student_sneha',
    name: 'Sneha Gupta',
    email: 'sneha.gupta@smartattend.edu',
    role: 'student',
    rollNumber: '21CS035',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 567-8901',
    createdAt: '2024-08-01T09:00:00Z',
  },
  // Student 5: Ananya Iyer (Warning 71%)
  {
    id: 'student_ananya',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@smartattend.edu',
    role: 'student',
    rollNumber: '21CS009',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 678-9012',
    createdAt: '2024-08-01T09:00:00Z',
  },
  // Student 6: Vikramaditya Rao (Critical in 2 subjects)
  {
    id: 'student_vikram',
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@smartattend.edu',
    role: 'student',
    rollNumber: '21CS051',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    phone: '+1 (555) 789-0123',
    createdAt: '2024-08-01T09:00:00Z',
  },

  // Faculty 1: Dr. Rajesh Kumar (Teaches DBMS and OS)
  {
    id: 'fac_rajesh',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@smartattend.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    assignedSubjects: ['subj_dbms', 'subj_os'],
    designation: 'Associate Professor',
    createdAt: '2023-01-15T09:00:00Z',
  },
  // Faculty 2: Prof. Anita Roy (Teaches DSA and Networks)
  {
    id: 'fac_anita',
    name: 'Prof. Anita Roy',
    email: 'anita.roy@smartattend.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    assignedSubjects: ['subj_dsa', 'subj_cn'],
    designation: 'Assistant Professor',
    createdAt: '2023-03-20T09:00:00Z',
  },
  // Faculty 3: Dr. Meera Nambiar
  {
    id: 'fac_meera',
    name: 'Dr. Meera Nambiar',
    email: 'meera.nambiar@smartattend.edu',
    role: 'faculty',
    department: 'Electronics & Communication',
    assignedSubjects: ['subj_maths'],
    designation: 'Professor & HOD',
    createdAt: '2022-06-10T09:00:00Z',
  },

  // Admin: Dr. Sarah Jenkins
  {
    id: 'admin_sarah',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@smartattend.edu',
    role: 'admin',
    department: 'Computer Science & Engineering',
    createdAt: '2022-01-01T09:00:00Z',
  },
];

const SEED_SUBJECTS: Subject[] = [
  {
    id: 'subj_dsa',
    name: 'Data Structures & Algorithms',
    code: 'CS501',
    facultyId: 'fac_anita',
    facultyName: 'Prof. Anita Roy',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    totalCredits: 4,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'subj_os',
    name: 'Operating Systems',
    code: 'CS502',
    facultyId: 'fac_rajesh',
    facultyName: 'Dr. Rajesh Kumar',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    totalCredits: 4,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'subj_dbms',
    name: 'Database Management Systems',
    code: 'CS503',
    facultyId: 'fac_rajesh',
    facultyName: 'Dr. Rajesh Kumar',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    totalCredits: 4,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'subj_maths',
    name: 'Discrete Mathematics',
    code: 'CS504',
    facultyId: 'fac_meera',
    facultyName: 'Dr. Meera Nambiar',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    totalCredits: 3,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'subj_cn',
    name: 'Computer Networks',
    code: 'CS505',
    facultyId: 'fac_anita',
    facultyName: 'Prof. Anita Roy',
    department: 'Computer Science & Engineering',
    semester: 5,
    section: 'A',
    totalCredits: 3,
    createdAt: '2024-08-01T00:00:00Z',
  },
];

// Helper to generate realistic historical sessions & records for the demo
function generateSeedSessionsAndRecords(): { sessions: AttendanceSession[]; records: AttendanceRecord[] } {
  const sessions: AttendanceSession[] = [];
  const records: AttendanceRecord[] = [];

  // Generate 20 dates over the last 4 weeks (Mon - Fri)
  const dates: string[] = [];
  const now = new Date('2026-09-25T10:00:00Z');
  let dayOffset = 1;
  while (dates.length < 20) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Weekdays only
      dates.unshift(d.toISOString().split('T')[0]);
    }
    dayOffset++;
  }

  const studentIds = [
    'student_aarav',
    'student_priya',
    'student_rohan',
    'student_sneha',
    'student_ananya',
    'student_vikram',
  ];

  // Specific targets for Aarav Sharma:
  // DSA: 20 conducted, 18 attended (90% Safe) -> absent on index 4, 11
  // OS: 20 conducted, 15 attended (75% Safe) -> absent on index 2, 7, 13, 16, 19
  // DBMS: 18 conducted, 12 attended (66.7% Critical) -> absent on index 1, 5, 8, 12, 16, 17 (last 2 consecutive absences!)
  // Maths: 20 conducted, 17 attended (85% Safe) -> absent on index 3, 9, 14
  // CN: 19 conducted, 14 attended (73.7% Warning) -> absent on index 0, 4, 8, 13, 18

  const subjectConfigs = [
    {
      subjectId: 'subj_dsa',
      facultyId: 'fac_anita',
      period: 'Period 1 (09:00 - 10:00)',
      count: 20,
      aaravAbsentIndices: [4, 11],
    },
    {
      subjectId: 'subj_os',
      facultyId: 'fac_rajesh',
      period: 'Period 2 (10:15 - 11:15)',
      count: 20,
      aaravAbsentIndices: [2, 7, 13, 16, 19],
    },
    {
      subjectId: 'subj_dbms',
      facultyId: 'fac_rajesh',
      period: 'Period 3 (11:30 - 12:30)',
      count: 18,
      aaravAbsentIndices: [1, 5, 8, 12, 16, 17], // 6 absences -> 12 attended out of 18 = 66.7%
    },
    {
      subjectId: 'subj_maths',
      facultyId: 'fac_meera',
      period: 'Period 4 (01:30 - 02:30)',
      count: 20,
      aaravAbsentIndices: [3, 9, 14],
    },
    {
      subjectId: 'subj_cn',
      facultyId: 'fac_anita',
      period: 'Period 5 (02:45 - 03:45)',
      count: 19,
      aaravAbsentIndices: [0, 4, 8, 13, 18],
    },
  ];

  subjectConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      const date = dates[i % dates.length];
      const sessionId = `sess_${cfg.subjectId}_${date.replace(/-/g, '')}_${i}`;

      const session: AttendanceSession = {
        id: sessionId,
        subjectId: cfg.subjectId,
        facultyId: cfg.facultyId,
        date,
        period: cfg.period,
        section: 'A',
        createdAt: `${date}T09:00:00Z`,
      };
      sessions.push(session);

      studentIds.forEach((studentId) => {
        let status: 'present' | 'absent' | 'late' = 'present';

        if (studentId === 'student_aarav') {
          if (cfg.aaravAbsentIndices.includes(i)) {
            status = 'absent';
          }
        } else if (studentId === 'student_priya') {
          // Priya is safe ~90%
          if (i === 3 || i === 12) status = 'absent';
        } else if (studentId === 'student_rohan') {
          // Rohan is warning ~70%
          if (i % 3 === 0) status = 'absent';
        } else if (studentId === 'student_sneha') {
          // Sneha is high performer ~95%
          if (i === 7) status = 'late';
        } else if (studentId === 'student_ananya') {
          // Ananya warning ~70%
          if (i % 4 === 1 || i % 6 === 2) status = 'absent';
        } else if (studentId === 'student_vikram') {
          // Vikram critical in multiple subjects
          if (cfg.subjectId === 'subj_dbms' || cfg.subjectId === 'subj_cn') {
            if (i % 2 === 0) status = 'absent';
          } else {
            if (i % 3 === 1) status = 'absent';
          }
        }

        records.push({
          id: `rec_${sessionId}_${studentId}`,
          sessionId,
          studentId,
          status,
          timestamp: `${date}T10:00:00Z`,
        });
      });
    }
  });

  return { sessions, records };
}

// Global in-memory and localStorage repository with event dispatcher
class SmartAttendStorage {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this.notifyListeners();
        }
      });
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  public resetToFactorySeed() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    this.ensureInitialized(true);
    this.notifyListeners();
  }

  public ensureInitialized(force: boolean = false) {
    if (typeof window === 'undefined') return;

    if (force || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    } else {
      // Migrate any existing cached users from Aarav Sharma to Anas Ahmad
      const cachedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (cachedUsers && (cachedUsers.includes('Aarav') || cachedUsers.includes('aarav.sharma'))) {
        const updated = cachedUsers
          .replace(/Aarav Sharma/g, 'Anas Ahmad')
          .replace(/Aarav/g, 'Anas')
          .replace(/aarav\.sharma@smartattend\.edu/g, 'aanasahmad713@gmail.com')
          .replace(/aarav@smartattend\.edu/g, 'aanasahmad713@gmail.com');
        localStorage.setItem(STORAGE_KEYS.USERS, updated);
      }
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(SEED_DEPARTMENTS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(SEED_SUBJECTS));
    }
    if (force || !localStorage.getItem(STORAGE_KEYS.SESSIONS) || !localStorage.getItem(STORAGE_KEYS.RECORDS)) {
      const { sessions, records } = generateSeedSessionsAndRecords();
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID)) {
      // Default to Aarav Sharma for student demo
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, 'student_aarav');
    }
  }

  // Active User / Session
  public getActiveUserId(): string | null {
    if (typeof window === 'undefined') return 'student_aarav';
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || 'student_aarav';
  }

  public setActiveUserId(userId: string | null) {
    if (typeof window === 'undefined') return;
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
    }
    this.notifyListeners();
  }

  // Users
  public getUsers(): AppUser[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  public getUserById(id: string): AppUser | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  public getUserByEmail(email: string): AppUser | null {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public saveUser(user: AppUser): AppUser {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notifyListeners();
    return user;
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length !== users.length) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Subjects
  public getSubjects(): Subject[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      return data ? JSON.parse(data) : SEED_SUBJECTS;
    } catch {
      return SEED_SUBJECTS;
    }
  }

  public getSubjectById(id: string): Subject | null {
    const subjects = this.getSubjects();
    return subjects.find((s) => s.id === id) || null;
  }

  public saveSubject(subject: Subject): Subject {
    const subjects = this.getSubjects();
    const index = subjects.findIndex((s) => s.id === subject.id);
    if (index >= 0) {
      subjects[index] = subject;
    } else {
      subjects.push(subject);
    }
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.notifyListeners();
    return subject;
  }

  public deleteSubject(id: string): boolean {
    const subjects = this.getSubjects();
    const filtered = subjects.filter((s) => s.id !== id);
    if (filtered.length !== subjects.length) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(filtered));
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Departments
  public getDepartments(): Department[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      return data ? JSON.parse(data) : SEED_DEPARTMENTS;
    } catch {
      return SEED_DEPARTMENTS;
    }
  }

  public saveDepartment(dept: Department): Department {
    const depts = this.getDepartments();
    const index = depts.findIndex((d) => d.id === dept.id);
    if (index >= 0) {
      depts[index] = dept;
    } else {
      depts.push(dept);
    }
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
    this.notifyListeners();
    return dept;
  }

  public deleteDepartment(id: string): boolean {
    const depts = this.getDepartments();
    const filtered = depts.filter((d) => d.id !== id);
    if (filtered.length !== depts.length) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(filtered));
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Attendance Sessions
  public getSessions(): AttendanceSession[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public findExistingSession(
    subjectId: string,
    date: string,
    period: string,
    section: string
  ): AttendanceSession | null {
    const sessions = this.getSessions();
    return (
      sessions.find(
        (s) =>
          s.subjectId === subjectId &&
          s.date === date &&
          s.period === period &&
          s.section.toUpperCase() === section.toUpperCase()
      ) || null
    );
  }

  public createSession(session: AttendanceSession): AttendanceSession {
    const sessions = this.getSessions();
    sessions.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this.notifyListeners();
    return session;
  }

  // Attendance Records
  public getRecords(): AttendanceRecord[] {
    this.ensureInitialized();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getRecordsForStudent(studentId: string): AttendanceRecord[] {
    return this.getRecords().filter((r) => r.studentId === studentId);
  }

  public getRecordsForSession(sessionId: string): AttendanceRecord[] {
    return this.getRecords().filter((r) => r.sessionId === sessionId);
  }

  public saveRecordsBatch(newRecords: AttendanceRecord[]): void {
    const records = this.getRecords();
    const recordMap = new Map<string, AttendanceRecord>();
    records.forEach((r) => recordMap.set(r.id, r));
    newRecords.forEach((r) => recordMap.set(r.id, r));
    const merged = Array.from(recordMap.values());
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(merged));
    this.notifyListeners();
  }

  public updateRecordStatus(recordId: string, status: 'present' | 'absent' | 'late'): boolean {
    const records = this.getRecords();
    const target = records.find((r) => r.id === recordId);
    if (target) {
      target.status = status;
      target.timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public updateStudentStatusInSession(
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ): boolean {
    const records = this.getRecords();
    let target = records.find((r) => r.sessionId === sessionId && r.studentId === studentId);
    if (target) {
      target.status = status;
      target.timestamp = new Date().toISOString();
    } else {
      target = {
        id: `rec_${sessionId}_${studentId}`,
        sessionId,
        studentId,
        status,
        timestamp: new Date().toISOString(),
      };
      records.push(target);
    }
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    this.notifyListeners();
    return true;
  }
}

export const storage = new SmartAttendStorage();
