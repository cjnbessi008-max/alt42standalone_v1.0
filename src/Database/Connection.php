<?php
/**
 * Database Connection Class
 * Singleton pattern for Moodle MySQL database connection
 *
 * Compatible with:
 * - MySQL 5.7+
 * - PHP 7.1.9+
 * - PDO with prepared statements for security
 */

namespace ALT42\Database;

use PDO;
use PDOException;
use Exception;

class Connection {
    private static $instance = null;
    private $pdo = null;
    private $config = null;

    /**
     * Private constructor (Singleton pattern)
     */
    private function __construct() {
        $this->config = require __DIR__ . '/../../config/config.php';
        $this->connect();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Establish database connection
     */
    private function connect() {
        $db = $this->config['database'];

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $db['host'],
                $db['port'],
                $db['name'],
                $db['charset']
            );

            $this->pdo = new PDO($dsn, $db['user'], $db['pass'], $db['options']);

            // Set timezone
            $this->pdo->exec("SET time_zone = '+09:00'");

        } catch (PDOException $e) {
            $this->handleError($e);
        }
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        // Check connection health
        try {
            $this->pdo->query('SELECT 1');
        } catch (PDOException $e) {
            // Reconnect if connection lost
            $this->connect();
        }

        return $this->pdo;
    }

    /**
     * Get database table prefix
     */
    public function getPrefix() {
        return $this->config['database']['prefix'];
    }

    /**
     * Execute a prepared statement
     *
     * @param string $sql SQL query with placeholders
     * @param array $params Parameters to bind
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleError($e);
        }
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->pdo->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->pdo->rollBack();
    }

    /**
     * Handle database errors
     */
    private function handleError(PDOException $e) {
        $config = $this->config['app'];

        if ($config['debug']) {
            throw new Exception(
                "Database Error: " . $e->getMessage() . "\n" .
                "Code: " . $e->getCode()
            );
        } else {
            error_log("Database Error: " . $e->getMessage());
            throw new Exception("A database error occurred. Please contact support.");
        }
    }

    /**
     * Prevent cloning
     */
    private function __clone() {}

    /**
     * Prevent unserialization
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
