<?php
/**
 * Ratio Alive - 설정 파일
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경 설정
 */

// 에러 리포팅 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// CORS 설정 (개발 환경)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================
// 데이터베이스 설정
// ========================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_CHARSET', 'utf8mb4');

// ========================================
// Moodle 설정
// ========================================
define('MOODLE_VERSION', '3.7');
define('MOODLE_ROOT', '/var/www/html/moodle'); // Moodle 루트 경로
define('MOODLE_DATA', '/var/moodledata'); // Moodle 데이터 경로

// Moodle 테이블 프리픽스 (기본값: mdl_)
define('MOODLE_PREFIX', 'mdl_');

// ========================================
// 애플리케이션 설정
// ========================================
define('APP_NAME', 'Ratio Alive');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true); // 프로덕션에서는 false로 설정

// ========================================
// 세션 설정
// ========================================
define('SESSION_TIMEOUT', 3600); // 1시간
define('SESSION_NAME', 'ratio_alive_session');

// ========================================
// API 설정
// ========================================
define('API_VERSION', 'v1');
define('API_RATE_LIMIT', 100); // 시간당 요청 제한

// ========================================
// 데이터베이스 연결 함수
// ========================================
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
            logError("Database connection failed: " . $e->getMessage());

            if (APP_DEBUG) {
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]));
            } else {
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed'
                ]));
            }
        }
    }

    return $conn;
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * JSON 응답 출력
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 에러 로그 기록
 */
function logError($message, $context = []) {
    $logFile = __DIR__ . '/../logs/error.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? ' | Context: ' . json_encode($context) : '';
    $logMessage = "[{$timestamp}] {$message}{$contextStr}\n";

    error_log($logMessage, 3, $logFile);
}

/**
 * 활동 로그 기록
 */
function logActivity($action, $userId, $details = []) {
    $logFile = __DIR__ . '/../logs/activity.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $timestamp = date('Y-m-d H:i:s');
    $detailsStr = !empty($details) ? json_encode($details, JSON_UNESCAPED_UNICODE) : '{}';
    $logMessage = "[{$timestamp}] User: {$userId} | Action: {$action} | Details: {$detailsStr}\n";

    error_log($logMessage, 3, $logFile);
}

/**
 * 입력 데이터 정제
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }

    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');

    return $data;
}

/**
 * 세션 검증
 */
function validateSession($sessionId) {
    if (empty($sessionId)) {
        return false;
    }

    // 간단한 세션 검증 (실제로는 데이터베이스 확인 필요)
    // Moodle 세션과 연동해야 함
    return true; // 임시로 항상 true 반환
}

/**
 * 사용자 ID 가져오기
 */
function getUserIdFromSession($sessionId) {
    // Moodle 세션에서 사용자 ID 조회
    // 실제 구현 필요
    return 1; // 임시로 1 반환
}

/**
 * 데이터베이스 테이블 초기화
 */
function initializeTables() {
    $conn = getDBConnection();

    // ratio_alive_problems 테이블 생성
    $sql = "CREATE TABLE IF NOT EXISTS ratio_alive_problems (
        id INT AUTO_INCREMENT PRIMARY KEY,
        moodle_question_id INT,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(100),
        description TEXT,
        difficulty VARCHAR(50),
        instructions TEXT,
        initial_shape VARCHAR(50) DEFAULT 'triangle',
        initial_ratio VARCHAR(20) DEFAULT '3:4',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_moodle_qid (moodle_question_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    try {
        $conn->exec($sql);
    } catch (PDOException $e) {
        logError("Failed to create ratio_alive_problems table: " . $e->getMessage());
    }

    // ratio_alive_answers 테이블 생성
    $sql = "CREATE TABLE IF NOT EXISTS ratio_alive_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        problem_id INT NOT NULL,
        user_id INT NOT NULL,
        session_id VARCHAR(100),
        answer TEXT NOT NULL,
        current_ratio VARCHAR(20),
        current_shape VARCHAR(50),
        score DECIMAL(5,2) DEFAULT NULL,
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_problem (problem_id),
        INDEX idx_user (user_id),
        INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    try {
        $conn->exec($sql);
    } catch (PDOException $e) {
        logError("Failed to create ratio_alive_answers table: " . $e->getMessage());
    }
}

// 테이블 초기화 실행
if (APP_DEBUG) {
    initializeTables();
}
