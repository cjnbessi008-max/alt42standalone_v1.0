<?php
/**
 * Absolute Mirror - Database Configuration
 * Compatible with MySQL 5.7 and PHP 7.1.9
 */

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'absolute_mirror');
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
 */
function getDBConnection($useMoodle = false) {
    $host = $useMoodle ? MOODLE_DB_HOST : DB_HOST;
    $port = $useMoodle ? MOODLE_DB_PORT : DB_PORT;
    $dbname = $useMoodle ? MOODLE_DB_NAME : DB_NAME;
    $user = $useMoodle ? MOODLE_DB_USER : DB_USER;
    $pass = $useMoodle ? MOODLE_DB_PASS : DB_PASS;

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=" . DB_CHARSET;

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed'
        ]);
        exit;
    }
}

/**
 * Execute a query and return results
 */
function executeQuery($sql, $params = [], $useMoodle = false) {
    $pdo = getDBConnection($useMoodle);

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch (PDOException $e) {
        error_log("Query execution failed: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Send JSON response
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Validate session and get user info
 */
function validateSession() {
    session_start();

    if (!isset($_SESSION['user_id'])) {
        sendJSON([
            'success' => false,
            'error' => 'Unauthorized'
        ], 401);
    }

    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? '',
        'role' => $_SESSION['role'] ?? 'student'
    ];
}
