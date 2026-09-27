import { AttendanceRecord, AttendanceStatus, RiskLevel } from '../types';

export const TARGET_ATTENDANCE_PERCENT = 75;
export const WARNING_ATTENDANCE_PERCENT = 65;

/**
 * Calculates attendance percentage safely.
 * Default behavior:
 * present = attended
 * late = attended
 * absent = not attended
 */
export function calculateAttendance(
  attended: number,
  conducted: number
): number {
  if (!conducted || conducted <= 0) return 0;
  if (attended <= 0) return 0;
  if (attended >= conducted) return 100;
  const pct = (attended / conducted) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determines risk category based on attendance percentage:
 * SAFE: >= 75%
 * WARNING: >= 65% and < 75%
 * CRITICAL: < 65%
 */
export function calculateRisk(percentage: number): RiskLevel {
  if (percentage >= TARGET_ATTENDANCE_PERCENT) return 'safe';
  if (percentage >= WARNING_ATTENDANCE_PERCENT) return 'warning';
  return 'critical';
}

/**
 * Dynamic Recovery Requirement:
 * Formula: (attended + x) / (conducted + x) >= (target / 100)
 * x * (1 - T) >= T * conducted - attended
 * x = ceil((T * conducted - attended) / (1 - T))
 * 
 * Returns the exact integer number of consecutive classes the student must attend.
 * Returns 0 if already >= target or no classes conducted.
 */
export function calculateRequiredClasses(
  attended: number,
  conducted: number,
  target: number = TARGET_ATTENDANCE_PERCENT
): number {
  if (conducted <= 0) return 0;
  const currentPct = (attended / conducted) * 100;
  if (currentPct >= target) return 0;

  const T = target / 100;
  if (T >= 1) {
    // 100% target is impossible if any class was missed
    return conducted === attended ? 0 : 999;
  }

  const numerator = T * conducted - attended;
  const denominator = 1 - T;
  const rawX = numerator / denominator;
  const required = Math.ceil(rawX);

  if (isNaN(required) || !isFinite(required) || required < 0) {
    return 0;
  }
  return required;
}

/**
 * Dynamic Buffer / Maximum Misses:
 * How many consecutive upcoming classes can be missed before falling below target?
 * Formula: attended / (conducted + m) >= T
 * conducted + m <= attended / T
 * m = floor(attended / T - conducted)
 */
export function calculateMaximumMisses(
  attended: number,
  conducted: number,
  target: number = TARGET_ATTENDANCE_PERCENT
): number {
  if (conducted <= 0) return 0;
  const currentPct = (attended / conducted) * 100;
  if (currentPct < target) return 0;

  const T = target / 100;
  if (T <= 0) return 999;

  const rawM = Math.floor(attended / T - conducted);
  if (isNaN(rawM) || !isFinite(rawM) || rawM < 0) {
    return 0;
  }
  return rawM;
}

/**
 * Projected Attendance Simulator:
 * Formula: (attended + expectedAttended) / (conducted + upcomingClasses) * 100
 */
export function calculateProjectedAttendance(
  attended: number,
  conducted: number,
  upcomingClasses: number,
  expectedAttended: number
): number {
  const safeUpcoming = Math.max(0, upcomingClasses);
  const safeExpected = Math.min(safeUpcoming, Math.max(0, expectedAttended));
  const newConducted = conducted + safeUpcoming;
  const newAttended = attended + safeExpected;

  if (newConducted <= 0) return 0;
  const projected = (newAttended / newConducted) * 100;
  return Math.min(100, Math.max(0, Math.round(projected * 10) / 10));
}

/**
 * "What if I miss the next class?"
 * Formula: attended / (conducted + 1) * 100
 */
export function calculateWhatIfMissNext(
  attended: number,
  conducted: number
): number {
  const newConducted = conducted + 1;
  const pct = (attended / newConducted) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Count consecutive absences from the most recent records
 */
export function calculateConsecutiveAbsences(
  records: Array<{ status: AttendanceStatus; date?: string; timestamp?: string }>
): number {
  if (!records || records.length === 0) return 0;

  // Assuming records are ordered chronologically, we inspect from most recent backwards
  let count = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].status === 'absent') {
      count++;
    } else {
      break;
    }
  }
  return count;
}
