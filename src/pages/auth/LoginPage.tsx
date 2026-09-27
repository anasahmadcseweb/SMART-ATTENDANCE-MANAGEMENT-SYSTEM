import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface LoginPageProps {
  onRegisterClick: () => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick, onBackToLanding }) => {
  const { login, resetPassword, switchDemoUser } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your institutional email address.', 'error');
      return;
    }

    setLoading(true);
    const result = await login(email.trim());
    setLoading(false);

    if (result.success) {
      showToast('Welcome back to SmartAttend.', 'success');
    } else {
      showToast(result.message || 'Login failed.', 'error');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please enter your email.', 'error');
      return;
    }
    const result = await resetPassword(forgotEmail.trim());
    setIsForgotOpen(false);
    showToast(result.message || 'Password reset link sent.', 'info');
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${key} to clipboard.`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunchRole = async (userId: string, roleName: string) => {
    switchDemoUser(userId);
    showToast(`Logged in as ${roleName}.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-subtle-grid">
      {/* Top Bar with Back to Landing */}
      <div className="max-w-5xl mx-auto w-full mb-6 flex items-center justify-between">
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Overview</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
            S
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
            SmartAttend
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Login Form (6 cols) */}
        <div className="lg:col-span-6 saas-card p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-xl border border-slate-200/90 dark:border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Portal Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your institutional credentials to access your portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. aanasahmad713@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an institutional account yet?{' '}
            <button
              onClick={onRegisterClick}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Right: Demo Credentials Card (Inspired by reference screenshot) (6 cols) */}
        <div className="lg:col-span-6 saas-card p-6 sm:p-7 shadow-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Demo Credentials
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live verified
            </div>
          </div>

          <div className="space-y-3">
            {/* Student */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Student (Anas Ahmad)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                  aanasahmad713@gmail.com
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block">
                  DBMS at 66.7% (Requires 6 classes)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchRole('student_aarav', 'Anas Ahmad (Student)')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                Launch →
              </button>
            </div>

            {/* Faculty */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Faculty (Dr. Rajesh Kumar)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                  rajesh.kumar@smartattend.edu
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Assigned DBMS & OS lectures
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchRole('fac_rajesh', 'Dr. Rajesh Kumar (Faculty)')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                Launch →
              </button>
            </div>

            {/* Admin */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Admin (Dr. Sarah Jenkins)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block mt-0.5">
                  sarah.jenkins@smartattend.edu
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Department Chair & Compliance
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchRole('admin_sarah', 'Dr. Sarah Jenkins (Admin)')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                Launch →
              </button>
            </div>

            {/* Password */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Password:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  password123
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('password123', 'Password')}
                  className="p-1 text-slate-400 hover:text-slate-600"
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

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            Clicking any role button automatically logs in and navigates to that persona's verified dashboard.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title="Reset Password"
        subtitle="We will send a password reset verification link to your email"
        maxWidth="sm"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. aanasahmad713@gmail.com"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
