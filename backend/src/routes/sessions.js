const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Start a new learning session
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { courseId, contextId } = req.body;
        const userId = req.user.userId;

        const result = await query(
            `INSERT INTO sessions (user_id, course_id, context_id, started_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [userId, courseId, contextId]
        );

        res.json({
            success: true,
            session: {
                id: result.rows[0].id,
                userId: result.rows[0].user_id,
                courseId: result.rows[0].course_id,
                startedAt: result.rows[0].started_at
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// End a session and calculate final metrics
router.post('/:sessionId/end', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId;

        const sessionResult = await query(
            'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        // Calculate final metrics
        const metricsResult = await query(
            `SELECT
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
                AVG(response_time_ms) as avg_response_time,
                AVG(confidence_score) as avg_confidence
             FROM responses r
             JOIN questions q ON r.question_id = q.id
             WHERE q.session_id = $1`,
            [sessionId]
        );

        const metrics = metricsResult.rows[0];

        // Calculate mental stamina score (0-100)
        const accuracyScore = (metrics.correct_answers / metrics.total_questions) * 100;
        const speedScore = Math.max(0, 100 - (metrics.avg_response_time / 1000)); // Penalize slow responses
        const confidenceScore = parseFloat(metrics.avg_confidence) || 50;

        const mentalStaminaScore = (accuracyScore * 0.5 + speedScore * 0.3 + confidenceScore * 0.2);

        // Determine fatigue level
        let fatigueLevel = 'low';
        if (mentalStaminaScore < 40) fatigueLevel = 'critical';
        else if (mentalStaminaScore < 60) fatigueLevel = 'high';
        else if (mentalStaminaScore < 75) fatigueLevel = 'medium';

        // Update session
        await query(
            `UPDATE sessions
             SET ended_at = NOW(),
                 total_questions = $1,
                 correct_answers = $2,
                 mental_stamina_score = $3,
                 fatigue_level = $4
             WHERE id = $5`,
            [
                metrics.total_questions,
                metrics.correct_answers,
                mentalStaminaScore.toFixed(2),
                fatigueLevel,
                sessionId
            ]
        );

        res.json({
            success: true,
            session: {
                id: sessionId,
                totalQuestions: metrics.total_questions,
                correctAnswers: metrics.correct_answers,
                mentalStaminaScore: mentalStaminaScore.toFixed(2),
                fatigueLevel,
                avgResponseTime: metrics.avg_response_time
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get session details
router.get('/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT s.*, u.full_name, u.email
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.id = $1`,
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.json({
            success: true,
            session: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user's session history
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const result = await query(
            `SELECT * FROM sessions
             WHERE user_id = $1
             ORDER BY started_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({
            success: true,
            sessions: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
