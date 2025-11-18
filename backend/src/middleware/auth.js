const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No authentication token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}

// Middleware to require teacher role
function requireTeacher(req, res, next) {
    if (req.user.role !== 'teacher') {
        return res.status(403).json({
            success: false,
            error: 'Teacher access required'
        });
    }
    next();
}

// Middleware to require student role
function requireStudent(req, res, next) {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            error: 'Student access required'
        });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireTeacher,
    requireStudent
};
