<?php
/**
 * Database Utility Class
 * PDO wrapper for MySQL 5.7 connection
 */

namespace DeviationBreeze\Utils;

use PDO;
use PDOException;

class Database
{
    private static $instance = null;
    private $connection;

    /**
     * Private constructor for singleton pattern
     */
    private function __construct()
    {
        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '3306';
        $database = getenv('DB_DATABASE') ?: 'deviation_breeze';
        $username = getenv('DB_USERNAME') ?: 'root';
        $password = getenv('DB_PASSWORD') ?: '';

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

        try {
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new \Exception("Database connection failed");
        }
    }

    /**
     * Get singleton instance
     *
     * @return Database
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get PDO connection
     *
     * @return PDO
     */
    public function getConnection()
    {
        return $this->connection;
    }

    /**
     * Execute a query and return all results
     *
     * @param string $sql
     * @param array $params
     * @return array
     */
    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage());
            throw new \Exception("Query execution failed");
        }
    }

    /**
     * Execute a query and return single row
     *
     * @param string $sql
     * @param array $params
     * @return array|null
     */
    public function queryOne($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            return $result ?: null;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage());
            throw new \Exception("Query execution failed");
        }
    }

    /**
     * Execute INSERT/UPDATE/DELETE query
     *
     * @param string $sql
     * @param array $params
     * @return int Last insert ID or affected rows
     */
    public function execute($sql, $params = [])
    {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $this->connection->lastInsertId() ?: $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Execute failed: " . $e->getMessage());
            throw new \Exception("Query execution failed: " . $e->getMessage());
        }
    }

    /**
     * Begin transaction
     */
    public function beginTransaction()
    {
        $this->connection->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit()
    {
        $this->connection->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback()
    {
        $this->connection->rollBack();
    }

    /**
     * Get last insert ID
     *
     * @return string
     */
    public function lastInsertId()
    {
        return $this->connection->lastInsertId();
    }

    /**
     * Prevent cloning
     */
    private function __clone()
    {
    }

    /**
     * Prevent unserialization
     */
    private function __wakeup()
    {
    }
}
