const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.post('/generate', authMiddleware, (req, res) => {
    const { sequenceType, difficulty, petalCount } = req.body;
    res.json({ success: true, sequenceType, difficulty, petalCount, reason: 'Generated problem' });
});

router.get('/recommend', authMiddleware, (req, res) => {
    res.json({ success: true, sequenceType: 'fibonacci', difficulty: 2, petalCount: 8, reason: 'AI recommendation' });
});

module.exports = router;
