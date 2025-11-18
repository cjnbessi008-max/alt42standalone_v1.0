<?php
/**
 * Change Wave - Moodle 연동 설정
 *
 * PHP 7.1.9, MySQL 5.7, Moodle 3.7 호환
 */

// 오류 보고 설정 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 문자 인코딩
header('Content-Type: application/json; charset=utf-8');

// CORS 설정 (필요시)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ===== Moodle 데이터베이스 연결 정보 =====
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
define('MOODLE_DB_CHARSET', 'utf8mb4');

// ===== Change Wave 전용 데이터베이스 연결 정보 =====
define('CHANGEWAVE_DB_HOST', 'localhost');
define('CHANGEWAVE_DB_NAME', 'changewave');
define('CHANGEWAVE_DB_USER', 'changewave_user');
define('CHANGEWAVE_DB_PASS', 'changewave_password');
define('CHANGEWAVE_DB_CHARSET', 'utf8mb4');

// ===== Moodle 설정 =====
define('MOODLE_TABLE_PREFIX', 'mdl_');  // Moodle 테이블 접두사
define('MOODLE_VERSION', '3.7');

// ===== 애플리케이션 설정 =====
define('APP_NAME', 'Change Wave');
define('APP_VERSION', '1.0.0');
define('DEBUG_MODE', true);  // 운영 환경에서는 false로 설정

/**
 * Moodle 데이터베이스 연결
 *
 * @return mysqli|null
 */
function getMoodleConnection() {
    try {
        $conn = new mysqli(
            MOODLE_DB_HOST,
            MOODLE_DB_USER,
            MOODLE_DB_PASS,
            MOODLE_DB_NAME
        );

        if ($conn->connect_error) {
            throw new Exception('Moodle DB 연결 실패: ' . $conn->connect_error);
        }

        // 문자 인코딩 설정
        $conn->set_charset(MOODLE_DB_CHARSET);

        return $conn;

    } catch (Exception $e) {
        logError('getMoodleConnection', $e->getMessage());
        return null;
    }
}

/**
 * Change Wave 데이터베이스 연결
 *
 * @return mysqli|null
 */
function getChangeWaveConnection() {
    try {
        $conn = new mysqli(
            CHANGEWAVE_DB_HOST,
            CHANGEWAVE_DB_USER,
            CHANGEWAVE_DB_PASS,
            CHANGEWAVE_DB_NAME
        );

        if ($conn->connect_error) {
            throw new Exception('ChangeWave DB 연결 실패: ' . $conn->connect_error);
        }

        // 문자 인코딩 설정
        $conn->set_charset(CHANGEWAVE_DB_CHARSET);

        return $conn;

    } catch (Exception $e) {
        logError('getChangeWaveConnection', $e->getMessage());
        return null;
    }
}

/**
 * JSON 응답 출력
 *
 * @param mixed $data 응답 데이터
 * @param int $statusCode HTTP 상태 코드
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * 에러 응답 출력
 *
 * @param string $message 에러 메시지
 * @param int $statusCode HTTP 상태 코드
 */
function sendErrorResponse($message, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], $statusCode);
}

/**
 * 성공 응답 출력
 *
 * @param mixed $data 응답 데이터
 */
function sendSuccessResponse($data) {
    sendJsonResponse([
        'success' => true,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], 200);
}

/**
 * 로그 기록
 *
 * @param string $context 컨텍스트
 * @param string $message 메시지
 */
function logError($context, $message) {
    if (DEBUG_MODE) {
        $logMessage = sprintf(
            "[%s] [%s] %s\n",
            date('Y-m-d H:i:s'),
            $context,
            $message
        );

        error_log($logMessage, 3, __DIR__ . '/error.log');
    }
}

/**
 * SQL 인젝션 방지를 위한 입력 검증
 *
 * @param mysqli $conn DB 연결
 * @param string $input 입력값
 * @return string
 */
function sanitizeInput($conn, $input) {
    return $conn->real_escape_string(trim($input));
}

/**
 * GET 파라미터 가져오기
 *
 * @param string $key 파라미터 키
 * @param mixed $default 기본값
 * @return mixed
 */
function getParam($key, $default = null) {
    return isset($_GET[$key]) ? $_GET[$key] : $default;
}

/**
 * POST 파라미터 가져오기
 *
 * @param string $key 파라미터 키
 * @param mixed $default 기본값
 * @return mixed
 */
function postParam($key, $default = null) {
    return isset($_POST[$key]) ? $_POST[$key] : $default;
}

// 세션 시작 (필요시)
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
