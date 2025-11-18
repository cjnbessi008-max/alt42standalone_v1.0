<?php
/**
 * 데이터베이스 연결 클래스
 */
class Database {
    private static $instance = null;
    private $connection;
    private $config;

    private function __construct() {
        $configPath = __DIR__ . '/../config/database.php';

        // database.php가 없으면 example 파일 사용
        if (!file_exists($configPath)) {
            $configPath = __DIR__ . '/../config/database.example.php';
        }

        $this->config = require $configPath;
        $this->connect();
    }

    private function connect() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                $this->config['options']
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("데이터베이스 연결에 실패했습니다.");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    public function getTableName($table) {
        return $this->config['prefix'] . $table;
    }

    // 싱글톤 패턴 보호
    private function __clone() {}
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
