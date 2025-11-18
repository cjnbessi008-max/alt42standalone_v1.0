<?php
/**
 * Alt42 Database Configuration Example
 * 이 파일을 database.php로 복사하고 실제 값으로 수정하세요
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_monitor');
define('DB_USER', 'alt42_user');
define('DB_PASS', 'your_secure_password_here'); // 실제 비밀번호로 변경
define('DB_CHARSET', 'utf8mb4');

// 환경 설정
define('ENVIRONMENT', 'development'); // development, staging, production

// 에러 리포팅 (개발 환경)
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 시간대 설정
date_default_timezone_set('Asia/Seoul');

// 세션 설정
ini_set('session.gc_maxlifetime', 3600); // 1시간
ini_set('session.cookie_lifetime', 0);

/**
 * Database 클래스 정의
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            die(json_encode([
                'success' => false,
                'error' => 'Database connection failed'
            ]));
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

    // ... (나머지 메서드는 database.php 참고)
}
?>
