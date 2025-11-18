<?php
/**
 * Database Configuration Example
 *
 * Copy this file to database.php and update with your actual credentials
 *
 * IMPORTANT: Never commit database.php to version control
 * Add it to .gitignore to keep credentials secure
 */

// Database credentials
define('DB_HOST', 'localhost');           // Database host
define('DB_NAME', 'moodle');             // Database name
define('DB_USER', 'moodle_user');        // Database username
define('DB_PASS', 'your_password_here'); // Database password
define('DB_PORT', '3306');               // Database port
define('DB_CHARSET', 'utf8mb4');         // Character set

/**
 * Example configurations for different environments:
 *
 * === Local Development ===
 * define('DB_HOST', 'localhost');
 * define('DB_NAME', 'moodle_dev');
 * define('DB_USER', 'root');
 * define('DB_PASS', 'root');
 *
 * === Production ===
 * define('DB_HOST', 'db.example.com');
 * define('DB_NAME', 'moodle_prod');
 * define('DB_USER', 'moodle_prod_user');
 * define('DB_PASS', 'secure_password_here');
 *
 * === Docker ===
 * define('DB_HOST', 'mysql');  // Docker service name
 * define('DB_NAME', 'moodle');
 * define('DB_USER', 'moodle');
 * define('DB_PASS', getenv('MYSQL_PASSWORD'));
 */

/**
 * Create a database connection
 * @return mysqli Database connection object
 * @throws Exception if connection fails
 */
function getDatabaseConnection() {
    static $connection = null;

    if ($connection === null) {
        // Create connection
        $connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

        // Check connection
        if ($connection->connect_error) {
            error_log("Database connection failed: " . $connection->connect_error);
            throw new Exception("Database connection failed");
        }

        // Set charset
        if (!$connection->set_charset(DB_CHARSET)) {
            error_log("Error setting charset: " . $connection->error);
        }
    }

    return $connection;
}

/**
 * Close the database connection
 */
function closeDatabaseConnection() {
    global $connection;
    if ($connection !== null) {
        $connection->close();
        $connection = null;
    }
}

/**
 * Execute a prepared statement safely
 * @param mysqli $conn Database connection
 * @param string $sql SQL query with placeholders
 * @param string $types Parameter types (e.g., 'si' for string, integer)
 * @param array $params Parameters to bind
 * @return mysqli_result|bool Query result
 */
function executeQuery($conn, $sql, $types = '', $params = []) {
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        return false;
    }

    if (!empty($types) && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    if (!$stmt->execute()) {
        error_log("Execute failed: " . $stmt->error);
        $stmt->close();
        return false;
    }

    $result = $stmt->get_result();
    $stmt->close();

    return $result;
}

/**
 * Send JSON response
 * @param array $data Response data
 * @param int $statusCode HTTP status code
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendErrorResponse($message, $statusCode = 500) {
    sendJsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Validate integer parameter
 * @param mixed $value Value to validate
 * @param string $name Parameter name for error messages
 * @return int Validated integer
 */
function validateIntParam($value, $name) {
    if (!is_numeric($value)) {
        sendErrorResponse("Invalid {$name}: must be a number", 400);
    }
    return intval($value);
}

// Set error reporting for development
// Comment out in production
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php-error.log');
