<?php
/**
 * Database Configuration
 * MySQL 5.7 연결 설정
 */

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'termmotion');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle database configuration (if separate)
define('MOODLE_DB_HOST', getenv('MOODLE_DB_HOST') ?: 'localhost');
define('MOODLE_DB_NAME', getenv('MOODLE_DB_NAME') ?: 'moodle');
define('MOODLE_DB_USER', getenv('MOODLE_DB_USER') ?: 'root');
define('MOODLE_DB_PASS', getenv('MOODLE_DB_PASS') ?: '');
define('MOODLE_DB_PREFIX', 'mdl_');

/**
 * Get database connection
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    return $pdo;
}

/**
 * Get Moodle database connection
 */
function getMoodleDbConnection() {
    static $moodlePdo = null;

    if ($moodlePdo === null) {
        try {
            $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $moodlePdo = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Moodle database connection failed: " . $e->getMessage());
            throw new Exception("Moodle database connection failed");
        }
    }

    return $moodlePdo;
}
