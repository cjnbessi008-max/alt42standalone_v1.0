<?php
/**
 * Trig Flow Integrator - Database Configuration
 * MySQL 5.7 Compatible / PHP 7.1.9 Compatible
 */

// 데이터베이스 설정 (실제 환경에 맞게 수정 필요)
define('DB_HOST', 'localhost');
define('DB_NAME', 'trig_flow_integrator');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 설정 (Moodle이 별도 DB일 경우)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_'); // Moodle 테이블 prefix

class Database {
    private static $instance = null;
    private $connection;
    private $moodle_connection;

    private function __construct() {
        try {
            // Trig Flow Integrator 데이터베이스 연결
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

            // Moodle 데이터베이스 연결 (별도 DB일 경우)
            if (MOODLE_DB_NAME !== DB_NAME) {
                $moodle_dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=" . DB_CHARSET;
                $this->moodle_connection = new PDO($moodle_dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
            } else {
                $this->moodle_connection = $this->connection;
            }
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            die(json_encode(['error' => 'Database connection failed']));
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

    public function getMoodleConnection() {
        return $this->moodle_connection;
    }

    // 연결 복제 방지
    private function __clone() {}

    // 직렬화 방지
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
