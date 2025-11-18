<?php
/**
 * Database Connection Handler
 * MySQL 5.7 Compatible with PHP 7.1.9
 */

class Database {
    private static $instance = null;
    private $connection;

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
     * Connect to database
     */
    private function connect() {
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
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("데이터베이스 연결에 실패했습니다.");
        }
    }

    /**
     * Get database connection
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
            error_log("Query Error: " . $e->getMessage());
            throw new Exception("쿼리 실행 중 오류가 발생했습니다.");
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
     * Insert data and return last insert ID
     */
    public function insert($table, $data) {
        $keys = array_keys($data);
        $fields = implode(', ', $keys);
        $placeholders = ':' . implode(', :', $keys);

        $sql = "INSERT INTO {$table} ({$fields}) VALUES ({$placeholders})";
        $this->query($sql, $data);

        return $this->connection->lastInsertId();
    }

    /**
     * Update data
     */
    public function update($table, $data, $where, $whereParams = []) {
        $set = [];
        foreach (array_keys($data) as $key) {
            $set[] = "{$key} = :{$key}";
        }
        $setClause = implode(', ', $set);

        $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
        $params = array_merge($data, $whereParams);

        return $this->query($sql, $params);
    }

    /**
     * Delete data
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        return $this->query($sql, $params);
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
        return $this->connection->rollback();
    }

    /**
     * Prevent cloning
     */
    private function __clone() {}

    /**
     * Prevent unserialization
     */
    private function __wakeup() {}
}
