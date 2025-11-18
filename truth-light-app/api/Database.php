<?php
/**
 * Database Connection Class
 *
 * MySQL 데이터베이스 연결 및 쿼리 실행을 담당하는 싱글톤 클래스
 */

class Database {
    private static $instance = null;
    private $connection;

    /**
     * Private constructor for singleton pattern
     */
    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            $this->logError("Database connection failed: " . $e->getMessage());
            throw new Exception("데이터베이스 연결에 실패했습니다.");
        }
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
     * Get PDO connection
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Execute SELECT query
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
        }
    }

    /**
     * Execute SELECT query and return single row
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
        }
    }

    /**
     * Execute INSERT, UPDATE, DELETE query
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute($params);
            return [
                'success' => $result,
                'affected_rows' => $stmt->rowCount(),
                'last_insert_id' => $this->connection->lastInsertId()
            ];
        } catch (PDOException $e) {
            $this->logError("Execute failed: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
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
     * Log error
     */
    private function logError($message) {
        if (LOG_ENABLED) {
            $logMessage = sprintf(
                "[%s] [ERROR] %s\n",
                date('Y-m-d H:i:s'),
                $message
            );
            error_log($logMessage, 3, LOG_PATH);
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
