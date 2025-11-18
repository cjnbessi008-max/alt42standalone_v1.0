<?php
/**
 * Database Configuration
 * Compatible with MySQL 5.7
 */

// Database credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'solid_spin_viewer');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle database configuration (if separate)
define('MOODLE_DB_HOST', getenv('MOODLE_DB_HOST') ?: 'localhost');
define('MOODLE_DB_PORT', getenv('MOODLE_DB_PORT') ?: '3306');
define('MOODLE_DB_NAME', getenv('MOODLE_DB_NAME') ?: 'moodle');
define('MOODLE_DB_USER', getenv('MOODLE_DB_USER') ?: 'root');
define('MOODLE_DB_PASS', getenv('MOODLE_DB_PASS') ?: '');
define('MOODLE_DB_PREFIX', getenv('MOODLE_DB_PREFIX') ?: 'mdl_');

// Application settings
define('APP_DEBUG', getenv('APP_DEBUG') === 'true');
define('APP_TIMEZONE', 'Asia/Seoul');

// CORS settings
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: '*');

// Session settings
define('SESSION_LIFETIME', 7200); // 2 hours
