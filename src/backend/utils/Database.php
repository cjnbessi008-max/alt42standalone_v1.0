<?php
/**
 * 데이터베이스 연결 및 쿼리 관리 클래스
 */

class Database {
    private $conn;
    private $moodleConn;
    private static $instance = null;

    private function __construct() {
        $this->connect();
        $this->connectMoodle();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 메인 데이터베이스 연결
     */
    private function connect() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            Logger::info("Database connected successfully");
        } catch (PDOException $e) {
            Logger::error("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Moodle 데이터베이스 연결
     */
    private function connectMoodle() {
        try {
            $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $this->moodleConn = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
            Logger::info("Moodle database connected successfully");
        } catch (PDOException $e) {
            Logger::error("Moodle database connection failed: " . $e->getMessage());
            // Moodle 연결 실패는 치명적이지 않을 수 있음
        }
    }

    /**
     * 메인 데이터베이스 연결 반환
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Moodle 데이터베이스 연결 반환
     */
    public function getMoodleConnection() {
        return $this->moodleConn;
    }

    /**
     * 쿼리 실행 (SELECT)
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            Logger::error("Query failed: " . $e->getMessage());
            throw new Exception("Query execution failed");
        }
    }

    /**
     * 쿼리 실행 (INSERT, UPDATE, DELETE)
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $result = $stmt->execute($params);
            return [
                'success' => $result,
                'affected_rows' => $stmt->rowCount(),
                'last_insert_id' => $this->conn->lastInsertId()
            ];
        } catch (PDOException $e) {
            Logger::error("Execute failed: " . $e->getMessage());
            throw new Exception("Query execution failed");
        }
    }

    /**
     * 단일 레코드 조회
     */
    public function fetchOne($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            Logger::error("Fetch one failed: " . $e->getMessage());
            throw new Exception("Query execution failed");
        }
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     */
    public function commit() {
        return $this->conn->commit();
    }

    /**
     * 트랜잭션 롤백
     */
    public function rollback() {
        return $this->conn->rollback();
    }

    /**
     * 연결 종료 방지
     */
    private function __clone() {}

    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
