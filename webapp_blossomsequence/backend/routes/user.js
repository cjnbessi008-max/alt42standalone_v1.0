const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { promisePool } = require('../../config/database');

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [users] = await promisePool.execute(
            'SELECT total_completed, avg_accuracy, current_level, total_time FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json({ success: true, ...users[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
