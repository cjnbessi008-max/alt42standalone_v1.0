<?php
/**
 * Database Connection Handler
 * MySQL 5.7 Compatible
 */

require_once __DIR__ . '/config.php';

class Database {
    private $conn;
    private $moodleConn;

    /**
     * Get main database connection
     */
    public function getConnection() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log("Database Connection Error: " . $e->getMessage());
                throw new Exception("데이터베이스 연결 실패");
            }
        }
        return $this->conn;
    }

    /**
     * Get Moodle database connection
     */
    public function getMoodleConnection() {
        if ($this->moodleConn === null) {
            try {
                $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                $this->moodleConn = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
            } catch (PDOException $e) {
                error_log("Moodle Database Connection Error: " . $e->getMessage());
                throw new Exception("Moodle 데이터베이스 연결 실패");
            }
        }
        return $this->moodleConn;
    }

    /**
     * Execute query and return results
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query Error: " . $e->getMessage() . " | SQL: " . $sql);
            throw new Exception("쿼리 실행 실패");
        }
    }

    /**
     * Execute Moodle query
     */
    public function moodleQuery($sql, $params = []) {
        try {
            $stmt = $this->getMoodleConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Moodle Query Error: " . $e->getMessage() . " | SQL: " . $sql);
            throw new Exception("Moodle 쿼리 실행 실패");
        }
    }

    /**
     * Get last insert ID
     */
    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
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
