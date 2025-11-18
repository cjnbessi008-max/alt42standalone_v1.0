const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

// Get dashboard overview for teachers
router.get('/overview', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { contextId } = req.query;

        // Get student performance summary
        let summaryQuery = `
            SELECT * FROM student_performance_summary
        `;

        const params = [];
        if (contextId) {
            summaryQuery += ` WHERE user_id IN (
                SELECT DISTINCT user_id FROM sessions WHERE context_id = $1
            )`;
            params.push(contextId);
        }

        summaryQuery += ` ORDER BY avg_stamina_score DESC`;

        const result = await query(summaryQuery, params);

        res.json({
            success: true,
            students: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get detailed student analysis
router.get('/student/:userId', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get student info
        const userResult = await query(
            'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        // Get recent sessions
        const sessionsResult = await query(
            `SELECT * FROM sessions
             WHERE user_id = $1
             ORDER BY started_at DESC
             LIMIT 10`,
            [userId]
        );

        // Get stamina trends
        const trendsResult = await query(
            `SELECT * FROM recent_stamina_trends
             WHERE user_id = $1
             AND session_rank <= 10
             ORDER BY started_at DESC`,
            [userId]
        );

        // Get performance stats
        const statsResult = await query(
            `SELECT
                AVG(mental_stamina_score) as avg_stamina,
                AVG(total_questions::float / NULLIF(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60, 0)) as questions_per_minute,
                COUNT(*) as total_sessions
             FROM sessions
             WHERE user_id = $1
             AND ended_at IS NOT NULL`,
            [userId]
        );

        res.json({
            success: true,
            student: userResult.rows[0],
            recentSessions: sessionsResult.rows,
            staminaTrends: trendsResult.rows,
            stats: statsResult.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get class-wide statistics
router.get('/class-stats', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { contextId } = req.query;

        let statsQuery = `
            SELECT
                COUNT(DISTINCT s.user_id) as total_students,
                COUNT(DISTINCT s.id) as total_sessions,
                AVG(s.mental_stamina_score) as avg_stamina_score,
                SUM(s.total_questions) as total_questions,
                AVG(s.total_questions::float / NULLIF(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60, 0)) as avg_questions_per_minute,
                SUM(CASE WHEN s.fatigue_level = 'critical' THEN 1 ELSE 0 END) as critical_fatigue_count,
                SUM(CASE WHEN s.fatigue_level = 'high' THEN 1 ELSE 0 END) as high_fatigue_count
            FROM sessions s
            WHERE s.ended_at IS NOT NULL
        `;

        const params = [];
        if (contextId) {
            statsQuery += ' AND s.context_id = $1';
            params.push(contextId);
        }

        const result = await query(statsQuery, params);

        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get fatigue alerts (students who need attention)
router.get('/alerts', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { contextId } = req.query;

        let alertsQuery = `
            SELECT
                u.id as user_id,
                u.full_name,
                u.email,
                s.id as session_id,
                s.started_at,
                s.fatigue_level,
                s.mental_stamina_score,
                sm.break_urgency
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN stamina_metrics sm ON s.id = sm.session_id
            WHERE s.fatigue_level IN ('high', 'critical')
            OR sm.break_urgency IN ('recommended', 'required')
        `;

        const params = [];
        if (contextId) {
            alertsQuery += ' AND s.context_id = $1';
            params.push(contextId);
        }

        alertsQuery += ' ORDER BY s.started_at DESC LIMIT 20';

        const result = await query(alertsQuery, params);

        res.json({
            success: true,
            alerts: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Log dashboard access
router.post('/access-log', authenticateToken, requireTeacher, async (req, res) => {
    try {
        const { contextId } = req.body;
        const teacherId = req.user.userId;

        await query(
            'INSERT INTO dashboard_access (teacher_id, context_id) VALUES ($1, $2)',
            [teacherId, contextId]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
