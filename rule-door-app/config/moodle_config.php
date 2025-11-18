<?php
/**
 * Rule Door - Moodle Integration Configuration
 * Compatible with Moodle 3.7
 */

class MoodleConfig {
    // Moodle installation path (adjust based on your setup)
    const MOODLE_PATH = '/var/www/html/moodle';

    // Moodle web URL
    const MOODLE_URL = 'http://localhost/moodle';

    // Moodle database configuration (typically same as Moodle's config.php)
    const MOODLE_DB_HOST = 'localhost';
    const MOODLE_DB_NAME = 'moodle';
    const MOODLE_DB_USER = 'moodle_user';
    const MOODLE_DB_PASS = 'moodle_pass';
    const MOODLE_DB_PREFIX = 'mdl_';

    // API settings
    const API_ENABLED = true;
    const API_KEY = 'your-secure-api-key-here';

    // Session settings
    const SESSION_TIMEOUT = 3600; // 1 hour

    /**
     * Load Moodle configuration
     */
    public static function loadMoodleConfig() {
        $config_path = self::MOODLE_PATH . '/config.php';

        if (file_exists($config_path)) {
            require_once($config_path);
            return true;
        }

        return false;
    }

    /**
     * Get Moodle database connection
     */
    public static function getMoodleDB() {
        try {
            $dsn = "mysql:host=" . self::MOODLE_DB_HOST . ";dbname=" . self::MOODLE_DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];

            return new PDO($dsn, self::MOODLE_DB_USER, self::MOODLE_DB_PASS, $options);
        } catch(PDOException $e) {
            error_log("Moodle DB Connection Error: " . $e->getMessage());
            return null;
        }
    }
}
