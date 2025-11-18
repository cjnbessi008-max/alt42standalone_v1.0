<?php
/**
 * Moodle LMS 개념-문제 매칭 시스템 설정 파일
 * PHP 7.1.9, MySQL 5.7, Moodle 3.7
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'concept_problem_matching');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 데이터베이스 설정 (별도 연결)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_'); // Moodle 테이블 접두사

// Moodle 설정
define('MOODLE_VERSION', '3.7');
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_API_TOKEN', ''); // Moodle Web Service Token

// 애플리케이션 설정
define('APP_NAME', 'Concept-Problem Matching System');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/concept-matching');
define('APP_TIMEZONE', 'Asia/Seoul');

// 디버그 설정
define('DEBUG_MODE', true);
define('ERROR_REPORTING', E_ALL);

// 세션 설정
define('SESSION_LIFETIME', 3600); // 1시간

// API 설정
define('API_RATE_LIMIT', 100); // 시간당 요청 제한
define('API_TIMEOUT', 30); // 초

// 캐시 설정
define('CACHE_ENABLED', true);
define('CACHE_LIFETIME', 300); // 5분

// 파일 업로드 설정
define('MAX_UPLOAD_SIZE', 5242880); // 5MB

// 시각화 설정
define('GRAPH_MAX_NODES', 100); // 그래프 최대 노드 수
define('GRAPH_DEFAULT_LAYOUT', 'force'); // force, hierarchical, circular

// 로깅 설정
define('LOG_ENABLED', true);
define('LOG_PATH', __DIR__ . '/../logs/');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR

// 타임존 설정
date_default_timezone_set(APP_TIMEZONE);

// 에러 리포팅 설정
if (DEBUG_MODE) {
    error_reporting(ERROR_REPORTING);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 자동 로드 함수
spl_autoload_register(function ($class) {
    $baseDir = __DIR__ . '/../src/backend/';
    $paths = [
        'models/',
        'utils/',
        'api/'
    ];

    foreach ($paths as $path) {
        $file = $baseDir . $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// 설정 검증 함수
function validateConfig() {
    $required = [
        'DB_HOST', 'DB_NAME', 'DB_USER',
        'MOODLE_DB_HOST', 'MOODLE_DB_NAME', 'MOODLE_DB_USER'
    ];

    foreach ($required as $const) {
        if (!defined($const) || empty(constant($const))) {
            throw new Exception("Required configuration missing: {$const}");
        }
    }

    return true;
}

// 로그 디렉토리 생성
if (LOG_ENABLED && !is_dir(LOG_PATH)) {
    mkdir(LOG_PATH, 0755, true);
}
