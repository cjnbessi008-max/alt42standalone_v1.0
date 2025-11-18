import pool from '../config/database';

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Seed sample students
    const students = [
      { lms_id: 'student001', lms_type: 'kaist', name: '김민준', email: 'minjun.kim@kaist.ac.kr', grade_level: 10 },
      { lms_id: 'student002', lms_type: 'kaist', name: '이서연', email: 'seoyeon.lee@kaist.ac.kr', grade_level: 10 },
      { lms_id: 'student003', lms_type: 'kaist', name: '박지호', email: 'jiho.park@kaist.ac.kr', grade_level: 11 },
      { lms_id: 'student004', lms_type: 'canvas', name: 'John Smith', email: 'john.smith@example.com', grade_level: 11 },
      { lms_id: 'student005', lms_type: 'moodle', name: 'Emma Johnson', email: 'emma.j@example.com', grade_level: 12 },
    ];

    for (const student of students) {
      await pool.query(
        `INSERT INTO students (lms_id, lms_type, name, email, grade_level)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (lms_id, lms_type) DO NOTHING`,
        [student.lms_id, student.lms_type, student.name, student.email, student.grade_level]
      );
    }
    console.log(`✅ Seeded ${students.length} students`);

    // Get student IDs for further seeding
    const { rows: studentRows } = await pool.query('SELECT id, lms_id FROM students LIMIT 3');

    if (studentRows.length > 0) {
      // Seed sample learning sessions
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const student of studentRows) {
        // Create a session from yesterday
        const sessionResult = await pool.query(
          `INSERT INTO learning_sessions (student_id, course_id, course_name, started_at, ended_at, activity_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            student.id,
            'MATH101',
            '미적분학 기초',
            yesterday,
            new Date(yesterday.getTime() + 90 * 60 * 1000), // 90 minutes later
            'lecture'
          ]
        );

        const sessionId = sessionResult.rows[0].id;

        // Add emotion records for this session
        const emotions = [
          { type: 'neutral', intensity: 3, note: '수업 시작' },
          { type: 'confused', intensity: 4, note: '미분 개념이 어려워요' },
          { type: 'happy', intensity: 4, note: '이해가 되기 시작했어요!' },
        ];

        for (let i = 0; i < emotions.length; i++) {
          const emotion = emotions[i];
          const recordedAt = new Date(yesterday.getTime() + (i * 30) * 60 * 1000);

          await pool.query(
            `INSERT INTO emotion_records (student_id, session_id, emotion_type, intensity, note, recorded_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [student.id, sessionId, emotion.type, emotion.intensity, emotion.note, recordedAt]
          );
        }
      }
      console.log(`✅ Seeded learning sessions and emotion records`);

      // Generate daily summaries for yesterday
      for (const student of studentRows) {
        await pool.query(
          `INSERT INTO daily_emotion_summaries
           (student_id, summary_date, total_learning_minutes, session_count, emotion_distribution, dominant_emotion, average_intensity, emotion_trend)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (student_id, summary_date) DO NOTHING`,
          [
            student.id,
            yesterday.toISOString().split('T')[0],
            90,
            1,
            JSON.stringify({ neutral: 1, confused: 1, happy: 1 }),
            'happy',
            3.67,
            'improving'
          ]
        );
      }
      console.log(`✅ Seeded daily emotion summaries`);
    }

    // Seed sample LMS integration
    await pool.query(
      `INSERT INTO lms_integrations (institution_name, lms_type, lms_url, client_id, client_secret_encrypted, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        'KAIST Touch Math Academy',
        'kaist',
        'https://lms.kaist.ac.kr',
        'sample_client_id',
        'encrypted_secret_placeholder',
        true
      ]
    );
    console.log(`✅ Seeded LMS integration`);

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
