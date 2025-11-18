<?php
/**
 * Database Configuration
 * MySQL 연결 설정
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'ratio_spring_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle web service token

// 보안 설정
define('API_SECRET_KEY', 'your-secret-key-here'); // 실제 배포 시 변경
define('ALLOWED_ORIGINS', 'http://localhost:8080,http://localhost'); // CORS 허용 origin

// 에러 리포팅 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * 데이터베이스 연결
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }

    return $pdo;
}

/**
 * CORS 헤더 설정
 */
function setCORSHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = explode(',', ALLOWED_ORIGINS);

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Max-Age: 3600");

    // OPTIONS 요청 처리
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * JSON 응답 전송
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답 전송
 */
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}

/**
 * 성공 응답 전송
 */
function sendSuccess($message, $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJSON($response);
}

/**
 * 입력 검증
 */
function validateInput($input, $rules) {
    $errors = [];

    foreach ($rules as $field => $rule) {
        if ($rule['required'] && !isset($input[$field])) {
            $errors[] = "$field is required";
            continue;
        }

        if (isset($input[$field])) {
            $value = $input[$field];

            // 타입 검증
            if (isset($rule['type'])) {
                switch ($rule['type']) {
                    case 'int':
                        if (!is_numeric($value) || intval($value) != $value) {
                            $errors[] = "$field must be an integer";
                        }
                        break;
                    case 'string':
                        if (!is_string($value)) {
                            $errors[] = "$field must be a string";
                        }
                        break;
                }
            }

            // 범위 검증
            if (isset($rule['min']) && $value < $rule['min']) {
                $errors[] = "$field must be at least {$rule['min']}";
            }
            if (isset($rule['max']) && $value > $rule['max']) {
                $errors[] = "$field must be at most {$rule['max']}";
            }
        }
    }

    return $errors;
}

/**
 * 인증 토큰 검증
 */
function validateToken($token) {
    // 간단한 토큰 검증 (실제 환경에서는 더 강력한 검증 필요)
    if (empty($token)) {
        return false;
    }

    // TODO: 데이터베이스 또는 Moodle과 토큰 검증
    return true;
}

/**
 * Authorization 헤더에서 토큰 추출
 */
function getAuthToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return $matches[1];
    }

    return null;
}
