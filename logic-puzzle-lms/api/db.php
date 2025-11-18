<?php
/**
 * Database Connection Class
 *
 * PDO를 사용한 MySQL 연결 관리
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
     * Singleton pattern - get database instance
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
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $db['host'],
                $db['port'],
                $db['database'],
                $db['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$db['charset']} COLLATE {$db['collation']}"
            ];

            $this->connection = new PDO($dsn, $db['username'], $db['password'], $options);

            // 타임존 설정
            $timezone = $this->config['app']['timezone'];
            $this->connection->exec("SET time_zone = '{$timezone}'");

        } catch (PDOException $e) {
            $this->handleError('Database connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute a SELECT query
     *
     * @param string $sql SQL query
     * @param array $params Parameters for prepared statement
     * @return array Result set
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->handleError('Query failed: ' . $e->getMessage(), $sql);
            return [];
        }
    }

    /**
     * Execute a SELECT query and return single row
     *
     * @param string $sql SQL query
     * @param array $params Parameters for prepared statement
     * @return array|false Single row or false
     */
    public function querySingle($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->handleError('Query failed: ' . $e->getMessage(), $sql);
            return false;
        }
    }

    /**
     * Execute INSERT, UPDATE, DELETE queries
     *
     * @param string $sql SQL query
     * @param array $params Parameters for prepared statement
     * @return int Number of affected rows
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->handleError('Execute failed: ' . $e->getMessage(), $sql);
            return 0;
        }
    }

    /**
     * Insert a record and return last insert ID
     *
     * @param string $sql SQL INSERT query
     * @param array $params Parameters for prepared statement
     * @return int Last insert ID
     */
    public function insert($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $this->connection->lastInsertId();
        } catch (PDOException $e) {
            $this->handleError('Insert failed: ' . $e->getMessage(), $sql);
            return 0;
        }
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
     * Escape string for SQL (use prepared statements instead when possible)
     *
     * @param string $value Value to escape
     * @return string Escaped value
     */
    public function escape($value) {
        return $this->connection->quote($value);
    }

    /**
     * Handle database errors
     *
     * @param string $message Error message
     * @param string $sql Optional SQL query
     */
    private function handleError($message, $sql = '') {
        if ($this->config['app']['debug']) {
            $error = [
                'error' => $message,
                'sql' => $sql,
                'trace' => debug_backtrace()
            ];
            error_log(json_encode($error));
            throw new Exception($message);
        } else {
            error_log($message);
            throw new Exception('A database error occurred');
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

/**
 * Helper function to get database instance
 */
function db() {
    return Database::getInstance();
}
