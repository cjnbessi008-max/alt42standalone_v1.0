import pool from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacherId = uuidv4();

    await pool.query(
      `
      INSERT INTO teachers (id, email, password_hash, name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `,
      [teacherId, 'teacher@example.com', teacherPassword, '김교수', 'teacher']
    );
    console.log('✅ Created teacher: teacher@example.com / teacher123');

    // Create sample students
    const studentPassword = await bcrypt.hash('student123', 10);
    const studentIds: string[] = [];

    const students = [
      { name: '이민수', email: 'student1@example.com', grade: 5 },
      { name: '박지영', email: 'student2@example.com', grade: 5 },
      { name: '최서준', email: 'student3@example.com', grade: 6 },
    ];

    for (const student of students) {
      const studentId = uuidv4();
      studentIds.push(studentId);

      await pool.query(
        `
        INSERT INTO students (id, email, password_hash, name, grade_level)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `,
        [studentId, student.email, studentPassword, student.name, student.grade]
      );
      console.log(`✅ Created student: ${student.email} / student123`);
    }

    // Create sample module
    const moduleId = uuidv4();
    await pool.query(
      `
      INSERT INTO modules (id, name, description, teacher_id, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
      [
        moduleId,
        '분수 학습 모듈',
        '5학년을 위한 분수 이해 및 계산 학습',
        teacherId,
        'active',
      ]
    );
    console.log('✅ Created module: 분수 학습 모듈');

    // Enroll students in module
    for (const studentId of studentIds) {
      await pool.query(
        `
        INSERT INTO student_enrollments (student_id, module_id)
        VALUES ($1, $2)
        ON CONFLICT (student_id, module_id) DO NOTHING
      `,
        [studentId, moduleId]
      );
    }
    console.log('✅ Enrolled students in module');

    // Create sample distraction session
    const sessionId = uuidv4();
    await pool.query(
      `
      INSERT INTO distraction_sessions (
        id, student_id, module_id, session_id, session_start
      )
      VALUES ($1, $2, $3, $4, NOW() - INTERVAL '2 hours')
      ON CONFLICT (session_id) DO NOTHING
    `,
      [uuidv4(), studentIds[0], moduleId, sessionId]
    );
    console.log('✅ Created sample session');

    // Create sample distraction events
    const eventTypes = ['page_blur', 'tab_switch', 'mouse_idle', 'inactivity'];
    for (let i = 0; i < 5; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const duration = Math.floor(Math.random() * 120) + 5; // 5-125 seconds

      await pool.query(
        `
        INSERT INTO distraction_events (
          id, student_id, module_id, session_id, event_type,
          severity_level, duration_seconds, event_timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${i * 10} minutes')
      `,
        [
          uuidv4(),
          studentIds[0],
          moduleId,
          sessionId,
          eventType,
          duration < 10 ? 'minor' : duration < 30 ? 'moderate' : duration < 60 ? 'major' : 'critical',
          duration,
        ]
      );
    }
    console.log('✅ Created 5 sample distraction events');

    // Create threshold configuration
    await pool.query(
      `
      INSERT INTO distraction_thresholds (
        id, module_id, teacher_id,
        critical_percentage, warning_percentage, minor_percentage,
        auto_pause_on_critical, send_teacher_alerts, send_student_reminders
      )
      VALUES ($1, $2, $3, 50, 30, 10, false, true, true)
      ON CONFLICT (module_id) DO NOTHING
    `,
      [uuidv4(), moduleId, teacherId]
    );
    console.log('✅ Created threshold configuration');

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('   Teacher: teacher@example.com / teacher123');
    console.log('   Student 1: student1@example.com / student123');
    console.log('   Student 2: student2@example.com / student123');
    console.log('   Student 3: student3@example.com / student123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
