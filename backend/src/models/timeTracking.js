import pool from '../db/connection.js';

/**
 * Time Tracking Model
 * 문제당 소비시간을 추적하는 모델
 */

/**
 * 새로운 문제 시도 시작
 */
export async function startProblemAttempt(studentId, problemId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get student UUID
    const studentResult = await client.query(
      'SELECT id FROM students WHERE student_id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new Error('Student not found');
    }

    // Get problem UUID
    const problemResult = await client.query(
      'SELECT id FROM problems WHERE problem_id = $1',
      [problemId]
    );

    if (problemResult.rows.length === 0) {
      throw new Error('Problem not found');
    }

    const studentUuid = studentResult.rows[0].id;
    const problemUuid = problemResult.rows[0].id;

    // Get next attempt number
    const attemptNumberResult = await client.query(
      'SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt FROM problem_attempts WHERE student_id = $1 AND problem_id = $2',
      [studentUuid, problemUuid]
    );
    const attemptNumber = attemptNumberResult.rows[0].next_attempt;

    // Create new attempt
    const result = await client.query(
      `INSERT INTO problem_attempts
       (student_id, problem_id, attempt_number, started_at, status)
       VALUES ($1, $2, $3, NOW(), 'in_progress')
       RETURNING *`,
      [studentUuid, problemUuid, attemptNumber]
    );

    // Record initial event
    await client.query(
      `INSERT INTO time_tracking_events
       (attempt_id, event_type, event_timestamp)
       VALUES ($1, 'start', NOW())`,
      [result.rows[0].id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 시간 추적 이벤트 기록 (focus, blur, interaction 등)
 */
export async function recordTimeEvent(attemptId, eventType, eventData = null) {
  const result = await pool.query(
    `INSERT INTO time_tracking_events
     (attempt_id, event_type, event_timestamp, event_data)
     VALUES ($1, $2, NOW(), $3)
     RETURNING *`,
    [attemptId, eventType, JSON.stringify(eventData)]
  );
  return result.rows[0];
}

/**
 * 문제 시도 완료 및 시간 계산
 */
export async function completeProblemAttempt(attemptId, isCorrect, answerData = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get attempt start time
    const attemptResult = await client.query(
      'SELECT started_at, student_id, problem_id FROM problem_attempts WHERE id = $1',
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      throw new Error('Attempt not found');
    }

    const startedAt = attemptResult.rows[0].started_at;
    const now = new Date();
    const timeSpentSeconds = Math.floor((now - new Date(startedAt)) / 1000);

    // Calculate active time from events
    const eventsResult = await client.query(
      `SELECT event_type, event_timestamp
       FROM time_tracking_events
       WHERE attempt_id = $1
       ORDER BY event_timestamp ASC`,
      [attemptId]
    );

    let activeTimeSeconds = 0;
    let lastActiveTime = null;
    let isActive = true;

    for (const event of eventsResult.rows) {
      const eventTime = new Date(event.event_timestamp);

      if (event.event_type === 'start' || event.event_type === 'focus' || event.event_type === 'resume') {
        lastActiveTime = eventTime;
        isActive = true;
      } else if (event.event_type === 'blur' || event.event_type === 'pause') {
        if (isActive && lastActiveTime) {
          activeTimeSeconds += Math.floor((eventTime - lastActiveTime) / 1000);
        }
        isActive = false;
        lastActiveTime = null;
      }
    }

    // Add remaining active time if still active
    if (isActive && lastActiveTime) {
      activeTimeSeconds += Math.floor((now - lastActiveTime) / 1000);
    }

    // Count interactions
    const interactionResult = await client.query(
      `SELECT COUNT(*) as count
       FROM time_tracking_events
       WHERE attempt_id = $1 AND event_type = 'interaction'`,
      [attemptId]
    );
    const interactionCount = parseInt(interactionResult.rows[0].count);

    // Count hint requests
    const hintResult = await client.query(
      `SELECT COUNT(*) as count
       FROM time_tracking_events
       WHERE attempt_id = $1 AND event_type = 'hint_request'`,
      [attemptId]
    );
    const hintRequests = parseInt(hintResult.rows[0].count);

    // Update attempt
    const result = await client.query(
      `UPDATE problem_attempts
       SET completed_at = NOW(),
           time_spent_seconds = $1,
           active_time_seconds = $2,
           is_correct = $3,
           answer_data = $4,
           status = 'submitted',
           interaction_count = $5,
           hint_requests = $6
       WHERE id = $7
       RETURNING *`,
      [timeSpentSeconds, activeTimeSeconds, isCorrect, JSON.stringify(answerData), interactionCount, hintRequests, attemptId]
    );

    // Record completion event
    await client.query(
      `INSERT INTO time_tracking_events
       (attempt_id, event_type, event_timestamp, event_data)
       VALUES ($1, 'complete', NOW(), $2)`,
      [attemptId, JSON.stringify({ is_correct: isCorrect })]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 학생의 문제 시도 기록 조회
 */
export async function getStudentAttempts(studentId, problemId = null) {
  let query = `
    SELECT
      pa.*,
      p.problem_id,
      p.title as problem_title,
      s.student_id
    FROM problem_attempts pa
    JOIN students s ON pa.student_id = s.id
    JOIN problems p ON pa.problem_id = p.id
    WHERE s.student_id = $1
  `;
  const params = [studentId];

  if (problemId) {
    query += ' AND p.problem_id = $2';
    params.push(problemId);
  }

  query += ' ORDER BY pa.started_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * 문제별 통계 조회
 */
export async function getProblemStatistics(problemId) {
  const result = await pool.query(
    `SELECT
      p.problem_id,
      p.title,
      COUNT(pa.id) as total_attempts,
      AVG(pa.time_spent_seconds)::INTEGER as avg_time_seconds,
      AVG(pa.active_time_seconds)::INTEGER as avg_active_time_seconds,
      MIN(pa.time_spent_seconds) as min_time_seconds,
      MAX(pa.time_spent_seconds) as max_time_seconds,
      AVG(pa.interaction_count)::DECIMAL(10,2) as avg_interactions,
      SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(pa.id), 0) * 100 as success_rate
    FROM problems p
    LEFT JOIN problem_attempts pa ON p.id = pa.problem_id AND pa.status = 'submitted'
    WHERE p.problem_id = $1
    GROUP BY p.id, p.problem_id, p.title`,
    [problemId]
  );
  return result.rows[0];
}

/**
 * Get active attempt for student and problem
 */
export async function getActiveAttempt(studentId, problemId) {
  const result = await pool.query(
    `SELECT pa.*
     FROM problem_attempts pa
     JOIN students s ON pa.student_id = s.id
     JOIN problems p ON pa.problem_id = p.id
     WHERE s.student_id = $1
       AND p.problem_id = $2
       AND pa.status = 'in_progress'
     ORDER BY pa.started_at DESC
     LIMIT 1`,
    [studentId, problemId]
  );
  return result.rows[0];
}
