<?php
/**
 * Rule Door - Database Configuration
 * Compatible with MySQL 5.7 and PHP 7.1.9
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'rule_door_db';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $conn = null;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ];

                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            } catch(PDOException $e) {
                error_log("Connection Error: " . $e->getMessage());
                throw new Exception("Database connection failed");
            }
        }

        return $this->conn;
    }

    /**
     * Close database connection
     */
    public function closeConnection() {
        $this->conn = null;
    }

    /**
     * Begin transaction
     */
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public function commit() {
        return $this->getConnection()->commit();
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        return $this->getConnection()->rollBack();
    }
}
