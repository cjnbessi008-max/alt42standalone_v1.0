<?php
/**
 * Prime Fireworks Configuration
 * 데이터베이스 및 환경 설정
 *
 * @author Prime Fireworks Team
 * @version 1.0.0
 */

// 에러 리포팅 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'prime_fireworks');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', 'YOUR_MOODLE_TOKEN_HERE');

// API 설정
define('API_TIMEOUT', 30);
define('MAX_ATTEMPTS', 3);
define('SESSION_TIMEOUT', 3600); // 1시간

// CORS 설정
define('CORS_ALLOWED_ORIGINS', ['http://localhost', 'http://localhost:3000']);

// 로깅 설정
define('LOG_ENABLED', true);
define('LOG_FILE', __DIR__ . '/../logs/app.log');

/**
 * 데이터베이스 연결
 *
 * @return mysqli|false 데이터베이스 연결 객체 또는 실패 시 false
 */
function getDbConnection() {
    static $conn = null;

    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
            error_log("Database connection failed: " . $conn->connect_error);
            return false;
        }

        $conn->set_charset(DB_CHARSET);
    }

    return $conn;
}

/**
 * JSON 응답 전송
 *
 * @param string $status 상태 (success, error)
 * @param mixed $data 데이터
 * @param int $httpCode HTTP 상태 코드
 */
function sendJsonResponse($status, $data, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');

    // CORS 헤더
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        }
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');

    $response = [
        'status' => $status,
        'data' => $data,
        'timestamp' => time()
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답 전송
 *
 * @param string $message 에러 메시지
 * @param int $httpCode HTTP 상태 코드
 */
function sendErrorResponse($message, $httpCode = 400) {
    sendJsonResponse('error', ['message' => $message], $httpCode);
}

/**
 * 성공 응답 전송
 *
 * @param mixed $data 응답 데이터
 */
function sendSuccessResponse($data) {
    sendJsonResponse('success', $data, 200);
}

/**
 * 로그 기록
 *
 * @param string $message 로그 메시지
 * @param string $level 로그 레벨 (INFO, WARNING, ERROR)
 */
function logMessage($message, $level = 'INFO') {
    if (!LOG_ENABLED) {
        return;
    }

    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;

    // 로그 디렉토리 생성
    $logDir = dirname(LOG_FILE);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }

    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND);
}

/**
 * 입력값 검증 및 정제
 *
 * @param string $data 입력 데이터
 * @return string 정제된 데이터
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * GET 파라미터 가져오기
 *
 * @param string $key 파라미터 키
 * @param mixed $default 기본값
 * @return mixed 파라미터 값
 */
function getParam($key, $default = null) {
    if (isset($_GET[$key])) {
        return sanitizeInput($_GET[$key]);
    }
    return $default;
}

/**
 * POST 파라미터 가져오기
 *
 * @param string $key 파라미터 키
 * @param mixed $default 기본값
 * @return mixed 파라미터 값
 */
function postParam($key, $default = null) {
    if (isset($_POST[$key])) {
        return sanitizeInput($_POST[$key]);
    }
    return $default;
}

/**
 * JSON 요청 본문 파싱
 *
 * @return array|false 파싱된 데이터 또는 실패 시 false
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return false;
    }

    return $data;
}

/**
 * 사용자 인증 확인
 *
 * @return int|false 사용자 ID 또는 실패 시 false
 */
function authenticateUser() {
    session_start();

    if (isset($_SESSION['moodle_user_id'])) {
        return intval($_SESSION['moodle_user_id']);
    }

    // 헤더에서 사용자 ID 확인 (개발용)
    if (isset($_SERVER['HTTP_X_USER_ID'])) {
        return intval($_SERVER['HTTP_X_USER_ID']);
    }

    return false;
}

/**
 * 필수 파라미터 검증
 *
 * @param array $params 파라미터 배열
 * @param array $required 필수 키 배열
 * @return bool 유효성 여부
 */
function validateRequiredParams($params, $required) {
    foreach ($required as $key) {
        if (!isset($params[$key]) || empty($params[$key])) {
            return false;
        }
    }
    return true;
}

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        }
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID');
    header('Access-Control-Allow-Credentials: true');
    exit(0);
}
