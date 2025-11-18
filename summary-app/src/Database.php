<?php
/**
 * 데이터베이스 연결 및 쿼리 실행 클래스
 */

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $config = require __DIR__ . '/../config/database.php';

        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset']
            );

            $this->pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("데이터베이스 연결에 실패했습니다.");
        }
    }

    /**
     * 싱글톤 인스턴스 반환
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * PDO 인스턴스 반환
     */
    public function getConnection() {
        return $this->pdo;
    }

    /**
     * SELECT 쿼리 실행
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
        }
    }

    /**
     * SELECT 쿼리 실행 (단일 행)
     */
    public function queryOne($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
        }
    }

    /**
     * INSERT/UPDATE/DELETE 쿼리 실행
     */
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Execute error: " . $e->getMessage());
            throw new Exception("쿼리 실행에 실패했습니다.");
        }
    }

    /**
     * 마지막 삽입 ID 반환
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    /**
     * 트랜잭션 시작
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    /**
     * 트랜잭션 커밋
     */
    public function commit() {
        return $this->pdo->commit();
    }

    /**
     * 트랜잭션 롤백
     */
    public function rollBack() {
        return $this->pdo->rollBack();
    }
}
