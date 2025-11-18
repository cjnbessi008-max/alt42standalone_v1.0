<?php
/**
 * Database Configuration
 * Focus Highlights System
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'focus_highlights');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Database connection options
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

// Timezone
date_default_timezone_set('Asia/Seoul');
