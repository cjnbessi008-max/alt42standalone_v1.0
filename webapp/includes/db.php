<?php
/**
 * Database Connection and Helper Functions
 *
 * @package InvariantFinder
 */

defined('APP_ACCESS') or die('Direct access not permitted');

class Database {
    private static $instance = null;
    private $connection;
    private $lastError;

    /**
     * Private constructor for singleton pattern
     */
    private function __construct() {
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
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            if (ENVIRONMENT === 'development') {
                die("Database connection failed: " . $e->getMessage());
            } else {
                die("Database connection failed. Please contact administrator.");
            }
        }
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a query
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->lastError = $e->getMessage();
            if (ENVIRONMENT === 'development') {
                throw $e;
            }
            return false;
        }
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetch() : false;
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetchAll() : false;
    }

    /**
     * Insert data
     */
    public function insert($table, $data) {
        $fields = array_keys($data);
        $values = array_values($data);
        $placeholders = array_fill(0, count($fields), '?');

        $sql = "INSERT INTO $table (" . implode(', ', $fields) . ")
                VALUES (" . implode(', ', $placeholders) . ")";

        $stmt = $this->query($sql, $values);
        return $stmt ? $this->connection->lastInsertId() : false;
    }

    /**
     * Update data
     */
    public function update($table, $data, $where, $whereParams = []) {
        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "$field = ?";
        }

        $sql = "UPDATE $table SET " . implode(', ', $fields) . " WHERE $where";
        $params = array_merge(array_values($data), $whereParams);

        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->rowCount() : false;
    }

    /**
     * Delete data
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM $table WHERE $where";
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->rowCount() : false;
    }

    /**
     * Get last error
     */
    public function getLastError() {
        return $this->lastError;
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->connection->rollBack();
    }
}

// Helper function to get database instance
function db() {
    return Database::getInstance();
}
