import db, { initializeDatabase } from './database';
import { subDays, format, addDays } from 'date-fns';

// Initialize database
initializeDatabase();

// Clear existing data
db.exec('DELETE FROM consistency_scores');
db.exec('DELETE FROM submissions');
db.exec('DELETE FROM assignments');
db.exec('DELETE FROM activities');
db.exec('DELETE FROM attendance');
db.exec('DELETE FROM students');

// Insert students
const students = [
  { name: '김민준', email: 'minjun.kim@example.com', student_id: 'S20210001' },
  { name: '이서연', email: 'seoyeon.lee@example.com', student_id: 'S20210002' },
  { name: '박지호', email: 'jiho.park@example.com', student_id: 'S20210003' },
  { name: '최유진', email: 'yujin.choi@example.com', student_id: 'S20210004' },
  { name: '정서준', email: 'seojun.jung@example.com', student_id: 'S20210005' },
  { name: '강민지', email: 'minji.kang@example.com', student_id: 'S20210006' },
  { name: '윤도현', email: 'dohyun.yoon@example.com', student_id: 'S20210007' },
  { name: '임수아', email: 'sua.lim@example.com', student_id: 'S20210008' },
];

const insertStudent = db.prepare('INSERT INTO students (name, email, student_id) VALUES (?, ?, ?)');
students.forEach(student => {
  insertStudent.run(student.name, student.email, student.student_id);
});

console.log(`✓ Inserted ${students.length} students`);

// Insert assignments (for the past 60 days)
const assignments = [
  { title: '기초 대수학 과제 1', daysAgo: 50 },
  { title: '함수와 그래프 과제', daysAgo: 45 },
  { title: '방정식 풀이 연습', daysAgo: 38 },
  { title: '기하학 기초', daysAgo: 30 },
  { title: '확률과 통계 입문', daysAgo: 22 },
  { title: '미적분 기초', daysAgo: 15 },
  { title: '선형대수 개념', daysAgo: 8 },
  { title: '종합 복습 과제', daysAgo: 2 },
];

const insertAssignment = db.prepare('INSERT INTO assignments (title, due_date) VALUES (?, ?)');
assignments.forEach(assignment => {
  const dueDate = subDays(new Date(), assignment.daysAgo);
  insertAssignment.run(assignment.title, dueDate.toISOString());
});

console.log(`✓ Inserted ${assignments.length} assignments`);

// Generate attendance data for past 60 days
const insertAttendance = db.prepare('INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)');
const studentIds = db.prepare('SELECT id FROM students').all() as Array<{ id: number }>;

for (let i = 60; i >= 0; i--) {
  const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
  const dayOfWeek = subDays(new Date(), i).getDay();

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) continue;

  studentIds.forEach(({ id }) => {
    let status: string;
    const rand = Math.random();

    // Different attendance patterns for different students
    if (id <= 2) {
      // Very consistent students (95% attendance)
      status = rand < 0.95 ? 'present' : rand < 0.97 ? 'late' : 'absent';
    } else if (id <= 5) {
      // Moderately consistent (85% attendance)
      status = rand < 0.85 ? 'present' : rand < 0.90 ? 'late' : 'absent';
    } else {
      // Less consistent (70% attendance)
      status = rand < 0.70 ? 'present' : rand < 0.80 ? 'late' : 'absent';
    }

    insertAttendance.run(id, date, status);
  });
}

console.log('✓ Generated attendance records for 60 days');

// Generate learning activities
const activityTypes = ['video_watch', 'quiz_attempt', 'reading', 'practice_problem', 'discussion'];
const insertActivity = db.prepare(
  'INSERT INTO activities (student_id, activity_type, duration_minutes, completed_at) VALUES (?, ?, ?, ?)'
);

studentIds.forEach(({ id }) => {
  // Generate 3-10 activities per day for the past 60 days
  for (let i = 60; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const numActivities = id <= 2 ? 8 + Math.floor(Math.random() * 3) : // 8-10 activities
                         id <= 5 ? 5 + Math.floor(Math.random() * 4) : // 5-8 activities
                         2 + Math.floor(Math.random() * 5); // 2-6 activities

    for (let j = 0; j < numActivities; j++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const duration = 10 + Math.floor(Math.random() * 50); // 10-60 minutes
      const hours = 8 + Math.floor(Math.random() * 12); // Between 8am and 8pm
      const minutes = Math.floor(Math.random() * 60);

      const completedAt = new Date(date);
      completedAt.setHours(hours, minutes, 0, 0);

      insertActivity.run(id, activityType, duration, completedAt.toISOString());
    }
  }
});

console.log('✓ Generated learning activity records');

// Generate assignment submissions
const insertSubmission = db.prepare(
  'INSERT INTO submissions (student_id, assignment_id, submitted_at, score) VALUES (?, ?, ?, ?)'
);

const assignmentIds = db.prepare('SELECT id, due_date FROM assignments').all() as Array<{
  id: number;
  due_date: string;
}>;

studentIds.forEach(({ id }) => {
  assignmentIds.forEach(assignment => {
    const dueDate = new Date(assignment.due_date);
    const rand = Math.random();

    // Submission probability and timing varies by student
    let shouldSubmit: boolean;
    let daysOffset: number;

    if (id <= 2) {
      // Very consistent: 100% submission, usually early
      shouldSubmit = true;
      daysOffset = -2 + Math.floor(Math.random() * 2); // 2 days early to on time
    } else if (id <= 5) {
      // Moderately consistent: 90% submission, sometimes late
      shouldSubmit = rand < 0.90;
      daysOffset = -1 + Math.floor(Math.random() * 3); // 1 day early to 1 day late
    } else {
      // Less consistent: 70% submission, often late
      shouldSubmit = rand < 0.70;
      daysOffset = Math.floor(Math.random() * 5); // On time to 4 days late
    }

    if (shouldSubmit) {
      const submittedAt = addDays(dueDate, daysOffset);
      const score = 60 + Math.random() * 40; // 60-100 score
      insertSubmission.run(id, assignment.id, submittedAt.toISOString(), score);
    }
  });
});

console.log('✓ Generated assignment submission records');
console.log('\n✅ Database seeded successfully!');
