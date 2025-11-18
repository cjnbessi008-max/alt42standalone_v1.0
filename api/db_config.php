<?php
/**
 * Solution Paint - Database Configuration
 * MySQL 5.7 / PHP 7.1.9 Compatible
 */

// 에러 리포팅 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'solution_paint');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// 애플리케이션 설정
define('APP_NAME', 'Solution Paint');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');

// Moodle 연동 설정
define('MOODLE_ENABLED', false); // true로 변경 시 Moodle 연동 활성화
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle REST API 토큰

// 타임존 설정
date_default_timezone_set(TIMEZONE);

/**
 * 데이터베이스 연결 클래스
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            );

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die(json_encode(array(
                'success' => false,
                'error' => 'Database connection failed: ' . $e->getMessage()
            )));
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
     * PDO 연결 객체 반환
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * 연결 복제 방지
     */
    private function __clone() {}

    /**
     * 역직렬화 방지
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * JSON 응답 헬퍼 함수
 */
function jsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 입력 검증 및 sanitize
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * POST 데이터 가져오기
 */
function getPostData() {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

    if (stripos($contentType, 'application/json') !== false) {
        $input = file_get_contents('php://input');
        return json_decode($input, true);
    }

    return $_POST;
}
