const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/personalized', authMiddleware, (req, res) => {
    res.json({ success: true, profile: { level: 1, strengths: [], weaknesses: [] } });
});

router.post('/update-profile', authMiddleware, (req, res) => {
    res.json({ success: true, message: 'Profile updated' });
});

module.exports = router;
