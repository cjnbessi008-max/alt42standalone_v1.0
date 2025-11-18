const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/performance', authMiddleware, (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;
