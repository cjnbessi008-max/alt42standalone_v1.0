/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/guest', AuthController.guestLogin);

// Protected routes
router.get('/me', authMiddleware, AuthController.getCurrentUser);

module.exports = router;
