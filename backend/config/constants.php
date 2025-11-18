<?php
/**
 * Application Constants
 * Shift Trail Web App Configuration
 */

// Application Information
define('APP_NAME', 'Shift Trail');
define('APP_VERSION', '1.0.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// API Configuration
define('API_PREFIX', '/api');
define('API_VERSION', 'v1');

// Moodle Integration
define('MOODLE_URL', getenv('MOODLE_URL') ?: 'http://localhost/moodle');
define('MOODLE_VERSION', '3.7');
define('MOODLE_TOKEN', getenv('MOODLE_TOKEN') ?: '');

// Trail Settings
define('TRAIL_DEFAULT_COLOR', '#3498db');
define('TRAIL_DEFAULT_WIDTH', 3);
define('TRAIL_ANIMATION_DURATION', 1000); // milliseconds
define('TRAIL_MAX_POINTS', 1000); // Maximum trail points to record
define('TRAIL_SAMPLING_INTERVAL', 50); // milliseconds between trail point samples

// Grid and Canvas Settings
define('GRID_SIZE', 20);
define('CANVAS_WIDTH', 600);
define('CANVAS_HEIGHT', 600);

// Smartphone Display Settings
define('SMARTPHONE_WIDTH', 375); // iPhone X width
define('SMARTPHONE_HEIGHT', 667); // iPhone X height
define('SMARTPHONE_SCALE', 1.0);

// Problem Settings
define('MAX_ATTEMPTS', 3);
define('DEFAULT_TIME_LIMIT', 300); // 5 minutes
define('DEFAULT_POINTS', 10);

// Session Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_COOKIE_NAME', 'shift_trail_session');

// CORS Configuration
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ALLOWED_ORIGINS') ?: '*');

// Logging
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO');
define('LOG_PATH', __DIR__ . '/../../logs/');

// Error Handling
define('DISPLAY_ERRORS', APP_ENV === 'development');
define('LOG_ERRORS', true);

// File Paths
define('ROOT_PATH', dirname(__DIR__, 2));
define('BACKEND_PATH', ROOT_PATH . '/backend');
define('FRONTEND_PATH', ROOT_PATH . '/frontend');
define('UPLOAD_PATH', ROOT_PATH . '/uploads');

// HTTP Status Codes
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_INTERNAL_ERROR', 500);

// Problem Types
define('PROBLEM_TYPE_TRANSLATION', 'vector_translation');
define('PROBLEM_TYPE_ADDITION', 'vector_addition');
define('PROBLEM_TYPE_SUBTRACTION', 'vector_subtraction');
define('PROBLEM_TYPE_ROTATION', 'vector_rotation');

// Difficulty Levels
define('DIFFICULTY_EASY', 'easy');
define('DIFFICULTY_MEDIUM', 'medium');
define('DIFFICULTY_HARD', 'hard');

// Interaction Types
define('INTERACTION_START_DRAG', 'start_drag');
define('INTERACTION_DRAG_MOVE', 'drag_move');
define('INTERACTION_END_DRAG', 'end_drag');
define('INTERACTION_CLICK', 'click');
define('INTERACTION_ROTATE', 'rotate');
define('INTERACTION_SCALE', 'scale');
define('INTERACTION_RESET', 'reset');
define('INTERACTION_ANIMATE', 'animate');
