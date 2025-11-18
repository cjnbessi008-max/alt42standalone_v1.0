<?php
/**
 * Database Connection Class
 * MySQL 5.7 연결 관리
 */

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        // 설정 파일에서 로드
        $this->host = defined('DB_HOST') ? DB_HOST : 'localhost';
        $this->db_name = defined('DB_NAME') ? DB_NAME : 'root_glow_db';
        $this->username = defined('DB_USER') ? DB_USER : 'root';
        $this->password = defined('DB_PASS') ? DB_PASS : '';
    }

    /**
     * 데이터베이스 연결
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new mysqli(
                $this->host,
                $this->username,
                $this->password,
                $this->db_name
            );

            // 문자 인코딩 설정
            $this->conn->set_charset("utf8mb4");

            // 오류 확인
            if ($this->conn->connect_error) {
                throw new Exception("Connection failed: " . $this->conn->connect_error);
            }

        } catch (Exception $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw $e;
        }

        return $this->conn;
    }

    /**
     * 연결 닫기
     */
    public function closeConnection() {
        if ($this->conn) {
            $this->conn->close();
        }
    }

    /**
     * 쿼리 실행 (SELECT)
     */
    public function query($sql, $params = []) {
        if (!$this->conn) {
            $this->getConnection();
        }

        // Prepared statement
        $stmt = $this->conn->prepare($sql);

        if (!$stmt) {
            throw new Exception("Prepare failed: " . $this->conn->error);
        }

        // 파라미터 바인딩
        if (!empty($params)) {
            $types = '';
            $values = [];

            foreach ($params as $param) {
                if (is_int($param)) {
                    $types .= 'i';
                } elseif (is_float($param)) {
                    $types .= 'd';
                } else {
                    $types .= 's';
                }
                $values[] = $param;
            }

            $stmt->bind_param($types, ...$values);
        }

        // 실행
        $stmt->execute();

        return $stmt;
    }

    /**
     * 단일 행 가져오기
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $stmt->close();

        return $row;
    }

    /**
     * 모든 행 가져오기
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $result = $stmt->get_result();
        $rows = [];

        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }

        $stmt->close();

        return $rows;
    }

    /**
     * 삽입/수정/삭제 쿼리 실행
     */
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        $affected = $stmt->affected_rows;
        $insertId = $this->conn->insert_id;
        $stmt->close();

        return [
            'affected_rows' => $affected,
            'insert_id' => $insertId
        ];
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction() {
        $this->conn->begin_transaction();
    }

    /**
     * 커밋
     */
    public function commit() {
        $this->conn->commit();
    }

    /**
     * 롤백
     */
    public function rollback() {
        $this->conn->rollback();
    }

    /**
     * 마지막 삽입 ID
     */
    public function lastInsertId() {
        return $this->conn->insert_id;
    }

    /**
     * SQL 이스케이프
     */
    public function escape($value) {
        return $this->conn->real_escape_string($value);
    }
}
