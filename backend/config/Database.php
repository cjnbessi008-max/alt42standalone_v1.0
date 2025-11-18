<?php
/**
 * Database Connection Manager
 *
 * Singleton pattern for PDO database connection
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
     * Get database instance (Singleton)
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

            $this->connection = new PDO($dsn, $db['username'], $db['password'], $db['options']);

            // Set character set
            $this->connection->exec("SET NAMES '{$db['charset']}' COLLATE '{$db['collation']}'");
            $this->connection->exec("SET CHARACTER SET '{$db['charset']}'");

        } catch (PDOException $e) {
            $this->logError('Database connection failed: ' . $e->getMessage());
            throw new Exception('Database connection failed. Please check your configuration.');
        }
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        // Check if connection is still alive
        try {
            $this->connection->query('SELECT 1');
        } catch (PDOException $e) {
            $this->connect(); // Reconnect
        }

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
            $this->logError('Query failed: ' . $e->getMessage() . ' | SQL: ' . $sql);
            throw $e;
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
     * Fetch single row
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Fetch single value
     */
    public function fetchValue($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->fetch(PDO::FETCH_NUM);
        return $result ? $result[0] : null;
    }

    /**
     * Insert data and return last insert ID
     */
    public function insert($table, $data) {
        $columns = array_keys($data);
        $placeholders = array_map(function($col) { return ':' . $col; }, $columns);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $params = [];
        foreach ($data as $key => $value) {
            $params[':' . $key] = $value;
        }

        $this->query($sql, $params);
        return $this->connection->lastInsertId();
    }

    /**
     * Update data
     */
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "$column = :$column";
        }

        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $table,
            implode(', ', $setParts),
            $where
        );

        $params = [];
        foreach ($data as $key => $value) {
            $params[':' . $key] = $value;
        }
        $params = array_merge($params, $whereParams);

        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Delete data
     */
    public function delete($table, $where, $params = []) {
        $sql = sprintf('DELETE FROM %s WHERE %s', $table, $where);
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
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
     * Check if in transaction
     */
    public function inTransaction() {
        return $this->connection->inTransaction();
    }

    /**
     * Get configuration value
     */
    public function getConfig($key = null, $default = null) {
        if ($key === null) {
            return $this->config;
        }

        // Support dot notation (e.g., 'database.host')
        $keys = explode('.', $key);
        $value = $this->config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }

    /**
     * Log error to database
     */
    private function logError($message) {
        try {
            // Avoid infinite loop if logging itself fails
            if ($this->connection) {
                $this->insert('system_logs', [
                    'level' => 'error',
                    'category' => 'database',
                    'message' => $message,
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
        } catch (Exception $e) {
            // Silently fail if logging fails
            error_log('Failed to log database error: ' . $e->getMessage());
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
