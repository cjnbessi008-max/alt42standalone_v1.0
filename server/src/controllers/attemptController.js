/**
 * Quiz Attempt Controller
 * Handles student quiz attempts and answer submissions
 */

import { get, all, run, transaction } from '../config/database.js';

/**
 * Start a new quiz attempt
 */
export function startAttempt(req, res) {
    try {
        const { quizId } = req.params;
        const studentId = req.user.id;

        // Get quiz
        const quiz = get(
            'SELECT * FROM quizzes WHERE id = ? AND is_published = 1',
            [quizId]
        );

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found or not published' });
        }

        // Check attempt limit
        const attemptCount = get(
            'SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?',
            [quizId, studentId]
        );

        if (quiz.max_attempts && attemptCount.count >= quiz.max_attempts) {
            return res.status(403).json({ error: 'Maximum attempts reached' });
        }

        // Create new attempt
        const result = run(
            'INSERT INTO quiz_attempts (quiz_id, student_id) VALUES (?, ?)',
            [quizId, studentId]
        );

        const attemptId = result.lastInsertRowid;

        // Get questions for the quiz (without correct answers for students)
        const questions = all(
            `SELECT id, question_text, question_type, points, difficulty_level
             FROM questions
             WHERE quiz_id = ?
             ORDER BY order_num, id`,
            [quizId]
        );

        // Get options for each question (without is_correct flag)
        for (const question of questions) {
            question.options = all(
                'SELECT id, option_text FROM answer_options WHERE question_id = ? ORDER BY order_num, id',
                [question.id]
            );
        }

        res.status(201).json({
            message: 'Quiz attempt started',
            attempt: {
                id: attemptId,
                quiz_id: quizId,
                student_id: studentId,
                started_at: new Date().toISOString()
            },
            quiz: {
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                time_limit: quiz.time_limit,
                passing_score: quiz.passing_score
            },
            questions
        });
    } catch (error) {
        console.error('Start attempt error:', error);
        res.status(500).json({ error: 'Server error starting quiz attempt' });
    }
}

/**
 * Submit answer for a question
 */
export function submitAnswer(req, res) {
    try {
        const { attemptId, questionId } = req.params;
        const studentId = req.user.id;
        const { answer_text, selected_option_id, response_time } = req.body;

        // Verify attempt belongs to student and is not completed
        const attempt = get(
            'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ? AND is_completed = 0',
            [attemptId, studentId]
        );

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found or already completed' });
        }

        // Get question
        const question = get(
            'SELECT * FROM questions WHERE id = ? AND quiz_id = ?',
            [questionId, attempt.quiz_id]
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Check if answer already exists
        const existingAnswer = get(
            'SELECT id FROM student_answers WHERE attempt_id = ? AND question_id = ?',
            [attemptId, questionId]
        );

        // Determine correctness and points
        let is_correct = 0;
        let points_earned = 0;

        if (question.question_type === 'multiple_choice' && selected_option_id) {
            const selectedOption = get(
                'SELECT is_correct FROM answer_options WHERE id = ? AND question_id = ?',
                [selected_option_id, questionId]
            );

            if (selectedOption) {
                is_correct = selectedOption.is_correct;
                points_earned = is_correct ? question.points : 0;
            }
        } else if (question.question_type === 'true_false' && selected_option_id) {
            const selectedOption = get(
                'SELECT is_correct FROM answer_options WHERE id = ? AND question_id = ?',
                [selected_option_id, questionId]
            );

            if (selectedOption) {
                is_correct = selectedOption.is_correct;
                points_earned = is_correct ? question.points : 0;
            }
        }
        // For short_answer, teacher needs to grade manually later

        if (existingAnswer) {
            // Update existing answer
            run(
                `UPDATE student_answers
                 SET answer_text = ?, selected_option_id = ?, is_correct = ?,
                     points_earned = ?, response_time = ?, answered_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [answer_text, selected_option_id, is_correct, points_earned, response_time, existingAnswer.id]
            );
        } else {
            // Insert new answer
            run(
                `INSERT INTO student_answers
                 (attempt_id, question_id, answer_text, selected_option_id, is_correct, points_earned, response_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [attemptId, questionId, answer_text, selected_option_id, is_correct, points_earned, response_time]
            );
        }

        res.json({
            message: 'Answer submitted successfully',
            is_correct,
            points_earned
        });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Server error submitting answer' });
    }
}

/**
 * Complete quiz attempt
 */
export function completeAttempt(req, res) {
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;

        // Verify attempt
        const attempt = get(
            'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ? AND is_completed = 0',
            [attemptId, studentId]
        );

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found or already completed' });
        }

        // Calculate score
        const scoreData = get(
            `SELECT
                SUM(sa.points_earned) as earned_points,
                (SELECT SUM(q.points) FROM questions q WHERE q.quiz_id = ?) as total_points
             FROM student_answers sa
             WHERE sa.attempt_id = ?`,
            [attempt.quiz_id, attemptId]
        );

        const earnedPoints = scoreData.earned_points || 0;
        const totalPoints = scoreData.total_points || 1;
        const scorePercentage = (earnedPoints / totalPoints) * 100;

        // Calculate time spent
        const startedAt = new Date(attempt.started_at);
        const now = new Date();
        const timeSpent = Math.floor((now - startedAt) / 1000); // in seconds

        // Update attempt
        run(
            `UPDATE quiz_attempts
             SET is_completed = 1, completed_at = CURRENT_TIMESTAMP,
                 score = ?, total_points = ?, time_spent = ?
             WHERE id = ?`,
            [scorePercentage, totalPoints, timeSpent, attemptId]
        );

        // Get quiz info
        const quiz = get('SELECT * FROM quizzes WHERE id = ?', [attempt.quiz_id]);

        // Determine if passed
        const passed = scorePercentage >= quiz.passing_score;

        res.json({
            message: 'Quiz completed successfully',
            result: {
                attempt_id: attemptId,
                score: scorePercentage.toFixed(2),
                earned_points: earnedPoints,
                total_points: totalPoints,
                time_spent: timeSpent,
                passing_score: quiz.passing_score,
                passed
            }
        });
    } catch (error) {
        console.error('Complete attempt error:', error);
        res.status(500).json({ error: 'Server error completing quiz' });
    }
}

