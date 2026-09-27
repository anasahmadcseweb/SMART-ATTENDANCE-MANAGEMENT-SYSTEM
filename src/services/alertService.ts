import { OverallStudentAttendance, SmartAlert } from '../types';

export const alertService = {
  /**
   * Generates deterministic smart alerts from a student's calculated attendance
   */
  generateStudentAlerts(stats: OverallStudentAttendance): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const dateKey = new Date().toISOString().split('T')[0];

    // 1. Overall subject attention alert
    if (stats.subjectsAtRiskCount > 0) {
      alerts.push({
        id: `alert_overall_${stats.studentId}_${stats.subjectsAtRiskCount}_${dateKey}`,
        type: 'overall',
        title: 'Academic Attendance Alert',
        message: `🔴 ${stats.subjectsAtRiskCount} ${
          stats.subjectsAtRiskCount === 1 ? 'subject currently requires' : 'subjects currently require'
        } attention to maintain eligibility.`,
        severity: 'danger',
        timestamp: new Date().toISOString(),
        studentId: stats.studentId,
      });
    }

    // 2. Per-subject risk & recovery & consecutive absences
    stats.subjectStats.forEach((subject) => {
      // Critical / Below 75%
      if (subject.percentage < 75 && subject.conducted > 0) {
        alerts.push({
          id: `alert_risk_${stats.studentId}_${subject.subjectId}_${Math.floor(subject.percentage)}`,
          type: 'risk',
          title: 'Subject Below Threshold',
          message: `🔴 ${subject.subjectName} (${subject.subjectCode}) attendance has fallen to ${subject.percentage.toFixed(1)}% (below 75%). Attend next ${subject.requiredClasses} consecutive classes to recover.`,
          severity: subject.percentage < 65 ? 'danger' : 'warning',
          timestamp: new Date().toISOString(),
          subjectId: subject.subjectId,
          studentId: stats.studentId,
        });
      }

      // Safe / Recovery celebrated
      if (subject.percentage >= 75 && subject.conducted >= 10 && subject.percentage <= 80) {
        alerts.push({
          id: `alert_recovery_${stats.studentId}_${subject.subjectId}_safe`,
          type: 'recovery',
          title: 'Attendance Safe Zone',
          message: `🟢 You are maintaining safe attendance in ${subject.subjectName} (${subject.percentage.toFixed(1)}%). Keep it up!`,
          severity: 'success',
          timestamp: new Date().toISOString(),
          subjectId: subject.subjectId,
          studentId: stats.studentId,
        });
      }

      // Consecutive Absences >= 2 or 3
      if (subject.consecutiveAbsences >= 2) {
        alerts.push({
          id: `alert_consec_${stats.studentId}_${subject.subjectId}_${subject.consecutiveAbsences}`,
          type: 'consecutive_absence',
          title: 'Consecutive Absence Warning',
          message: `⚠️ You have missed ${subject.consecutiveAbsences} consecutive ${subject.subjectName} classes. Immediate faculty counseling may be required.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          subjectId: subject.subjectId,
          studentId: stats.studentId,
        });
      }
    });

    return alerts;
  },
};
