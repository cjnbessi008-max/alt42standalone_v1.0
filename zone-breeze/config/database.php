<?php
/**
 * Zone Breeze - Database Configuration
 *
 * MySQL database connection settings
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'zone_breeze');
define('DB_USER', 'zone_breeze_user');
define('DB_PASS', 'your_secure_password'); // Change this in production
define('DB_CHARSET', 'utf8mb4');

// Connection options
define('DB_PERSISTENT', false);
define('DB_TIMEOUT', 30);

/**
 * Get database connection
 *
 * @return PDO Database connection object
 * @throws PDOException
 */
function getDbConnection() {
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
                PDO::ATTR_PERSISTENT => DB_PERSISTENT,
                PDO::ATTR_TIMEOUT => DB_TIMEOUT
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new PDOException('Database connection failed');
        }
    }

    return $pdo;
}

/**
 * Execute a prepared statement with parameters
 *
 * @param string $sql SQL query
 * @param array $params Query parameters
 * @return PDOStatement
 */
function executeQuery($sql, $params = []) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

/**
 * Fetch single row
 *
 * @param string $sql SQL query
 * @param array $params Query parameters
 * @return array|false
 */
function fetchOne($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetch();
}

/**
 * Fetch all rows
 *
 * @param string $sql SQL query
 * @param array $params Query parameters
 * @return array
 */
function fetchAll($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetchAll();
}

/**
 * Get last insert ID
 *
 * @return string
 */
function getLastInsertId() {
    return getDbConnection()->lastInsertId();
}

/**
 * Begin transaction
 */
function beginTransaction() {
    getDbConnection()->beginTransaction();
}

/**
 * Commit transaction
 */
function commit() {
    getDbConnection()->commit();
}

/**
 * Rollback transaction
 */
function rollback() {
    getDbConnection()->rollBack();
}
