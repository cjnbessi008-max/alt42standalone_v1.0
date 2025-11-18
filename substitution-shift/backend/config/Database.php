<?php
/**
 * Database Connection Class
 *
 * PDO-based database connection for MySQL 5.7
 * PHP 7.1.9 compatible
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset;
    private $conn;

    /**
     * Constructor
     */
    public function __construct() {
        $this->host = DB_HOST;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->charset = DB_CHARSET;
    }

    /**
     * Get database connection
     *
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);

            if (DEBUG_MODE) {
                error_log("Database connection established successfully");
            }

        } catch(PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());

            if (DEBUG_MODE) {
                throw new Exception("Database connection failed: " . $e->getMessage());
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
        if ($this->conn) {
            return $this->conn->beginTransaction();
        }
        return false;
    }

    /**
     * Commit transaction
     */
    public function commit() {
        if ($this->conn) {
            return $this->conn->commit();
        }
        return false;
    }

    /**
     * Rollback transaction
     */
    public function rollback() {
        if ($this->conn) {
            return $this->conn->rollback();
        }
        return false;
    }

    /**
     * Get last insert ID
     *
     * @return string
     */
    public function lastInsertId() {
        if ($this->conn) {
            return $this->conn->lastInsertId();
        }
        return null;
    }
}

?>
