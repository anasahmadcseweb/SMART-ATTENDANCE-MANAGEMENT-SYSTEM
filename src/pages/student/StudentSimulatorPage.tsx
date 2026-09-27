import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { storage } from '../../services/storage';
import { OverallStudentAttendance, SubjectAttendanceStat } from '../../types';
import {
  calculateAttendance,
  calculateMaximumMisses,
  calculateProjectedAttendance,
  calculateRequiredClasses,
  calculateRisk,
  calculateWhatIfMissNext,
} from '../../utils/attendanceCalculations';
import { formatPercent } from '../../utils/formatters';
import { RiskBadge } from '../../components/common/RiskBadge';
import { AttendanceProgressBar } from '../../components/common/AttendanceProgressBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';

export const StudentSimulatorPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<OverallStudentAttendance | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [upcomingClasses, setUpcomingClasses] = useState<number>(10);
  const [expectedAttended, setExpectedAttended] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = () => {
      if (currentUser?.id) {
        const studentStats = attendanceService.getStudentAttendance(currentUser.id);
        if (studentStats) {
          setStats(studentStats);
          if (!selectedSubjectId && studentStats.subjectStats.length > 0) {
            const crit = studentStats.subjectStats.find((s) => s.percentage < 75);
            setSelectedSubjectId(crit ? crit.subjectId : studentStats.subjectStats[0].subjectId);
          }
        }
      }
      setLoading(false);
    };

    loadData();
    const unsubscribe = storage.subscribe(() => loadData());
    return () => unsubscribe();
  }, [currentUser]);

  if (loading || !stats) {
    return <LoadingSpinner message="Configuring attendance simulation model..." />;
  }

  const selectedSubject: SubjectAttendanceStat | undefined =
    stats.subjectStats.find((s) => s.subjectId === selectedSubjectId) || stats.subjectStats[0];

  if (!selectedSubject) {
    return (
      <div className="saas-card p-12 text-center text-slate-500">
        No enrolled subjects registered for simulation.
      </div>
    );
  }

  const currentAttended = selectedSubject.attended;
  const currentConducted = selectedSubject.conducted;
  const currentPercentage = selectedSubject.percentage;

  const safeUpcoming = Math.max(0, upcomingClasses);
  const safeExpected = Math.min(safeUpcoming, Math.max(0, expectedAttended));

  // Dynamic calculations
  const projectedPercentage = calculateProjectedAttendance(
    currentAttended,
    currentConducted,
    safeUpcoming,
    safeExpected
  );
  const projectedRisk = calculateRisk(projectedPercentage);

  // Scenario 1: If attend every upcoming class
  const attendAllProjected = calculateProjectedAttendance(
    currentAttended,
    currentConducted,
    safeUpcoming,
    safeUpcoming
  );

  // Scenario 2: What if I miss the next class?
  const missNextPercentage = calculateWhatIfMissNext(currentAttended, currentConducted);

  // Scenario 3: Maximum classes you can miss
  const maxMisses = calculateMaximumMisses(currentAttended, currentConducted, 75);

  // Recovery required
  const requiredRecovery = calculateRequiredClasses(currentAttended, currentConducted, 75);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Subtitle */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
          <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Interactive Planning Tool</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Attendance Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          See how your attendance could change based on your upcoming classes.
        </p>
      </div>

      {/* Subject Ribbon Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {stats.subjectStats.map((subj) => {
          const isSelected = subj.subjectId === selectedSubject.subjectId;
          return (
            <button
              key={subj.subjectId}
              onClick={() => {
                setSelectedSubjectId(subj.subjectId);
                setUpcomingClasses(10);
                setExpectedAttended(8);
              }}
              className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold shrink-0 transition-all flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'saas-card text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {subj.subjectCode}
              </span>
              <span>{subj.subjectName}</span>
              <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {subj.percentage.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subject Info & Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Current Status Card */}
          <div className="saas-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60">
                  {selectedSubject.subjectCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedSubject.subjectName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Faculty Instructor: {selectedSubject.facultyName}
                </p>
              </div>
              <RiskBadge risk={selectedSubject.risk} size="md" />
            </div>

            {/* Current Metrics Trio */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  Current Standing
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {formatPercent(currentPercentage)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  Attended
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  {currentAttended}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  Conducted
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {currentConducted}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Current Progress to 75% Requirement</span>
                <span className="font-mono font-semibold">{currentPercentage.toFixed(1)}%</span>
              </div>
              <AttendanceProgressBar percentage={currentPercentage} size="md" />
            </div>
          </div>

          {/* Interactive Inputs */}
          <div className="saas-card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Scenario Controls
              </h3>
              <button
                onClick={() => {
                  setUpcomingClasses(10);
                  setExpectedAttended(8);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Input 1: Upcoming Classes */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <label className="text-slate-800 dark:text-slate-200">
                  Upcoming Classes to simulate
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {upcomingClasses} classes
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={upcomingClasses}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setUpcomingClasses(val);
                    if (expectedAttended > val) setExpectedAttended(val);
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={upcomingClasses}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setUpcomingClasses(val);
                    if (expectedAttended > val) setExpectedAttended(val);
                  }}
                  className="w-20 px-3 py-1.5 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Input 2: Expected Classes Attended */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <label className="text-slate-800 dark:text-slate-200">
                  Expected Classes Attended
                </label>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {expectedAttended} of {upcomingClasses}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max={upcomingClasses}
                  value={expectedAttended}
                  onChange={(e) => setExpectedAttended(parseInt(e.target.value) || 0)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <input
                  type="number"
                  min="0"
                  max={upcomingClasses}
                  value={expectedAttended}
                  onChange={(e) => setExpectedAttended(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-1.5 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Preset shortcuts */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setUpcomingClasses(5);
                  setExpectedAttended(5);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Next 5 (100% Attended)
              </button>
              <button
                onClick={() => {
                  setUpcomingClasses(10);
                  setExpectedAttended(8);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Next 10 (80% Attended)
              </button>
              {requiredRecovery > 0 && (
                <button
                  onClick={() => {
                    setUpcomingClasses(requiredRecovery);
                    setExpectedAttended(requiredRecovery);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-xs font-bold text-blue-700 dark:text-blue-300"
                >
                  Exact 75% Recovery ({requiredRecovery} classes)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Large Result & What-If Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Large Result Box */}
          <div className="saas-card p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-300 font-bold">
                Projected Attendance
              </span>
              <RiskBadge risk={projectedRisk} size="md" />
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black font-mono tracking-tight text-white">
                {projectedPercentage.toFixed(1)}%
              </span>
              <div className="text-xs text-slate-300">
                {projectedPercentage > currentPercentage ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{(projectedPercentage - currentPercentage).toFixed(1)}% gain
                  </span>
                ) : projectedPercentage < currentPercentage ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {(projectedPercentage - currentPercentage).toFixed(1)}% drop
                  </span>
                ) : (
                  <span>No change</span>
                )}
              </div>
            </div>

            {/* Dynamic Result Summary */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Classes Projected:</span>
                <span className="font-mono font-bold text-white">{currentConducted + safeUpcoming}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Attended Projected:</span>
                <span className="font-mono font-bold text-white">{currentAttended + safeExpected}</span>
              </div>
            </div>

            {projectedPercentage >= 75 ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-start gap-2 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Safe Standing:</strong> You will meet the 75% institutional requirement under this plan.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">Shortage Continues:</strong> Attendance remains below 75%. Increase your planned classes attended.
                </span>
              </div>
            )}
          </div>

          {/* Card 1: If you attend every upcoming class */}
          <div className="saas-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              If you attend every upcoming class
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {attendAllProjected.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">({currentAttended + safeUpcoming} / {currentConducted + safeUpcoming})</span>
            </div>
          </div>

          {/* Card 2: If you miss the next class */}
          <div className="saas-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              If you miss the next class
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {missNextPercentage.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-rose-500">
                -{(currentPercentage - missNextPercentage).toFixed(1)}% drop
              </span>
            </div>
          </div>

          {/* Card 3: Maximum classes you can miss */}
          <div className="saas-card p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Maximum classes you can miss
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {maxMisses} classes
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {maxMisses > 0 ? 'Buffer before falling below 75%' : 'Zero margin for absence'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
