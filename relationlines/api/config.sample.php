<?php
/**
 * Relation Lines - Database Configuration Sample
 *
 * 이 파일을 config.php로 복사한 후 실제 데이터베이스 정보를 입력하세요.
 * cp config.sample.php config.php
 */

// 에러 리포팅
// 개발 환경: E_ALL, 1
// 프로덕션 환경: 0, 0
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ========================================
// 데이터베이스 설정
// ========================================

// Moodle 데이터베이스 호스트
// 예: localhost, 127.0.0.1, db.example.com
define('DB_HOST', 'localhost');

// Moodle 데이터베이스 이름
// 기본값: moodle
define('DB_NAME', 'moodle');

// 데이터베이스 사용자명
define('DB_USER', 'moodle_user');

// 데이터베이스 비밀번호
define('DB_PASS', 'your_password_here');

// 문자 인코딩
// MySQL 5.7: utf8mb4 권장
define('DB_CHARSET', 'utf8mb4');

// Moodle 테이블 접두사
// Moodle 설치시 설정한 값 (보통 mdl_)
// config.php에서 $CFG->prefix 값 확인
define('MOODLE_PREFIX', 'mdl_');

// ========================================
// CORS 설정
// ========================================

// 허용할 도메인 (프로덕션에서는 구체적으로 지정 권장)
// 예: https://yourdomain.com
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================
// 데이터베이스 연결 함수
// ========================================

/**
 * PDO를 사용한 데이터베이스 연결
 * @return PDO|null
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * JSON 응답 반환
 * @param array $data 응답 데이터
 * @param int $statusCode HTTP 상태 코드
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 응답 반환
 * @param string $message 에러 메시지
 * @param int $statusCode HTTP 상태 코드
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'message' => $message,
        'error' => true
    ], $statusCode);
}

/**
 * 성공 응답 반환
 * @param mixed $data 응답 데이터
 * @param string $message 추가 메시지
 */
function sendSuccessResponse($data, $message = '') {
    $response = [
        'success' => true,
        'data' => $data
    ];

    if ($message) {
        $response['message'] = $message;
    }

    sendJsonResponse($response);
}

// ========================================
// Moodle 연동 설정
// ========================================

// Moodle 설치 경로 (필요시)
// define('MOODLE_PATH', '/var/www/html/moodle');

// Moodle 사용자 인증 사용 여부
// define('USE_MOODLE_AUTH', true);

// 세션 시작 (Moodle 세션 사용시)
// session_start();
