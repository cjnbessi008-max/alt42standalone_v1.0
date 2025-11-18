/**
 * Quiz Controller
 * Handles quiz creation, management, and retrieval
 */

import { get, all, run, transaction } from '../config/database.js';

/**
 * Create a new quiz (teachers only)
 */
export function createQuiz(req, res) {
    try {
        const teacherId = req.user.id;
        const {
            title,
            description,
            time_limit,
            passing_score = 60.0,
            max_attempts = 3
        } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Quiz title is required' });
        }

        const result = run(
            `INSERT INTO quizzes (title, description, teacher_id, time_limit, passing_score, max_attempts)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description || null, teacherId, time_limit || null, passing_score, max_attempts]
        );

        const quiz = get('SELECT * FROM quizzes WHERE id = ?', [result.lastInsertRowid]);

        res.status(201).json({
            message: 'Quiz created successfully',
            quiz
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ error: 'Server error creating quiz' });
    }
}

/**
 * Get all quizzes (filtered by role)
 */
export function getQuizzes(req, res) {
    try {
        const user = req.user;
        let quizzes;

        if (user.role === 'teacher') {
            // Teachers see their own quizzes
            quizzes = all(
                `SELECT q.*, COUNT(DISTINCT qa.id) as total_attempts
                 FROM quizzes q
                 LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
                 WHERE q.teacher_id = ?
                 GROUP BY q.id
                 ORDER BY q.created_at DESC`,
                [user.id]
            );
        } else {
            // Students see only published quizzes
            quizzes = all(
                `SELECT q.id, q.title, q.description, q.time_limit, q.passing_score,
                        q.max_attempts, q.created_at,
                        u.full_name as teacher_name,
                        COUNT(DISTINCT qa.id) as my_attempts
                 FROM quizzes q
                 JOIN users u ON u.id = q.teacher_id
                 LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = ?
                 WHERE q.is_published = 1
                 GROUP BY q.id
                 ORDER BY q.created_at DESC`,
                [user.id]
            );
        }

        res.json({ quizzes });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ error: 'Server error fetching quizzes' });
    }
}

/**
 * Get single quiz by ID
 */
export function getQuizById(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;

        const quiz = get('SELECT * FROM quizzes WHERE id = ?', [id]);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Check permissions
        if (user.role === 'student' && !quiz.is_published) {
            return res.status(403).json({ error: 'Quiz not available' });
        }

        if (user.role === 'teacher' && quiz.teacher_id !== user.id) {
            return res.status(403).json({ error: 'Not authorized to view this quiz' });
        }

        // Get questions
        const questions = all(
            'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_num, id',
            [id]
        );

        // Get answer options for each question
        for (const question of questions) {
            question.options = all(
                'SELECT * FROM answer_options WHERE question_id = ? ORDER BY order_num, id',
                [question.id]
            );
        }

        // Get quiz statistics
        const stats = get(
            `SELECT
                COUNT(DISTINCT qa.student_id) as total_students,
                COUNT(qa.id) as total_attempts,
                AVG(qa.score) as avg_score,
                MAX(qa.score) as highest_score,
                MIN(qa.score) as lowest_score
             FROM quiz_attempts qa
             WHERE qa.quiz_id = ? AND qa.is_completed = 1`,
            [id]
        );

        res.json({
            quiz,
            questions,
            stats: stats || {
                total_students: 0,
                total_attempts: 0,
                avg_score: 0,
                highest_score: 0,
                lowest_score: 0
            }
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ error: 'Server error fetching quiz' });
    }
}

/**
 * Update quiz
 */
export function updateQuiz(req, res) {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;
        const { title, description, time_limit, passing_score, max_attempts, is_published } = req.body;

        // Verify ownership
        const quiz = get('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?', [id, teacherId]);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found or not authorized' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (time_limit !== undefined) { updates.push('time_limit = ?'); values.push(time_limit); }
        if (passing_score !== undefined) { updates.push('passing_score = ?'); values.push(passing_score); }
        if (max_attempts !== undefined) { updates.push('max_attempts = ?'); values.push(max_attempts); }
        if (is_published !== undefined) { updates.push('is_published = ?'); values.push(is_published ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);

        run(
            `UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedQuiz = get('SELECT * FROM quizzes WHERE id = ?', [id]);

        res.json({
            message: 'Quiz updated successfully',
            quiz: updatedQuiz
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ error: 'Server error updating quiz' });
    }
}

/**
 * Delete quiz
 */
