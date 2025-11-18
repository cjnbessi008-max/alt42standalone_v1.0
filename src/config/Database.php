<?php
/**
 * Database Connection Class
 * Singleton pattern for MySQL 5.7 connection
 */

class Database {
    private static $instance = null;
    private $connection;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->handleError("Database connection failed", $e);
        }
    }

    /**
     * Get singleton instance
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get PDO connection
     * @return PDO
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a SELECT query
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->handleError("Query failed: " . $sql, $e);
            return [];
        }
    }

    /**
     * Execute a SELECT query and return single row
     * @param string $sql
     * @param array $params
     * @return array|null
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            $this->handleError("Query failed: " . $sql, $e);
            return null;
        }
    }

    /**
     * Execute INSERT, UPDATE, DELETE
     * @param string $sql
     * @param array $params
     * @return int Last insert ID or affected rows
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);

            // Return last insert ID for INSERT, affected rows for UPDATE/DELETE
            if (stripos(trim($sql), 'INSERT') === 0) {
                return (int) $this->connection->lastInsertId();
            }
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->handleError("Execute failed: " . $sql, $e);
            return 0;
        }
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        $this->connection->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        $this->connection->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        $this->connection->rollBack();
    }

    /**
     * Handle database errors
     * @param string $message
     * @param PDOException $e
     */
    private function handleError($message, PDOException $e) {
        $errorMessage = $message . ": " . $e->getMessage();

        if (APP_DEBUG) {
            throw new Exception($errorMessage);
        } else {
            error_log($errorMessage);
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
