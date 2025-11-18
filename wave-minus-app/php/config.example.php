<?php
/**
 * Wave Minus - 설정 파일 예제
 * 이 파일을 config.php로 복사하고 실제 값으로 수정하세요
 */

// 에러 리포팅 설정
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');  // 실제 비밀번호로 변경
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_VERSION', '3.7');
define('MOODLE_TABLE_PREFIX', 'mdl_');

// 애플리케이션 설정
define('APP_NAME', 'Wave Minus');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);  // 프로덕션에서는 false로 설정

// CORS 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 데이터베이스 연결 함수
function getDBConnection() {
    static $conn = null;

    if ($conn === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            logError('Database connection failed: ' . $e->getMessage());
            return null;
        }
    }

    return $conn;
}

// 에러 로깅 함수
function logError($message) {
    $logFile = __DIR__ . '/../logs/error.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message\n";

    error_log($logMessage, 3, $logFile);
}

// JSON 응답 함수
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// 에러 응답 함수
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('c')
    ], $statusCode);
}
?>
