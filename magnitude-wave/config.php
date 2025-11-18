<?php
/**
 * Moodle Integration Configuration
 *
 * Moodle 3.7 + MySQL 5.7 + PHP 7.1.9 환경 설정
 */

// Moodle 설정 파일 로드
// Moodle의 config.php 경로를 지정하세요
define('MOODLE_PATH', '/path/to/moodle');  // 실제 Moodle 설치 경로로 변경

// Moodle config 파일이 있으면 로드
if (file_exists(MOODLE_PATH . '/config.php')) {
    require_once(MOODLE_PATH . '/config.php');
    require_once($CFG->libdir . '/setuplib.php');
} else {
    // 독립 실행 모드 (Moodle 없이 실행)
    define('STANDALONE_MODE', true);

    // 독립 모드 데이터베이스 설정
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'magnitude_wave_db');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_CHARSET', 'utf8mb4');
}

// 앱 설정
define('APP_NAME', 'Magnitude Wave Visualizer');
define('APP_VERSION', '1.0.0');

// CORS 설정 (필요한 경우)
define('ALLOW_CORS', true);
define('CORS_ORIGIN', '*'); // 프로덕션에서는 특정 도메인으로 제한

// 로깅 설정
define('ENABLE_LOGGING', true);
define('LOG_FILE', __DIR__ . '/logs/app.log');

// 세션 설정
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

/**
 * 데이터베이스 연결 (독립 모드용)
 */
function getDbConnection() {
    if (defined('STANDALONE_MODE') && STANDALONE_MODE) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            return $pdo;
        } catch (PDOException $e) {
            logError("Database connection failed: " . $e->getMessage());
            return null;
        }
    } else {
        // Moodle 모드에서는 Moodle의 DB 객체 사용
        global $DB;
        return $DB;
    }
}

/**
 * CORS 헤더 설정
 */
function setCorsHeaders() {
    if (ALLOW_CORS) {
        header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");

        // OPTIONS 요청 처리
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}

/**
 * JSON 응답 출력
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 로깅
 */
function logError($message) {
    if (ENABLE_LOGGING) {
        $logDir = dirname(LOG_FILE);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] ERROR: {$message}\n";
        error_log($logMessage, 3, LOG_FILE);
    }
}

/**
 * 디버그 로깅
 */
function logDebug($message) {
    if (ENABLE_LOGGING) {
        $logDir = dirname(LOG_FILE);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] DEBUG: {$message}\n";
        error_log($logMessage, 3, LOG_FILE);
    }
}

/**
 * 사용자 인증 확인
 */
function checkAuthentication() {
    if (defined('STANDALONE_MODE') && STANDALONE_MODE) {
        // 독립 모드에서는 인증 생략 (데모용)
        return true;
    } else {
        // Moodle 모드에서는 로그인 확인
        require_login();
        return true;
    }
}

// CORS 헤더 설정
setCorsHeaders();
