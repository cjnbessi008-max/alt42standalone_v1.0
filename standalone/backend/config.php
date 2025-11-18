<?php
/**
 * Next Term Vision - Standalone
 * Configuration File
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'nextterm_standalone');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// 애플리케이션 설정
define('APP_NAME', 'Next Term Vision');
define('APP_VERSION', '2.0.0');
define('APP_ENV', 'development'); // development, production

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');

// 오류 보고 (개발 환경)
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 데이터베이스 연결
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => APP_ENV === 'development' ? $e->getMessage() : null
            ]);
            exit();
        }
    }

    return $pdo;
}

/**
 * JSON 응답 전송
 */
function sendJsonResponse($success, $data = null, $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 입력값 검증 및 정제
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * 필수 파라미터 검증
 */
function validateRequired($params, $required) {
    foreach ($required as $field) {
        if (!isset($params[$field]) || (is_string($params[$field]) && trim($params[$field]) === '')) {
            sendJsonResponse(false, null, "필수 항목이 누락되었습니다: {$field}", 400);
            return false;
        }
    }
    return true;
}

/**
 * 페이지네이션 파라미터 가져오기
 */
function getPaginationParams() {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;

    return [
        'page' => $page,
        'limit' => $limit,
        'offset' => $offset
    ];
}

/**
 * JWT 토큰 생성 (간단한 버전)
 */
function generateToken($user_id, $username) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'user_id' => $user_id,
        'username' => $username,
        'exp' => time() + (86400 * 7) // 7일
    ]));

    $signature = hash_hmac('sha256', "$header.$payload", 'your-secret-key', true);
    $signature = base64_encode($signature);

    return "$header.$payload.$signature";
}

/**
 * JWT 토큰 검증
 */
function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    list($header, $payload, $signature) = $parts;

    $valid_signature = base64_encode(
        hash_hmac('sha256', "$header.$payload", 'your-secret-key', true)
    );

    if ($signature !== $valid_signature) {
        return false;
    }

    $payload_data = json_decode(base64_decode($payload), true);

    if ($payload_data['exp'] < time()) {
        return false; // 만료됨
    }

    return $payload_data;
}

/**
 * 로깅 함수
 */
function logActivity($user_id, $action, $details = null) {
    $log_file = __DIR__ . '/../../logs/activity.log';
    $log_dir = dirname($log_file);

    if (!is_dir($log_dir)) {
        mkdir($log_dir, 0755, true);
    }

    $log_entry = sprintf(
        "[%s] User: %d, Action: %s, Details: %s\n",
        date('Y-m-d H:i:s'),
        $user_id,
        $action,
        $details ? json_encode($details) : 'N/A'
    );

    file_put_contents($log_file, $log_entry, FILE_APPEND);
}

/**
 * 에러 핸들러
 */
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("Error [$errno]: $errstr in $errfile on line $errline");

    if (APP_ENV === 'development') {
        sendJsonResponse(false, null, "Error: $errstr", 500);
    } else {
        sendJsonResponse(false, null, "Internal server error", 500);
    }
});

/**
 * 예외 핸들러
 */
set_exception_handler(function($exception) {
    error_log("Exception: " . $exception->getMessage());

    if (APP_ENV === 'development') {
        sendJsonResponse(false, [
            'exception' => get_class($exception),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine()
        ], "Exception occurred", 500);
    } else {
        sendJsonResponse(false, null, "Internal server error", 500);
    }
});
