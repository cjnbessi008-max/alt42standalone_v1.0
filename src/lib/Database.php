<?php
/**
 * Database Connection Class
 *
 * Handles connections to both the standalone app database
 * and the Moodle database (read-only)
 */

class Database {
    private static $instance = null;
    private $conn = null;
    private $moodle_conn = null;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        // Initialize connections
        $this->connect();
        $this->connectMoodle();
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
     * Connect to standalone app database
     */
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            log_message("Connected to standalone database successfully");
        } catch (PDOException $e) {
            log_message("Database connection failed: " . $e->getMessage(), 'ERROR');
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }

    /**
     * Connect to Moodle database (read-only)
     */
    private function connectMoodle() {
        try {
            $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . MOODLE_DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . MOODLE_DB_CHARSET
            ];

            $this->moodle_conn = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
            log_message("Connected to Moodle database successfully");
        } catch (PDOException $e) {
            log_message("Moodle database connection failed: " . $e->getMessage(), 'ERROR');
            // Moodle 연결 실패는 치명적이지 않을 수 있음
            $this->moodle_conn = null;
        }
    }

    /**
     * Get standalone app database connection
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Get Moodle database connection
     */
    public function getMoodleConnection() {
        return $this->moodle_conn;
    }

    /**
     * Execute a query on standalone database
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            log_message("Query failed: " . $e->getMessage() . " | SQL: " . $sql, 'ERROR');
            throw new Exception("Query execution failed: " . $e->getMessage());
        }
    }

    /**
     * Execute a query on Moodle database (read-only)
     */
    public function queryMoodle($sql, $params = []) {
        if ($this->moodle_conn === null) {
            throw new Exception("Moodle database connection not available");
        }

        try {
            $stmt = $this->moodle_conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            log_message("Moodle query failed: " . $e->getMessage() . " | SQL: " . $sql, 'ERROR');
            throw new Exception("Moodle query execution failed: " . $e->getMessage());
        }
    }

    /**
     * Fetch all results
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch single result
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Insert record and return last insert ID
     */
    public function insert($table, $data) {
        $columns = array_keys($data);
        $placeholders = array_map(function($col) { return ':' . $col; }, $columns);

        $sql = "INSERT INTO {$table} (" . implode(', ', $columns) . ")
                VALUES (" . implode(', ', $placeholders) . ")";

        $params = [];
        foreach ($data as $key => $value) {
            $params[':' . $key] = $value;
        }

        $this->query($sql, $params);
        return $this->conn->lastInsertId();
    }

    /**
     * Update records
     */
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        $params = [];

        foreach ($data as $key => $value) {
            $setParts[] = "{$key} = :{$key}";
            $params[':' . $key] = $value;
        }

        $sql = "UPDATE {$table} SET " . implode(', ', $setParts) . " WHERE {$where}";
        $params = array_merge($params, $whereParams);

        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Delete records
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->conn->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->conn->rollBack();
    }

    /**
     * Check if table exists
     */
    public function tableExists($table) {
        $sql = "SHOW TABLES LIKE :table";
        $stmt = $this->query($sql, [':table' => $table]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Get table prefix for Moodle
     */
    public function getMoodlePrefix() {
        return MOODLE_DB_PREFIX;
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
