const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get real-time stamina metrics for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT * FROM stamina_metrics
             WHERE session_id = $1
             ORDER BY sequence_number DESC
             LIMIT 1`,
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                metrics: null,
                message: 'No metrics available yet'
            });
        }

        res.json({
            success: true,
            metrics: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get stamina trend for a session
router.get('/session/:sessionId/trend', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT * FROM stamina_metrics
             WHERE session_id = $1
             ORDER BY sequence_number`,
            [sessionId]
        );

        res.json({
            success: true,
            trend: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user's stamina history across all sessions
router.get('/user/:userId/history', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 30;

        const result = await query(
            `SELECT
                s.id as session_id,
                s.started_at,
                s.mental_stamina_score,
                s.fatigue_level,
                s.total_questions,
                s.correct_answers
             FROM sessions s
             WHERE s.user_id = $1
             AND s.mental_stamina_score IS NOT NULL
             ORDER BY s.started_at DESC
             LIMIT $2`,
            [userId, limit]
        );

        res.json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get stamina statistics for a user
router.get('/user/:userId/stats', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT
                COUNT(DISTINCT s.id) as total_sessions,
                AVG(s.mental_stamina_score) as avg_stamina_score,
                MAX(s.mental_stamina_score) as max_stamina_score,
                MIN(s.mental_stamina_score) as min_stamina_score,
                SUM(s.total_questions) as total_questions,
                SUM(s.correct_answers) as total_correct,
                AVG(sm.avg_response_time_ms) as avg_response_time,
                AVG(sm.fatigue_index) as avg_fatigue_index
             FROM sessions s
             LEFT JOIN stamina_metrics sm ON s.id = sm.session_id
             WHERE s.user_id = $1
             AND s.mental_stamina_score IS NOT NULL`,
            [userId]
        );

        const stats = result.rows[0];
        const accuracyRate = stats.total_questions > 0
            ? (stats.total_correct / stats.total_questions * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            stats: {
                totalSessions: parseInt(stats.total_sessions) || 0,
                avgStaminaScore: parseFloat(stats.avg_stamina_score)?.toFixed(2) || 0,
                maxStaminaScore: parseFloat(stats.max_stamina_score)?.toFixed(2) || 0,
                minStaminaScore: parseFloat(stats.min_stamina_score)?.toFixed(2) || 0,
                totalQuestions: parseInt(stats.total_questions) || 0,
                totalCorrect: parseInt(stats.total_correct) || 0,
                accuracyRate,
                avgResponseTime: parseFloat(stats.avg_response_time)?.toFixed(2) || 0,
                avgFatigueIndex: parseFloat(stats.avg_fatigue_index)?.toFixed(2) || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