export function deleteQuiz(req, res) {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        // Verify ownership
        const quiz = get('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?', [id, teacherId]);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found or not authorized' });
        }

        run('DELETE FROM quizzes WHERE id = ?', [id]);

        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ error: 'Server error deleting quiz' });
    }
}

/**
 * Add question to quiz
 */
export function addQuestion(req, res) {
    try {
        const { quizId } = req.params;
        const teacherId = req.user.id;
        const {
            question_text,
            question_type = 'multiple_choice',
            points = 1.0,
            difficulty_level = 'medium',
            options = []
        } = req.body;

        // Verify quiz ownership
        const quiz = get('SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?', [quizId, teacherId]);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found or not authorized' });
        }

        if (!question_text) {
            return res.status(400).json({ error: 'Question text is required' });
        }

        // Get next order number
        const lastQuestion = get(
            'SELECT MAX(order_num) as max_order FROM questions WHERE quiz_id = ?',
            [quizId]
        );
        const order_num = (lastQuestion?.max_order || 0) + 1;

        // Use transaction for atomic operation
        const addQuestionTx = transaction(() => {
            // Insert question
            const questionResult = run(
                `INSERT INTO questions (quiz_id, question_text, question_type, points, difficulty_level, order_num)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [quizId, question_text, question_type, points, difficulty_level, order_num]
            );

            const questionId = questionResult.lastInsertRowid;

            // Insert answer options if provided
            if (options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    run(
                        `INSERT INTO answer_options (question_id, option_text, is_correct, order_num)
                         VALUES (?, ?, ?, ?)`,
                        [questionId, option.text, option.is_correct ? 1 : 0, i]
                    );
                }
            }

            return questionId;
        });

        const questionId = addQuestionTx();

        // Get the complete question with options
        const question = get('SELECT * FROM questions WHERE id = ?', [questionId]);
        question.options = all('SELECT * FROM answer_options WHERE question_id = ?', [questionId]);

        res.status(201).json({
            message: 'Question added successfully',
            question
        });
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({ error: 'Server error adding question' });
    }
}

/**
 * Update question
 */
export function updateQuestion(req, res) {
    try {
        const { questionId } = req.params;
        const teacherId = req.user.id;
        const { question_text, question_type, points, difficulty_level, options } = req.body;

        // Verify ownership through quiz
        const question = get(
            `SELECT q.* FROM questions q
             JOIN quizzes qz ON qz.id = q.quiz_id
             WHERE q.id = ? AND qz.teacher_id = ?`,
            [questionId, teacherId]
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found or not authorized' });
        }

        // Update question
        const updates = [];
        const values = [];

        if (question_text !== undefined) { updates.push('question_text = ?'); values.push(question_text); }
        if (question_type !== undefined) { updates.push('question_type = ?'); values.push(question_type); }
        if (points !== undefined) { updates.push('points = ?'); values.push(points); }
        if (difficulty_level !== undefined) { updates.push('difficulty_level = ?'); values.push(difficulty_level); }

        if (updates.length > 0) {
            values.push(questionId);
            run(
                `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // Update options if provided
        if (options) {
            const updateOptionsTx = transaction(() => {
                // Delete existing options
                run('DELETE FROM answer_options WHERE question_id = ?', [questionId]);

                // Insert new options
                for (let i = 0; i < options.length; i++) {
                    const option = options[i];
                    run(
                        `INSERT INTO answer_options (question_id, option_text, is_correct, order_num)
                         VALUES (?, ?, ?, ?)`,
                        [questionId, option.text, option.is_correct ? 1 : 0, i]
                    );
                }
            });

            updateOptionsTx();
        }

        // Get updated question
        const updatedQuestion = get('SELECT * FROM questions WHERE id = ?', [questionId]);
        updatedQuestion.options = all('SELECT * FROM answer_options WHERE question_id = ?', [questionId]);

        res.json({
            message: 'Question updated successfully',
            question: updatedQuestion
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ error: 'Server error updating question' });
    }
}

/**
 * Delete question
 */
export function deleteQuestion(req, res) {
    try {
        const { questionId } = req.params;
        const teacherId = req.user.id;

        // Verify ownership
        const question = get(
            `SELECT q.* FROM questions q
             JOIN quizzes qz ON qz.id = q.quiz_id
             WHERE q.id = ? AND qz.teacher_id = ?`,
            [questionId, teacherId]
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found or not authorized' });
        }

        run('DELETE FROM questions WHERE id = ?', [questionId]);

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Server error deleting question' });
    }
}
