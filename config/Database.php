<?php
/**
 * Database Connection Class
 * Singleton pattern for MySQL connection management
 */

class Database {
    private static $instance = null;
    private $connection;
    private $config;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        $this->config = require __DIR__ . '/config.php';
        $this->connect();
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
     * Establish database connection
     */
    private function connect() {
        $db = $this->config['database'];

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $db['host'],
                $db['port'],
                $db['database'],
                $db['charset']
            );

            $this->connection = new PDO($dsn, $db['username'], $db['password'], $db['options']);

            // Set timezone
            $this->connection->exec("SET time_zone = '+09:00'");

        } catch (PDOException $e) {
            $this->logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed. Please check configuration.');
        }
    }

    /**
     * Get PDO connection
     * @return PDO
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a query
     * @param string $sql
     * @param array $params
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->logError('Query failed: ' . $e->getMessage() . ' | SQL: ' . $sql);
            throw $e;
        }
    }

    /**
     * Fetch all rows
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch single row
     * @param string $sql
     * @param array $params
     * @return array|false
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Execute insert and return last insert ID
     * @param string $sql
     * @param array $params
     * @return string
     */
    public function insert($sql, $params = []) {
        $this->query($sql, $params);
        return $this->connection->lastInsertId();
    }

    /**
     * Execute update/delete and return affected rows
     * @param string $sql
     * @param array $params
     * @return int
     */
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
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
     * Log error message
     * @param string $message
     */
    private function logError($message) {
        $logFile = $this->config['paths']['logs'] . '/database_errors.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
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
