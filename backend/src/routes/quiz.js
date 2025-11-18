const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const [quizzes] = await db.query(`
      SELECT q.*, u.username as creator_name,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.is_active = TRUE
      ORDER BY q.created_at DESC
    `);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz by ID with questions
router.get('/:id', async (req, res) => {
  try {
    const quizId = req.params.id;

    // Get quiz details
    const [quizzes] = await db.query(
      'SELECT * FROM quizzes WHERE id = ? AND is_active = TRUE',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizzes[0];

    // Get questions with answer options
    const [questions] = await db.query(`
      SELECT q.id, q.question_text, q.question_type, q.points, q.order_num
      FROM questions q
      WHERE q.quiz_id = ?
      ORDER BY q.order_num ASC
    `, [quizId]);

    // Get answer options for each question
    for (let question of questions) {
      const [options] = await db.query(`
        SELECT id, option_text, order_num
        FROM answer_options
        WHERE question_id = ?
        ORDER BY order_num ASC
      `, [question.id]);
      question.options = options;
    }

    quiz.questions = questions;
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Start quiz attempt
router.post('/:id/start', async (req, res) => {
  try {
    const quizId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get quiz info
    const [quizzes] = await db.query(
      'SELECT * FROM quizzes WHERE id = ? AND is_active = TRUE',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Calculate total points
    const [pointsResult] = await db.query(
      'SELECT SUM(points) as total_points FROM questions WHERE quiz_id = ?',
      [quizId]
    );
    const totalPoints = pointsResult[0].total_points || 0;

    // Create attempt
    const [result] = await db.query(
      'INSERT INTO quiz_attempts (quiz_id, user_id, total_points) VALUES (?, ?, ?)',
      [quizId, userId, totalPoints]
    );

    res.json({
      attemptId: result.insertId,
      quizId: quizId,
      totalPoints: totalPoints,
      startedAt: new Date()
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit answer
router.post('/attempts/:attemptId/answer', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const { questionId, selectedOptionId, answerText } = req.body;

    // Get question details
    const [questions] = await db.query(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );

    if (questions.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = questions[0];
    let isCorrect = false;
    let pointsEarned = 0;

    // Check if answer is correct
    if (question.question_type === 'multiple_choice' && selectedOptionId) {
      const [options] = await db.query(
        'SELECT is_correct FROM answer_options WHERE id = ?',
        [selectedOptionId]
      );

      if (options.length > 0 && options[0].is_correct) {
        isCorrect = true;
        pointsEarned = question.points;
      }
    }

    // Save answer
    await db.query(`
      INSERT INTO user_answers
      (attempt_id, question_id, selected_option_id, answer_text, is_correct, points_earned)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        selected_option_id = VALUES(selected_option_id),
        answer_text = VALUES(answer_text),
        is_correct = VALUES(is_correct),
        points_earned = VALUES(points_earned),
        answered_at = CURRENT_TIMESTAMP
    `, [attemptId, questionId, selectedOptionId, answerText, isCorrect, pointsEarned]);

    res.json({
      success: true,
      isCorrect,
      pointsEarned
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Complete quiz attempt
router.post('/attempts/:attemptId/complete', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;

    // Calculate score
    const [earnedResult] = await db.query(
      'SELECT SUM(points_earned) as earned_points FROM user_answers WHERE attempt_id = ?',
      [attemptId]
    );

    const earnedPoints = earnedResult[0].earned_points || 0;

    // Get total points
    const [attemptResult] = await db.query(
      'SELECT total_points FROM quiz_attempts WHERE id = ?',
      [attemptId]
    );

    if (attemptResult.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const totalPoints = attemptResult[0].total_points;
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Update attempt
    await db.query(`
      UPDATE quiz_attempts
      SET completed_at = CURRENT_TIMESTAMP,
          score = ?,
          earned_points = ?,
          is_completed = TRUE
      WHERE id = ?
    `, [score, earnedPoints, attemptId]);

    res.json({
      attemptId,
      score: parseFloat(score.toFixed(2)),
      earnedPoints,
      totalPoints,
      completedAt: new Date()
    });
  } catch (error) {
    console.error('Error completing quiz:', error);
    res.status(500).json({ error: 'Failed to complete quiz' });
  }
});

// Get attempt results
router.get('/attempts/:attemptId/results', async (req, res) => {
  try {
    const attemptId = req.params.attemptId;

    // Get attempt details
    const [attempts] = await db.query(`
      SELECT qa.*, q.title as quiz_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attempt = attempts[0];

    // Get all answers with question details
    const [answers] = await db.query(`
      SELECT
        ua.*,
        q.question_text,
        q.points as max_points,
        ao.option_text as selected_option_text,
        (SELECT option_text FROM answer_options
         WHERE question_id = q.id AND is_correct = TRUE LIMIT 1) as correct_answer
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      LEFT JOIN answer_options ao ON ua.selected_option_id = ao.id
      WHERE ua.attempt_id = ?
      ORDER BY q.order_num ASC
    `, [attemptId]);

    attempt.answers = answers;
    res.json(attempt);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
