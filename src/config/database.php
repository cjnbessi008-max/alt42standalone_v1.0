<?php
/**
 * Database Configuration and Connection Manager
 * MySQL 5.7 compatible
 */

class Database {
    private static $instance = null;
    private $connection = null;

    private function __construct() {
        $this->connect();
    }

    /**
     * Get database instance (Singleton pattern)
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
            $host = getenv('DB_HOST') ?: 'localhost';
            $port = getenv('DB_PORT') ?: '3306';
            $dbname = getenv('DB_NAME') ?: 'learning_summary';
            $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}"
            ];

            $this->connection = new PDO(
                $dsn,
                getenv('DB_USER') ?: 'root',
                getenv('DB_PASSWORD') ?: '',
                $options
            );

            // Set timezone
            $timezone = getenv('APP_TIMEZONE') ?: 'Asia/Seoul';
            $this->connection->exec("SET time_zone = '{$timezone}'");

        } catch (PDOException $e) {
            $this->handleError($e);
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
            $this->handleError($e);
            return false;
        }
    }

    /**
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetch() : null;
    }

    /**
     * Fetch all rows
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }

    /**
     * Insert record and return last insert ID
     */
    public function insert($table, $data) {
        $columns = array_keys($data);
        $values = array_values($data);

        $columnStr = implode(', ', $columns);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $sql = "INSERT INTO {$table} ({$columnStr}) VALUES ({$placeholders})";

        $stmt = $this->query($sql, $values);

        return $stmt ? $this->connection->lastInsertId() : false;
    }

    /**
     * Update record(s)
     */
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        $values = [];

        foreach ($data as $column => $value) {
            $setParts[] = "{$column} = ?";
            $values[] = $value;
        }

        $setStr = implode(', ', $setParts);
        $sql = "UPDATE {$table} SET {$setStr} WHERE {$where}";

        $allParams = array_merge($values, $whereParams);

        return $this->query($sql, $allParams);
    }

    /**
     * Delete record(s)
     */
    public function delete($table, $where, $whereParams = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        return $this->query($sql, $whereParams);
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
     * Get configuration value
     */
    public function getConfig($key, $default = null) {
        $sql = "SELECT config_value, config_type FROM system_config WHERE config_key = ?";
        $result = $this->fetchOne($sql, [$key]);

        if (!$result) {
            return $default;
        }

        // Convert based on type
        switch ($result['config_type']) {
            case 'integer':
                return (int) $result['config_value'];
            case 'boolean':
                return (bool) $result['config_value'];
            case 'json':
                return json_decode($result['config_value'], true);
            default:
                return $result['config_value'];
        }
    }

    /**
     * Set configuration value
     */
    public function setConfig($key, $value, $type = 'string') {
        if ($type === 'json') {
            $value = json_encode($value);
        } elseif ($type === 'boolean') {
            $value = $value ? '1' : '0';
        }

        $sql = "INSERT INTO system_config (config_key, config_value, config_type)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE config_value = ?, config_type = ?";

        return $this->query($sql, [$key, $value, $type, $value, $type]);
    }

    /**
     * Handle database errors
     */
    private function handleError($e) {
        error_log("Database Error: " . $e->getMessage());

        if (getenv('APP_DEBUG') === 'true') {
            throw $e;
        } else {
            throw new Exception('Database error occurred. Please contact administrator.');
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