/**
 * Get attempt details and results
 */
export function getAttemptResults(req, res) {
    try {
        const { attemptId } = req.params;
        const userId = req.user.id;

        // Get attempt
        const attempt = get(
            'SELECT qa.*, q.title as quiz_title FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id WHERE qa.id = ?',
            [attemptId]
        );

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }

        // Check permissions
        if (req.user.role === 'student' && attempt.student_id !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (req.user.role === 'teacher') {
            const quiz = get('SELECT teacher_id FROM quizzes WHERE id = ?', [attempt.quiz_id]);
            if (quiz.teacher_id !== userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }
        }

        // Get answers
        const answers = all(
            `SELECT sa.*, q.question_text, q.question_type, q.points as max_points,
                    ao.option_text as selected_option_text
             FROM student_answers sa
             JOIN questions q ON q.id = sa.question_id
             LEFT JOIN answer_options ao ON ao.id = sa.selected_option_id
             WHERE sa.attempt_id = ?
             ORDER BY q.order_num, q.id`,
            [attemptId]
        );

        // For each answer, get the correct answer if attempt is completed
        if (attempt.is_completed) {
            for (const answer of answers) {
                if (answer.question_type !== 'short_answer') {
                    const correctOption = get(
                        'SELECT option_text FROM answer_options WHERE question_id = ? AND is_correct = 1',
                        [answer.question_id]
                    );
                    answer.correct_answer = correctOption?.option_text;
                }
            }
        }

        res.json({
            attempt,
            answers
        });
    } catch (error) {
        console.error('Get attempt results error:', error);
        res.status(500).json({ error: 'Server error fetching results' });
    }
}

/**
 * Get student's quiz history
 */
export function getStudentHistory(req, res) {
    try {
        const studentId = req.user.role === 'student' ? req.user.id : req.params.studentId;

        // Check permissions
        if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const attempts = all(
            `SELECT qa.*, q.title as quiz_title, q.passing_score,
                    CASE WHEN qa.score >= q.passing_score THEN 1 ELSE 0 END as passed
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.student_id = ? AND qa.is_completed = 1
             ORDER BY qa.completed_at DESC`,
            [studentId]
        );

        res.json({ attempts });
    } catch (error) {
        console.error('Get student history error:', error);
        res.status(500).json({ error: 'Server error fetching history' });
    }
}
