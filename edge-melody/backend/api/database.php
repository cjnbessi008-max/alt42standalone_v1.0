<?php
/**
 * Database Connection Handler
 * Moodle MySQL 데이터베이스 연결 관리
 */

class Database {
    private $connection;
    private $config;

    public function __construct() {
        $this->config = require __DIR__ . '/../../config/database.php';
        $this->connect();
    }

    private function connect() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;port=%s;dbname=%s;charset=%s",
                $this->config['host'],
                $this->config['port'],
                $this->config['database'],
                $this->config['charset']
            );

            $this->connection = new PDO(
                $dsn,
                $this->config['username'],
                $this->config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("데이터베이스 연결에 실패했습니다.");
        }
    }

    public function getConnection() {
        return $this->connection;
    }

    public function getPrefix() {
        return $this->config['prefix'];
    }
}
