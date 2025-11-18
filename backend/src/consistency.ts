import db from './database';
import { subDays, format, differenceInDays } from 'date-fns';

interface ConsistencyScore {
  date: string;
  attendanceScore: number;
  activityScore: number;
  submissionScore: number;
  totalScore: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  student_id: string;
}

/**
 * Calculate attendance score (0-100) for a student over a period
 * Formula: (present days + 0.5 * late days) / total days * 100
 */
function calculateAttendanceScore(studentId: number, startDate: Date, endDate: Date): number {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const attendance = db
    .prepare(
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE student_id = ? AND date BETWEEN ? AND ?
       GROUP BY status`
    )
    .all(studentId, start, end) as Array<{ status: string; count: number }>;

  const totalDays = db
    .prepare('SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND date BETWEEN ? AND ?')
    .get(studentId, start, end) as { count: number };

  if (totalDays.count === 0) return 0;

  let presentDays = 0;
  let lateDays = 0;

  attendance.forEach(record => {
    if (record.status === 'present') presentDays = record.count;
    if (record.status === 'late') lateDays = record.count;
  });

  return ((presentDays + lateDays * 0.5) / totalDays.count) * 100;
}

/**
 * Calculate activity score (0-100) based on daily activity frequency
 * Formula: min(average_daily_activities / target_activities * 100, 100)
 * Target: 6 activities per day
 */
function calculateActivityScore(studentId: number, startDate: Date, endDate: Date): number {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const result = db
    .prepare(
      `SELECT COUNT(*) as count
       FROM activities
       WHERE student_id = ? AND DATE(completed_at) BETWEEN ? AND ?`
    )
    .get(studentId, start, end) as { count: number };

  const days = differenceInDays(endDate, startDate) + 1;
  const avgActivitiesPerDay = result.count / days;

  // Target is 6 activities per day for 100% score
  const targetActivities = 6;
  return Math.min((avgActivitiesPerDay / targetActivities) * 100, 100);
}

/**
 * Calculate submission score (0-100) based on on-time submissions
 * Formula: (on_time_submissions + 0.7 * late_submissions) / total_assignments * 100
 */
function calculateSubmissionScore(studentId: number, startDate: Date, endDate: Date): number {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const assignments = db
    .prepare('SELECT id, due_date FROM assignments WHERE DATE(due_date) BETWEEN ? AND ?')
    .all(start, end) as Array<{ id: number; due_date: string }>;

  if (assignments.length === 0) return 100; // No assignments = full score

  let onTimeSubmissions = 0;
  let lateSubmissions = 0;

  assignments.forEach(assignment => {
    const submission = db
      .prepare('SELECT submitted_at FROM submissions WHERE student_id = ? AND assignment_id = ?')
      .get(studentId, assignment.id) as { submitted_at: string } | undefined;

    if (submission) {
      const submittedDate = new Date(submission.submitted_at);
      const dueDate = new Date(assignment.due_date);

      if (submittedDate <= dueDate) {
        onTimeSubmissions++;
      } else {
        lateSubmissions++;
      }
    }
  });

  return ((onTimeSubmissions + lateSubmissions * 0.7) / assignments.length) * 100;
}

/**
 * Calculate total consistency score
 * Weights: Attendance 30%, Activity 40%, Submission 30%
 */
export function calculateConsistencyScore(
  studentId: number,
  startDate: Date,
  endDate: Date
): ConsistencyScore {
  const attendanceScore = calculateAttendanceScore(studentId, startDate, endDate);
  const activityScore = calculateActivityScore(studentId, startDate, endDate);
  const submissionScore = calculateSubmissionScore(studentId, startDate, endDate);

  const totalScore = attendanceScore * 0.3 + activityScore * 0.4 + submissionScore * 0.3;

  return {
    date: format(endDate, 'yyyy-MM-dd'),
    attendanceScore: Math.round(attendanceScore * 10) / 10,
    activityScore: Math.round(activityScore * 10) / 10,
    submissionScore: Math.round(submissionScore * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
  };
}

/**
 * Calculate and store consistency scores for all students over a date range
 */
export function calculateAndStoreScores() {
  const students = db.prepare('SELECT id FROM students').all() as Array<{ id: number }>;

  const insertScore = db.prepare(
    `INSERT OR REPLACE INTO consistency_scores
     (student_id, date, attendance_score, activity_score, submission_score, total_score)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  // Calculate scores for the past 60 days, using a 7-day rolling window
  for (let i = 6; i >= 0; i--) {
    const endDate = subDays(new Date(), i);
    const startDate = subDays(endDate, 6); // 7-day window

    students.forEach(({ id }) => {
      const score = calculateConsistencyScore(id, startDate, endDate);
      insertScore.run(
        id,
        score.date,
        score.attendanceScore,
        score.activityScore,
        score.submissionScore,
        score.totalScore
      );
    });
  }

  console.log('✓ Calculated and stored consistency scores');
}

/**
 * Get consistency score trend for a student
 */
export function getStudentScoreTrend(studentId: number, days: number = 30) {
  return db
    .prepare(
      `SELECT date, attendance_score, activity_score, submission_score, total_score
       FROM consistency_scores
       WHERE student_id = ?
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(studentId, days) as Array<{
    date: string;
    attendance_score: number;
    activity_score: number;
    submission_score: number;
    total_score: number;
  }>;
}

/**
 * Get latest consistency scores for all students
 */
export function getAllStudentsLatestScores() {
  return db
    .prepare(
      `SELECT
         s.id,
         s.name,
         s.email,
         s.student_id,
         cs.date,
         cs.attendance_score,
         cs.activity_score,
         cs.submission_score,
         cs.total_score
       FROM students s
       LEFT JOIN consistency_scores cs ON s.id = cs.student_id
       WHERE cs.date = (
         SELECT MAX(date) FROM consistency_scores WHERE student_id = s.id
       )
       ORDER BY cs.total_score DESC`
    )
    .all() as Array<{
    id: number;
    name: string;
    email: string;
    student_id: string;
    date: string;
    attendance_score: number;
    activity_score: number;
    submission_score: number;
    total_score: number;
  }>;
}

/**
 * Get student info
 */
export function getStudent(studentId: number): Student | undefined {
  return db.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as Student | undefined;
}

/**
 * Get all students
 */
export function getAllStudents(): Student[] {
  return db.prepare('SELECT * FROM students ORDER BY name').all() as Student[];
}
