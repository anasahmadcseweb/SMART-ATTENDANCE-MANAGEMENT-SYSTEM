import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { QRAttendanceModal } from './components/attendance/QRAttendanceModal';
import { StudentProfileModal } from './components/common/StudentProfileModal';
import { Modal } from './components/common/Modal';
import { alertService } from './services/alertService';
import { attendanceService } from './services/attendanceService';
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentSimulatorPage } from './pages/student/StudentSimulatorPage';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';
import { StudentCalendarPage } from './pages/student/StudentCalendarPage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyAttendancePage } from './pages/faculty/FacultyAttendancePage';
import { FacultyStudentsPage } from './pages/faculty/FacultyStudentsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';

// Shared Pages
import { RiskCenterPage } from './pages/shared/RiskCenterPage';
import { AnalyticsPage } from './pages/shared/AnalyticsPage';
import { ReportsPage } from './pages/shared/ReportsPage';
import { SettingsPage } from './pages/shared/SettingsPage';

function AppContent() {
  const { currentUser, role, loading } = useAuth();
  const { showToast } = useToast();

  const [currentPath, setCurrentPath] = useState<string>('');
  const [unauthView, setUnauthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [showPublicSite, setShowPublicSite] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Interactive Modals
  const [isQROpen, setIsQROpen] = useState<boolean>(false);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Synchronize route with role defaults
  useEffect(() => {
    if (!currentUser || !role) {
      return;
    }

    setShowPublicSite(false);

    // Role-based root redirect
    if (!currentPath || currentPath === '/login' || currentPath === '/') {
      if (role === 'student') setCurrentPath('/student/dashboard');
      else if (role === 'faculty') setCurrentPath('/faculty/dashboard');
      else if (role === 'admin') setCurrentPath('/admin/dashboard');
      return;
    }

    // Role Protection
    if (role === 'student') {
      if (currentPath.startsWith('/faculty') || currentPath.startsWith('/admin') || currentPath === '/risk-center') {
        showToast('Unauthorized portal area. Redirecting to student dashboard.', 'warning');
        setCurrentPath('/student/dashboard');
      }
    } else if (role === 'faculty') {
      if (currentPath.startsWith('/admin')) {
        showToast('Administrative privileges required. Redirecting to faculty dashboard.', 'warning');
        setCurrentPath('/faculty/dashboard');
      }
    }
  }, [currentUser, role, currentPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner message="Connecting to SmartAttend Real-time Engine..." size="lg" />
      </div>
    );
  }

  // Public Landing Page view for authenticated user (if requested via dropdown)
  if (currentUser && showPublicSite) {
    return (
      <LandingPage
        onEnterApp={() => setShowPublicSite(false)}
        onOpenLogin={() => setShowPublicSite(false)}
      />
    );
  }

  // Unauthenticated Flow
  if (!currentUser) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onEnterApp={() => {
            // Default demo student launch
          }}
          onOpenLogin={() => setUnauthView('login')}
        />
      );
    }
    if (unauthView === 'register') {
      return <RegisterPage onLoginClick={() => setUnauthView('login')} />;
    }
    return (
      <LoginPage
        onRegisterClick={() => setUnauthView('register')}
        onBackToLanding={() => setUnauthView('landing')}
      />
    );
  }

  // Safe navigation handler
  const handleNavigate = (path: string) => {
    if (role === 'student' && (path.startsWith('/faculty') || path.startsWith('/admin') || path === '/risk-center')) {
      showToast('Action restricted to Faculty and Administration.', 'warning');
      return;
    }
    if (role === 'faculty' && path.startsWith('/admin')) {
      showToast('Action restricted to Campus Administrators.', 'warning');
      return;
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute live notifications for the Notifications Modal
  const getLiveNotifications = () => {
    if (role === 'student' && currentUser) {
      const stats = attendanceService.getStudentAttendance(currentUser.id);
      if (stats) return alertService.generateStudentAlerts(stats);
      return [];
    }
    if (role === 'faculty' && currentUser) {
      const facStats = attendanceService.getFacultyStats(currentUser.id);
      const items = [];
      if (facStats.studentsAtRisk > 0) {
        items.push({
          id: 'fac_alert_1',
          title: 'Students at Risk Detected',
          message: `${facStats.studentsAtRisk} student(s) currently need attendance recovery to hit 75%.`,
          type: 'warning' as const,
        });
      }
      items.push({
        id: 'fac_alert_2',
        title: 'Session Register Complete',
        message: 'CS501 (Data Structures) Section A attendance synced successfully.',
        type: 'success' as const,
      });
      return items;
    }
    return [
      {
        id: 'admin_alert_1',
        title: 'Institutional Audit Ledger',
        message: 'Campus-wide attendance ledger verified with 100% compliance across 4 departments.',
        type: 'success' as const,
      },
      {
        id: 'admin_alert_2',
        title: 'Accreditation Warning',
        message: 'CSE 5th Semester Section A has 2 students under 65% critical threshold.',
        type: 'warning' as const,
      },
    ];
  };

  const notifications = getLiveNotifications();

  // Render appropriate view based on currentPath
  const renderCurrentView = () => {
    switch (currentPath) {
      // Student Routes
      case '/student/dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case '/student/simulator':
        return <StudentSimulatorPage />;
      case '/student/history':
        return <StudentHistoryPage />;
      case '/student/calendar':
        return <StudentCalendarPage />;

      // Faculty Routes
      case '/faculty/dashboard':
        return (
          <FacultyDashboard
            onNavigate={handleNavigate}
            onOpenQR={() => setIsQROpen(true)}
          />
        );
      case '/faculty/attendance':
        return <FacultyAttendancePage />;
      case '/faculty/students':
        return <FacultyStudentsPage />;

      // Admin Routes
      case '/admin/dashboard':
        return (
          <AdminDashboard
            onNavigate={handleNavigate}
            onOpenQR={() => setIsQROpen(true)}
          />
        );
      case '/admin/students':
        return <AdminStudentsPage />;
      case '/admin/faculty':
        return <AdminFacultyPage />;
      case '/admin/subjects':
        return <AdminSubjectsPage />;
      case '/admin/departments':
        return <AdminDepartmentsPage />;

      // Shared Routes
      case '/risk-center':
        return <RiskCenterPage />;
      case '/analytics':
        return <AnalyticsPage />;
      case '/reports':
        return <ReportsPage />;
      case '/settings':
        return <SettingsPage />;

      default:
        if (role === 'student') return <StudentDashboard onNavigate={handleNavigate} />;
        if (role === 'faculty') (
          <FacultyDashboard
            onNavigate={handleNavigate}
            onOpenQR={() => setIsQROpen(true)}
          />
        );
        return (
          <AdminDashboard
            onNavigate={handleNavigate}
            onOpenQR={() => setIsQROpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* SaaS Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQR={() => setIsQROpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenStudentProfile={() => {
          if (role === 'student' && currentUser) {
            setSelectedStudentProfileId(currentUser.id);
          } else {
            setSelectedStudentProfileId('student_aarav');
          }
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenPublicSite={() => setShowPublicSite(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Dynamic QR Code Attendance Modal */}
      <QRAttendanceModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
      />

      {/* Student Profile Quick Modal */}
      <StudentProfileModal
        studentId={selectedStudentProfileId}
        isOpen={Boolean(selectedStudentProfileId)}
        onClose={() => setSelectedStudentProfileId(null)}
      />

      {/* Interactive Notifications Modal */}
      <Modal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Notifications & Smart Alerts"
        subtitle="Real-time academic alerts generated by the attendance risk engine"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Alerts ({notifications.length})
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'risk' || item.type === 'consecutive_absence' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : item.type === 'warning' || item.type === 'recovery' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={() => {
                setIsNotificationsOpen(false);
                handleNavigate(role === 'student' ? '/student/simulator' : '/risk-center');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Take Action in Risk Center <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
