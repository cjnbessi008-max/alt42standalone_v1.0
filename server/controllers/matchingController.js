import { query, transaction } from '../db/connection.js';

// POST submit a matching answer
export const submitMatch = async (req, res) => {
  try {
    const {
      student_id,
      problem_id,
      shape_3d_id,
      shape_2d_id,
      response_time_ms,
      gesture_data,
      attempt_number = 1
    } = req.body;

    if (!student_id || !problem_id || !shape_3d_id || !shape_2d_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if this is a correct match
    const pairCheck = await query(`
      SELECT is_correct_match
      FROM problem_pairs
      WHERE problem_id = $1 AND shape_3d_id = $2 AND shape_2d_id = $3
    `, [problem_id, shape_3d_id, shape_2d_id]);

    const isCorrect = pairCheck.rows.length > 0 && pairCheck.rows[0].is_correct_match;

    // Insert response
    const responseResult = await query(`
      INSERT INTO student_responses (
        student_id, problem_id, shape_3d_id, shape_2d_id,
        is_correct, response_time_ms, gesture_data, attempt_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      student_id, problem_id, shape_3d_id, shape_2d_id,
      isCorrect, response_time_ms, gesture_data, attempt_number
    ]);

    // Update student progress
    await query(`
      INSERT INTO student_progress (student_id, problem_id, status, attempts, time_spent_seconds)
      VALUES ($1, $2, 'in_progress', 1, $3)
      ON CONFLICT (student_id, problem_id)
      DO UPDATE SET
        attempts = student_progress.attempts + 1,
        time_spent_seconds = student_progress.time_spent_seconds + $3,
        updated_at = CURRENT_TIMESTAMP
    `, [student_id, problem_id, Math.floor(response_time_ms / 1000)]);

    // Check if problem is completed (all correct matches made)
    const correctCount = await query(`
      SELECT COUNT(*) as correct_count
      FROM student_responses
      WHERE student_id = $1 AND problem_id = $2 AND is_correct = true
    `, [student_id, problem_id]);

    const totalCorrectPairs = await query(`
      SELECT COUNT(*) as total_count
      FROM problem_pairs
      WHERE problem_id = $1 AND is_correct_match = true
    `, [problem_id]);

    const correct = parseInt(correctCount.rows[0].correct_count);
    const total = parseInt(totalCorrectPairs.rows[0].total_count);
    const isCompleted = correct >= total;

    if (isCompleted) {
      const score = (correct / total) * 100;
      await query(`
        UPDATE student_progress
        SET status = 'completed', score = $1, completed_at = CURRENT_TIMESTAMP
        WHERE student_id = $2 AND problem_id = $3
      `, [score, student_id, problem_id]);
    }

    res.json({
      success: true,
      data: {
        response: responseResult.rows[0],
        is_correct: isCorrect,
        progress: {
          correct_matches: correct,
          total_matches: total,
          is_completed: isCompleted
        }
      }
    });
  } catch (error) {
    console.error('Error submitting match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit match'
    });
  }
};

// GET student progress for a specific problem
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId, problemId } = req.params;

    const result = await query(`
      SELECT
        sp.*,
        p.title,
        p.title_ko,
        p.difficulty_level,
        (
          SELECT COUNT(*)
          FROM student_responses sr
          WHERE sr.student_id = sp.student_id
          AND sr.problem_id = sp.problem_id
          AND sr.is_correct = true
        ) as correct_matches,
        (
          SELECT COUNT(*)
          FROM problem_pairs pp
          WHERE pp.problem_id = sp.problem_id
          AND pp.is_correct_match = true
        ) as total_matches
      FROM student_progress sp
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = $1 AND sp.problem_id = $2
    `, [studentId, problemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Progress not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
};

// GET all responses for a student
export const getStudentResponses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { problemId } = req.query;

    let sql = `
      SELECT
        sr.*,
        s3d.name as shape_3d_name,
        s3d.name_ko as shape_3d_name_ko,
        s2d.name as shape_2d_name,
        s2d.name_ko as shape_2d_name_ko,
        p.title as problem_title,
        p.title_ko as problem_title_ko
      FROM student_responses sr
      JOIN shapes_3d s3d ON sr.shape_3d_id = s3d.id
      JOIN shapes_2d s2d ON sr.shape_2d_id = s2d.id
      JOIN problems p ON sr.problem_id = p.id
      WHERE sr.student_id = $1
    `;
    const params = [studentId];

    if (problemId) {
      sql += ' AND sr.problem_id = $2';
      params.push(problemId);
    }

    sql += ' ORDER BY sr.submitted_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses'
    });
  }
};
