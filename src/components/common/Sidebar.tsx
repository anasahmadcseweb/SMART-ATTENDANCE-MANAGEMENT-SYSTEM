import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  BookOpen,
  LineChart,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  LogOut,
  Users,
  GraduationCap,
  History,
  X,
  QrCode,
  Bell,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenQR?: () => void;
  onOpenNotifications?: () => void;
  onOpenStudentProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenQR,
  onOpenNotifications,
  onOpenStudentProfile,
}) => {
  const { currentUser, role, logout } = useAuth();

  // Accordion open states
  const [isAttendanceOpen, setIsAttendanceOpen] = useState<boolean>(true);
  const [isStudentsOpen, setIsStudentsOpen] = useState<boolean>(true);

  const getDashboardPath = () => {
    if (role === 'student') return '/student/dashboard';
    if (role === 'faculty') return '/faculty/dashboard';
    return '/admin/dashboard';
  };

  const dashboardPath = getDashboardPath();

  const handleNavClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Lightweight, Airy SaaS Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                S
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block">
                  SmartAttend
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold uppercase tracking-wider block">
                  University SaaS
                </span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Card */}
          <div className="p-3 mx-4 my-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="truncate flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize block truncate">
                  {currentUser?.role} • {currentUser?.department ? currentUser.department.split(' ')[0] : 'Campus'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Structure */}
          <nav className="px-3 space-y-1 pb-4">
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>

            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick(dashboardPath)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentPath === dashboardPath
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentPath === dashboardPath ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            {/* 2. Attendance (Accordion) */}
            <div className="space-y-0.5">
              <button
                onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Attendance</span>
                </div>
                {isAttendanceOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isAttendanceOpen && (
                <div className="pl-7 pr-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-1">
                  {/* Take Attendance */}
                  <button
                    onClick={() => {
                      if (role === 'student') {
                        onNavigate('/student/dashboard');
                      } else {
                        handleNavClick('/faculty/attendance');
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentPath === '/faculty/attendance'
                        ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Take Attendance</span>
                  </button>

                  {/* QR Attendance */}
                  <button
                    onClick={() => {
                      if (onOpenQR) {
                        onOpenQR();
                        onCloseMobile();
                      } else {
                        handleNavClick('/faculty/attendance');
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="flex items-center gap-1.5">
                      QR Attendance
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                        Live
                      </span>
                    </span>
                  </button>

                  {/* Attendance History */}
                  <button
                    onClick={() => handleNavClick(role === 'student' ? '/student/history' : '/reports')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentPath === '/student/history'
                        ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Attendance History</span>
                  </button>

                  {/* Attendance Calendar */}
                  <button
                    onClick={() => handleNavClick('/student/calendar')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentPath === '/student/calendar'
                        ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/70 dark:bg-blue-950/40'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Attendance Calendar</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Students (Accordion) */}
            <div className="space-y-0.5">
              <button
                onClick={() => setIsStudentsOpen(!isStudentsOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Students</span>
                </div>
                {isStudentsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isStudentsOpen && (
                <div className="pl-7 pr-1 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4 py-1">
                  {/* All Students */}
                  <button
                    onClick={() => {
                      if (role === 'admin') handleNavClick('/admin/students');
                      else handleNavClick('/faculty/students');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentPath === '/admin/students' || currentPath === '/faculty/students'
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>All Students</span>
                  </button>

                  {/* Student Profile */}
                  <button
                    onClick={() => {
                      if (onOpenStudentProfile) {
                        onOpenStudentProfile();
                        onCloseMobile();
                      } else {
                        handleNavClick('/faculty/students');
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Student Profile</span>
                  </button>

                  {/* Low Attendance */}
                  <button
                    onClick={() => handleNavClick('/risk-center')}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentPath === '/risk-center'
                        ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50/70 dark:bg-rose-950/40'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="flex items-center gap-1.5">
                      Low Attendance
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-mono font-bold">
                        Alerts
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Classes */}
            <button
              onClick={() => handleNavClick('/admin/subjects')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentPath === '/admin/subjects'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Classes</span>
            </button>

            {/* 5. Faculty */}
            <button
              onClick={() => handleNavClick('/admin/faculty')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentPath === '/admin/faculty'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Faculty</span>
            </button>

            {/* 6. Analytics */}
            <button
              onClick={() => handleNavClick('/analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentPath === '/analytics'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <LineChart className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Analytics</span>
            </button>

            {/* 7. Reports */}
            <button
              onClick={() => handleNavClick('/reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentPath === '/reports'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Reports</span>
            </button>

            {/* 8. Notifications */}
            <button
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                  onCloseMobile();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Notifications</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1 shrink-0">
          <button
            onClick={() => handleNavClick('/settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentPath === '/settings'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              logout();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="pt-2 px-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Persistent DB</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
