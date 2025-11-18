<?php
/**
 * Next Term Vision - Database Configuration
 * PHP 7.1.9 Compatible
 * MySQL 5.7
 */

// 데이터베이스 설정 (실제 사용 시 수정 필요)
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');  // Moodle 데이터베이스 이름
define('DB_USER', 'moodle_user');
define('DB_PASS', 'password');
define('DB_CHARSET', 'utf8mb4');

// CORS 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * 데이터베이스 연결 함수
 * @return PDO
 */
function getDbConnection() {
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
        error_log("Database Connection Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed'
        ]);
        exit();
    }
}

/**
 * JSON 응답 전송
 * @param bool $success
 * @param mixed $data
 * @param string $message
 * @param int $code
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
 * @param mixed $data
 * @return mixed
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * 필수 파라미터 검증
 * @param array $params
 * @param array $required
 * @return bool
 */
function validateRequired($params, $required) {
    foreach ($required as $field) {
        if (!isset($params[$field]) || empty($params[$field])) {
            sendJsonResponse(false, null, "Required field missing: {$field}", 400);
            return false;
        }
    }
    return true;
}
