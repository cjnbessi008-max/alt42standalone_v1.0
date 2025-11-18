<?php
/**
 * Rhythm Seq - Moodle Integration Configuration
 *
 * Configuration file for connecting to Moodle 3.7 database
 * MySQL 5.7, PHP 7.1.9
 */

// Moodle Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_password');
define('DB_PREFIX', 'mdl_'); // Default Moodle table prefix

// Application Settings
define('APP_NAME', 'Rhythm Seq');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

// Database Connection
function get_db_connection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        if (DEBUG_MODE) {
            die("Database Connection Failed: " . $e->getMessage());
        } else {
            die("Database Connection Failed. Please contact administrator.");
        }
    }
}

// Error Handling
function handle_error($message) {
    if (DEBUG_MODE) {
        error_log($message);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'An error occurred. Please try again.'
        ]);
    }
}

// CORS Headers (for AJAX requests)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
?>
