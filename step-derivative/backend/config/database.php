<?php
/**
 * Database Configuration for Step Derivative
 * Compatible with MySQL 5.7 and PHP 7.1.9
 */

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'step_derivative');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Get database connection using PDO
 *
 * @return PDO Database connection object
 * @throws PDOException if connection fails
 */
function getDatabaseConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new PDOException("Database connection failed", 500);
        }
    }

    return $pdo;
}

/**
 * Test database connection
 *
 * @return bool True if connection successful
 */
function testDatabaseConnection() {
    try {
        $pdo = getDatabaseConnection();
        $stmt = $pdo->query("SELECT 1");
        return $stmt !== false;
    } catch (PDOException $e) {
        error_log("Database test failed: " . $e->getMessage());
        return false;
    }
}
