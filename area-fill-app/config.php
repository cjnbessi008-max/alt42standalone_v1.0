<?php
/**
 * Area Fill Animation App - Moodle Database Configuration
 *
 * This file contains database connection settings for Moodle 3.7
 * MySQL 5.7, PHP 7.1.9 compatible
 */

// Prevent direct access
defined('AREA_FILL_APP') or define('AREA_FILL_APP', true);

// Moodle Database Configuration
define('DB_HOST', 'localhost');           // Database host
define('DB_NAME', 'moodle');              // Moodle database name
define('DB_USER', 'moodleuser');          // Database username
define('DB_PASS', 'moodlepass');          // Database password
define('DB_CHARSET', 'utf8mb4');          // Character set
define('DB_PREFIX', 'mdl_');              // Moodle table prefix (default: mdl_)

// Application Settings
define('APP_DEBUG', true);                 // Debug mode (set to false in production)
define('APP_TIMEZONE', 'Asia/Seoul');      // Timezone for KAIST

// Animation Settings
define('ANIMATION_DURATION', 3000);        // Default animation duration in milliseconds
define('ANIMATION_FPS', 60);               // Frames per second for smooth animation

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

/**
 * Get database connection
 *
 * @return mysqli Database connection object
 * @throws Exception if connection fails
 */
function getDBConnection() {
    static $connection = null;

    if ($connection === null) {
        // Create connection
        $connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        // Check connection
        if ($connection->connect_error) {
            if (APP_DEBUG) {
                throw new Exception("Database connection failed: " . $connection->connect_error);
            } else {
                throw new Exception("Database connection failed");
            }
        }

        // Set charset
        $connection->set_charset(DB_CHARSET);
    }

    return $connection;
}

/**
 * Close database connection
 */
function closeDBConnection() {
    global $connection;
    if ($connection !== null) {
        $connection->close();
        $connection = null;
    }
}

/**
 * Sanitize input data
 *
 * @param string $data Input data to sanitize
 * @return string Sanitized data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Get Moodle table name with prefix
 *
 * @param string $table Table name without prefix
 * @return string Full table name with prefix
 */
function getTableName($table) {
    return DB_PREFIX . $table;
}
