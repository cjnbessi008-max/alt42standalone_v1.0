<?php
/**
 * Example Database Configuration for Moodle LMS Integration
 *
 * IMPORTANT: Copy this file to database.php and update with your actual credentials
 *
 * cp config/database.example.php config/database.php
 */

// Moodle Database Configuration
define('DB_HOST', 'localhost');                    // Database host (usually 'localhost')
define('DB_NAME', 'moodle');                       // Moodle database name
define('DB_USER', 'moodle_user');                  // Database username
define('DB_PASS', 'your_secure_password_here');    // Database password
define('DB_PREFIX', 'mdl_');                       // Moodle table prefix (default: mdl_)
define('DB_CHARSET', 'utf8mb4');                   // Character set

// App-specific tables (automatically created by setup script)
define('TABLE_DERIVATIVE_CARDS', DB_PREFIX . 'derivative_cards');
define('TABLE_STUDENT_PROGRESS', DB_PREFIX . 'derivative_student_progress');
define('TABLE_CARD_EVENTS', DB_PREFIX . 'derivative_card_events');

/**
 * Get database connection
 */
function getDatabaseConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed');
        }
    }

    return $pdo;
}

function executeQuery($sql, $params = []) {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function fetchOne($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetch();
}

function fetchAll($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetchAll();
}

function insert($sql, $params = []) {
    executeQuery($sql, $params);
    return getDatabaseConnection()->lastInsertId();
}

function closeDatabaseConnection() {
    $pdo = null;
}
?>
