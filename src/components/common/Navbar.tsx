import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { storage } from '../../services/storage';
import { alertService } from '../../services/alertService';
import { attendanceService } from '../../services/attendanceService';
import { StudentProfileModal } from './StudentProfileModal';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Menu,
  User,
  LogOut,
  ChevronDown,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { StudentUser } from '../../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onToggleSidebar: () => void;
  onOpenPublicSite?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onToggleSidebar,
  onOpenPublicSite,
}) => {
  const { currentUser, role, logout, switchDemoUser, availableDemoUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentUser[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global student search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const allUsers = storage.getUsers();
    const students = allUsers.filter((u) => u.role === 'student') as StudentUser[];
    const q = searchQuery.toLowerCase().trim();

    const matches = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );

    setSearchResults(matches);
    setShowSearchDropdown(true);
  }, [searchQuery]);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live notifications
  let notifications: { id: string; title: string; message: string; type: string }[] = [];
  if (currentUser?.role === 'student') {
    const stats = attendanceService.getStudentAttendance(currentUser.id);
    if (stats) {
      notifications = alertService.generateStudentAlerts(stats);
    }
  } else if (currentUser?.role === 'faculty') {
    const facStats = attendanceService.getFacultyStats(currentUser.id);
    if (facStats.studentsAtRisk > 0) {
      notifications.push({
        id: 'fac_alert_1',
        title: 'Students at Risk',
        message: `⚠️ ${facStats.studentsAtRisk} student(s) currently require academic attendance intervention.`,
        type: 'warning',
      });
    }
  } else {
    notifications.push({
      id: 'admin_alert_1',
      title: 'Institutional Audit',
      message: 'Campus-wide attendance ledger updated with 100% sync compliance.',
      type: 'success',
    });
  }

  // Role top links
  const topNavLinks = role === 'student'
    ? [
        { label: 'Dashboard', path: '/student/dashboard' },
        { label: 'Simulator', path: '/student/simulator' },
        { label: 'Calendar', path: '/student/calendar' },
        { label: 'History', path: '/student/history' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/reports' },
      ]
    : role === 'faculty'
    ? [
        { label: 'Dashboard', path: '/faculty/dashboard' },
        { label: 'Mark Attendance', path: '/faculty/attendance' },
        { label: 'Students', path: '/faculty/students' },
        { label: 'Risk Center', path: '/risk-center' },
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/reports' },
      ]
    : [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Risk Center', path: '/risk-center' },
        { label: 'Students', path: '/admin/students' },
        { label: 'Faculty', path: '/admin/faculty' },
        { label: 'Subjects', path: '/admin/subjects' },
        { label: 'Departments', path: '/admin/departments' },
        { label: 'Analytics', path: '/analytics' },
      ];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              S
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                SmartAttend
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold tracking-wider uppercase hidden sm:inline">
                SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Top Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-semibold">
          {topNavLinks.slice(0, 5).map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`transition-colors py-1 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Student Search Bar */}
          <div ref={searchRef} className="relative hidden sm:block w-48 md:w-56">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Students ({searchResults.length})
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No student found.</div>
                  ) : (
                    searchResults.map((student) => {
                      const stats = attendanceService.getStudentAttendance(student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {student.rollNumber}
                            </span>
                          </div>
                          {stats && (
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                              {stats.percentage.toFixed(1)}%
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Icon & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications ({notifications.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Live Engine</span>
                </div>
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No active alerts.</div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-xs"
                      >
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">{item.title}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Switcher Dropdown */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block max-w-[120px]">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate leading-tight">
                  {currentUser?.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block capitalize truncate font-medium">
                  {currentUser?.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Fast Demo Role Switcher
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Instantly swap roles to test live sync:
                  </p>
                </div>

                <div className="space-y-1">
                  {availableDemoUsers.map((user) => {
                    const isSelected = user.id === currentUser?.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          switchDemoUser(user.id);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {user.role}
                            </span>
                            <span>{user.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            {user.email}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    );
                  })}
                </div>

                {onOpenPublicSite && (
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenPublicSite();
                      }}
                      className="w-full p-2 rounded-xl text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      View Public Landing Page
                    </button>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full p-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Student Profile Modal */}
      <StudentProfileModal
        studentId={selectedStudentId}
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />
    </>
  );
};
