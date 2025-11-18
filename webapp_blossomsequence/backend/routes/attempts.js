const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { promisePool } = require('../../config/database');

router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const { userId, sequenceType, difficulty, correctCount, totalAttempts, accuracy, totalTime } = req.body;
        
        const [result] = await promisePool.execute(
            'INSERT INTO attempts (user_id, sequence_type, difficulty, correct_count, total_questions, accuracy, time_spent, completed) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)',
            [req.user.id, sequenceType, difficulty, correctCount, totalAttempts, accuracy, totalTime]
        );

        await promisePool.execute(
            'UPDATE users SET total_completed = total_completed + 1, total_time = total_time + ?, avg_accuracy = (avg_accuracy * total_completed + ?) / (total_completed + 1) WHERE id = ?',
            [totalTime, accuracy, req.user.id]
        );

        res.json({ success: true, attemptId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const [attempts] = await promisePool.execute(
            'SELECT * FROM attempts WHERE user_id = ? ORDER BY started_at DESC LIMIT ?',
            [req.user.id, limit]
        );
        res.json({ success: true, attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
