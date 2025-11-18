<?php
/**
 * Database Connection Class
 * Handles MySQL 5.7 connections for Solid Spin Viewer
 */

require_once __DIR__ . '/../config/database.php';

class Database {
    private static $instance = null;
    private $connection = null;
    private $moodle_connection = null;

    private function __construct() {
        date_default_timezone_set(APP_TIMEZONE);
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
     * Get main database connection
     */
    public function getConnection() {
        if ($this->connection === null) {
            try {
                $this->connection = new PDO(
                    "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
                    ]
                );
            } catch (PDOException $e) {
                $this->handleError("Database connection failed", $e);
            }
        }
        return $this->connection;
    }

    /**
     * Get Moodle database connection
     */
    public function getMoodleConnection() {
        if ($this->moodle_connection === null) {
            try {
                $this->moodle_connection = new PDO(
                    "mysql:host=" . MOODLE_DB_HOST . ";port=" . MOODLE_DB_PORT . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET,
                    MOODLE_DB_USER,
                    MOODLE_DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
                    ]
                );
            } catch (PDOException $e) {
                $this->handleError("Moodle database connection failed", $e);
            }
        }
        return $this->moodle_connection;
    }

    /**
     * Execute a prepared statement
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleError("Query execution failed: " . $sql, $e);
        }
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->getConnection()->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->getConnection()->rollBack();
    }

    /**
     * Handle database errors
     */
    private function handleError($message, $exception) {
        if (APP_DEBUG) {
            error_log($message . ": " . $exception->getMessage());
            throw $exception;
        } else {
            error_log($message);
            throw new Exception("Database error occurred");
        }
    }

    /**
     * Close connections
     */
    public function close() {
        $this->connection = null;
        $this->moodle_connection = null;
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
