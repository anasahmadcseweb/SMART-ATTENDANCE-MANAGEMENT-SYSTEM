import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Calculator,
  CalendarDays,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenLogin }) => {
  const { switchDemoUser, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${key} to clipboard.`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchRole = async (userId: string, roleName: string) => {
    switchDemoUser(userId);
    showToast(`Logged in as ${roleName}. Welcome to SmartAttend!`, 'success');
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden bg-subtle-grid">
      {/* Ambient background light gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-teal-100/40 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Translucent Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                SmartAttend
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold tracking-wider uppercase ml-1.5 hidden sm:inline">
                Intelligence Platform
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#risk-engine" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Risk Engine
            </a>
            <a href="#simulator" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Simulator
            </a>
            <a href="#reports" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Verified Reports
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenLogin}
              className="hidden sm:inline-flex px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Portal Sign In
            </button>

            <button
              onClick={() => handleLaunchRole('student_aarav', 'Anas Ahmad (Student)')}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Live demo</span>
              <span className="text-xs">↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Call To Action (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Early Access Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Smart attendance for modern institutions</span>
            </div>

            {/* Main Headline with Highlight Words */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Attendance software your{' '}
              <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-200 dark:decoration-blue-800 decoration-4 underline-offset-4">
                dean
              </span>{' '}
              and{' '}
              <span className="text-teal-600 dark:text-teal-400 underline decoration-teal-200 dark:decoration-teal-800 decoration-4 underline-offset-4">
                students
              </span>{' '}
              will actually open.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
              SmartAttend replaces static registers with a real-time intelligence layer. Dynamic recovery formulas,
              predictive absence simulation, temporal calendar matrices, and automated dean-level reports.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleLaunchRole('student_aarav', 'Anas Ahmad (Student)')}
                className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md flex items-center gap-2"
              >
                <span>Try the live demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenLogin}
                className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors shadow-2xs"
              >
                Institution Login
              </button>
            </div>

            {/* Trust highlights */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Single Source of Truth
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 75% Dynamic Recovery Formula
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant Role Switching
              </span>
            </div>
          </div>

          {/* Right Column: Demo Credentials Card (Inspired by reference screenshot) (5 cols) */}
          <div className="lg:col-span-5">
            <div className="saas-card p-6 shadow-xl border border-slate-200/90 dark:border-slate-800 relative bg-white dark:bg-slate-900">
              {/* Card Top Pill */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Demo Credentials
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live • Real database
                </div>
              </div>

              {/* Credentials Fields */}
              <div className="space-y-3.5">
                {/* 1. Student Access */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Student Persona
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      aanasahmad713@gmail.com
                    </span>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block">
                      DBMS at 66.7% (Needs 6 classes)
                    </span>
                  </div>

                  <button
                    onClick={() => handleLaunchRole('student_aarav', 'Anas Ahmad (Student)')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    Launch →
                  </button>
                </div>

                {/* 2. Faculty Access */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Faculty Persona
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      rajesh.kumar@smartattend.edu
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                      Dr. Rajesh Kumar (DBMS & OS)
                    </span>
                  </div>

                  <button
                    onClick={() => handleLaunchRole('fac_rajesh', 'Dr. Rajesh Kumar (Faculty)')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    Launch →
                  </button>
                </div>

                {/* 3. Admin Access */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Admin Persona
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      sarah.jenkins@smartattend.edu
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                      Dr. Sarah Jenkins (Department Chair)
                    </span>
                  </div>

                  <button
                    onClick={() => handleLaunchRole('admin_sarah', 'Dr. Sarah Jenkins (Admin)')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    Launch →
                  </button>
                </div>

                {/* 4. Password Row */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Demo Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      demo-access-2026
                    </span>
                    <button
                      onClick={() => copyToClipboard('demo-access-2026', 'Password')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedKey === 'Password' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                Tap any role to launch into the live student or faculty workspace. Changes made by faculty propagate
                immediately to student dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <section id="features" className="mt-24 pt-12 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              The Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              RECORD → ANALYZE → PREDICT → RECOMMEND → ACT
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Every attendance session logged in SmartAttend instantly runs through an automated risk engine to protect students before shortages become exam disqualifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="saas-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Live Attendance Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Faculty roll-call updates student records instantaneously without manual re-calculation or delays.
              </p>
            </div>

            <div className="saas-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Smart Risk Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dynamically solves for exact consecutive classes needed to return above the mandated 75% threshold.
              </p>
            </div>

            <div className="saas-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Attendance Simulator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Students can model future absence penalties and compute safety buffers before missing upcoming lectures.
              </p>
            </div>

            <div className="saas-card p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Verified Reports & PDFs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                One-click real CSV downloads and client-side generated PDF reports with verified institutional timestamps.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800/80 py-8 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">SmartAttend</span>
            <span>—</span>
            <span>Attendance. Insights. Action.</span>
          </div>
          <div>
            <span>Commercial-grade University SaaS • Full Firestore Persistence</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
