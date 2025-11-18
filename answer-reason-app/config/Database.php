<?php
/**
 * Database Connection Class
 * Handles MySQL database connections using PDO
 */

class Database {
    private static $instance = null;
    private $connection;
    private $config;

    /**
     * Private constructor for singleton pattern
     */
    private function __construct() {
        $this->config = require __DIR__ . '/config.php';
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
        $dbConfig = $this->config['database'];

        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['database'],
                $dbConfig['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$dbConfig['charset']} COLLATE {$dbConfig['collation']}"
            ];

            $this->connection = new PDO(
                $dsn,
                $dbConfig['username'],
                $dbConfig['password'],
                $options
            );

            $this->log('Database connection established', 'info');

        } catch (PDOException $e) {
            $this->log('Database connection failed: ' . $e->getMessage(), 'error');
            throw new Exception('Database connection failed. Please check your configuration.');
        }
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a query and return results
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->log('Query error: ' . $e->getMessage(), 'error');
            throw new Exception('Database query failed: ' . $e->getMessage());
        }
    }

    /**
     * Insert a record and return last insert ID
     */
    public function insert($table, $data) {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $this->query($sql, array_values($data));
        return $this->connection->lastInsertId();
    }

    /**
     * Update records
     */
    public function update($table, $data, $where, $whereParams = []) {
        $sets = [];
        foreach (array_keys($data) as $column) {
            $sets[] = "$column = ?";
        }

        $sql = sprintf(
            "UPDATE %s SET %s WHERE %s",
            $table,
            implode(', ', $sets),
            $where
        );

        $params = array_merge(array_values($data), $whereParams);
        return $this->query($sql, $params);
    }

    /**
     * Delete records
     */
    public function delete($table, $where, $params = []) {
        $sql = sprintf("DELETE FROM %s WHERE %s", $table, $where);
        return $this->query($sql, $params);
    }

    /**
     * Select records
     */
    public function select($table, $where = '1=1', $params = [], $columns = '*') {
        $sql = sprintf("SELECT %s FROM %s WHERE %s", $columns, $table, $where);
        return $this->query($sql, $params)->fetchAll();
    }

    /**
     * Select single record
     */
    public function selectOne($table, $where, $params = [], $columns = '*') {
        $sql = sprintf("SELECT %s FROM %s WHERE %s LIMIT 1", $columns, $table, $where);
        return $this->query($sql, $params)->fetch();
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

    /**
     * Log message to database
     */
    private function log($message, $type = 'info') {
        if (!$this->config['logging']['enabled']) {
            return;
        }

        try {
            // Only log to database if connection is established
            if ($this->connection) {
                $stmt = $this->connection->prepare(
                    "INSERT INTO system_logs (log_type, message, created_at) VALUES (?, ?, NOW())"
                );
                $stmt->execute([$type, $message]);
            }
        } catch (Exception $e) {
            // Silent fail for logging errors
            error_log("Logging failed: " . $e->getMessage());
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
