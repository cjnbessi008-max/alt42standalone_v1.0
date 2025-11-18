<?php
/**
 * Concentration Analyzer - Configuration File
 *
 * MySQL 5.7 + PHP 7.1.9 + Moodle 3.7 Integration
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'concentration_analyzer');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle Database Configuration (for data sync)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_');

// Application Settings
define('APP_NAME', 'Concentration Analyzer');
define('APP_VERSION', '1.0.0');
define('TIMEZONE', 'Asia/Seoul');

// Analysis Settings
define('CONCENTRATION_WINDOW_MINUTES', 5);  // 집중도 계산 시간 윈도우 (분)
define('FLUCTUATION_THRESHOLD', 1.5);       // 들쭉날쭉 탐지 임계값 (표준편차 배수)
define('MIN_ACTIVITY_THRESHOLD', 3);        // 최소 활동 횟수
define('MOVING_AVERAGE_PERIOD', 3);         // 이동평균 기간

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_start();

// Timezone
date_default_timezone_set(TIMEZONE);

// Error Reporting (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Helper Functions
function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $script = dirname($_SERVER['SCRIPT_NAME']);
    return $protocol . '://' . $host . $script;
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}
