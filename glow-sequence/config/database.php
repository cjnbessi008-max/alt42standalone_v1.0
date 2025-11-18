<?php
/**
 * Database Configuration for Glow Sequence
 * MySQL 5.7 Connection Settings
 */

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'glow_sequence_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// Moodle database configuration (for integration)
define('MOODLE_DB_HOST', getenv('MOODLE_DB_HOST') ?: 'localhost');
define('MOODLE_DB_PORT', getenv('MOODLE_DB_PORT') ?: '3306');
define('MOODLE_DB_NAME', getenv('MOODLE_DB_NAME') ?: 'moodle');
define('MOODLE_DB_USER', getenv('MOODLE_DB_USER') ?: 'root');
define('MOODLE_DB_PASS', getenv('MOODLE_DB_PASS') ?: '');
define('MOODLE_DB_PREFIX', getenv('MOODLE_DB_PREFIX') ?: 'mdl_');

/**
 * Get database connection
 * @return mysqli
 * @throws Exception
 */
function getDbConnection() {
    static $connection = null;

    if ($connection === null) {
        $connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

        if ($connection->connect_error) {
            error_log("Database connection failed: " . $connection->connect_error);
            throw new Exception("Database connection failed: " . $connection->connect_error);
        }

        // Set charset
        if (!$connection->set_charset(DB_CHARSET)) {
            error_log("Error loading character set " . DB_CHARSET . ": " . $connection->error);
        }

        // Set timezone
        $connection->query("SET time_zone = '+00:00'");
    }

    return $connection;
}

/**
 * Get Moodle database connection
 * @return mysqli
 * @throws Exception
 */
function getMoodleDbConnection() {
    static $connection = null;

    if ($connection === null) {
        $connection = new mysqli(
            MOODLE_DB_HOST,
            MOODLE_DB_USER,
            MOODLE_DB_PASS,
            MOODLE_DB_NAME,
            MOODLE_DB_PORT
        );

        if ($connection->connect_error) {
            error_log("Moodle database connection failed: " . $connection->connect_error);
            throw new Exception("Moodle database connection failed: " . $connection->connect_error);
        }

        if (!$connection->set_charset(DB_CHARSET)) {
            error_log("Error loading character set " . DB_CHARSET . ": " . $connection->error);
        }
    }

    return $connection;
}

/**
 * Close database connection
 */
function closeDbConnection() {
    $connection = getDbConnection();
    if ($connection) {
        $connection->close();
    }
}

/**
 * Execute prepared statement safely
 * @param string $sql SQL query with placeholders
 * @param array $params Parameters to bind
 * @param string $types Parameter types (s=string, i=integer, d=double, b=blob)
 * @return mysqli_result|bool
 */
function executePreparedStatement($sql, $params = [], $types = '') {
    $connection = getDbConnection();
    $stmt = $connection->prepare($sql);

    if (!$stmt) {
        error_log("Prepare failed: " . $connection->error);
        return false;
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $result = $stmt->execute();

    if (!$result) {
        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }

    $queryResult = $stmt->get_result();
    $stmt->close();

    return $queryResult;
}

/**
 * Sanitize input to prevent SQL injection
 * @param string $input
 * @return string
 */
function sanitizeInput($input) {
    $connection = getDbConnection();
    return $connection->real_escape_string(trim($input));
}

/**
 * Return JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Return error response
 * @param string $message
 * @param int $statusCode
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}

/**
 * Return success response
 * @param mixed $data
 * @param string $message
 */
function successResponse($data, $message = 'Success') {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], 200);
}

// Error handling
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("Error [$errno]: $errstr in $errfile on line $errline");
    return false;
});

// Exception handling
set_exception_handler(function($exception) {
    error_log("Uncaught exception: " . $exception->getMessage());
    errorResponse("An error occurred: " . $exception->getMessage(), 500);
});
