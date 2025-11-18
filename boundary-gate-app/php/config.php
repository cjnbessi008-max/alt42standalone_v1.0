<?php
/**
 * Database Configuration
 * MySQL 5.7 연결 설정
 */

// 오류 보고 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 데이터베이스 연결 정보
define('DB_HOST', 'localhost');
define('DB_NAME', 'boundary_gate');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 연결 정보
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'YOUR_MOODLE_TOKEN'); // Moodle 웹서비스 토큰
define('MOODLE_SERVICE', 'moodle_mobile_app'); // 웹서비스 이름

// 앱 설정
define('APP_NAME', 'Boundary Gate Learning System');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);

/**
 * 데이터베이스 연결 함수
 * @return PDO - PDO 연결 객체
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        logError('Database Connection Error: ' . $e->getMessage());
        throw new Exception('데이터베이스 연결 실패');
    }
}

/**
 * 에러 로깅 함수
 * @param string $message - 로그 메시지
 */
function logError($message) {
    $logFile = __DIR__ . '/../logs/error.log';
    $logDir = dirname($logFile);

    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message" . PHP_EOL;

    file_put_contents($logFile, $logMessage, FILE_APPEND);

    if (DEBUG_MODE) {
        error_log($message);
    }
}

/**
 * JSON 응답 함수
 * @param array $data - 응답 데이터
 * @param int $statusCode - HTTP 상태 코드
 */
function sendJSONResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답 함수
 * @param string $message - 에러 메시지
 * @param int $statusCode - HTTP 상태 코드
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJSONResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * 성공 응답 함수
 * @param mixed $data - 응답 데이터
 */
function sendSuccessResponse($data) {
    sendJSONResponse([
        'success' => true,
        'data' => $data
    ], 200);
}
