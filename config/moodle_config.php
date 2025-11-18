<?php
/**
 * Moodle LMS 연동 설정 파일
 *
 * Moodle 3.7 (MySQL 5.7, PHP 7.1.9) 환경을 위한 데이터베이스 연결 설정
 *
 * @package    Alt42Standalone
 * @version    1.0
 * @author     KAIST Touch Math Academy
 */

// Moodle 데이터베이스 연결 설정
define('MOODLE_DB_HOST', getenv('MOODLE_DB_HOST') ?: 'localhost');
define('MOODLE_DB_PORT', getenv('MOODLE_DB_PORT') ?: '3306');
define('MOODLE_DB_NAME', getenv('MOODLE_DB_NAME') ?: 'moodle');
define('MOODLE_DB_USER', getenv('MOODLE_DB_USER') ?: 'moodle_user');
define('MOODLE_DB_PASS', getenv('MOODLE_DB_PASS') ?: '');
define('MOODLE_DB_CHARSET', 'utf8mb4');
define('MOODLE_DB_COLLATION', 'utf8mb4_unicode_ci');

// Moodle 테이블 접두사 (기본값: mdl_)
define('MOODLE_TABLE_PREFIX', getenv('MOODLE_TABLE_PREFIX') ?: 'mdl_');

// Moodle Web Services 설정
define('MOODLE_WS_URL', getenv('MOODLE_WS_URL') ?: 'http://localhost/moodle/webservice/rest/server.php');
define('MOODLE_WS_TOKEN', getenv('MOODLE_WS_TOKEN') ?: '');

// Moodle 시스템 경로
define('MOODLE_DIR_ROOT', getenv('MOODLE_DIR_ROOT') ?: '/var/www/moodle');
define('MOODLE_DATA_ROOT', getenv('MOODLE_DATA_ROOT') ?: '/var/moodledata');

// 세션 설정
define('SESSION_TIMEOUT', 7200); // 2시간 (초 단위)
define('SESSION_NAME', 'ALT42_MOODLE_SESSION');

// 디버그 모드
define('DEBUG_MODE', getenv('DEBUG_MODE') === 'true');
define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'INFO'); // DEBUG, INFO, WARNING, ERROR

// 연동 설정
define('SYNC_INTERVAL', 300); // 동기화 간격 (5분, 초 단위)
define('ENABLE_AUTO_SYNC', getenv('ENABLE_AUTO_SYNC') !== 'false');

// 에러 리포팅 설정
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ERROR | E_WARNING);
    ini_set('display_errors', '0');
}

// 타임존 설정
date_default_timezone_set(getenv('TIMEZONE') ?: 'Asia/Seoul');

// 연동 모드 설정
define('INTEGRATION_MODE', getenv('INTEGRATION_MODE') ?: 'HYBRID');
// 옵션: 'DIRECT' (직접 DB 접근), 'API' (Web Services만), 'HYBRID' (둘 다 사용)

return [
    'database' => [
        'host' => MOODLE_DB_HOST,
        'port' => MOODLE_DB_PORT,
        'name' => MOODLE_DB_NAME,
        'user' => MOODLE_DB_USER,
        'pass' => MOODLE_DB_PASS,
        'charset' => MOODLE_DB_CHARSET,
        'collation' => MOODLE_DB_COLLATION,
        'prefix' => MOODLE_TABLE_PREFIX
    ],
    'webservice' => [
        'url' => MOODLE_WS_URL,
        'token' => MOODLE_WS_TOKEN
    ],
    'paths' => [
        'root' => MOODLE_DIR_ROOT,
        'data' => MOODLE_DATA_ROOT
    ],
    'session' => [
        'timeout' => SESSION_TIMEOUT,
        'name' => SESSION_NAME
    ],
    'sync' => [
        'interval' => SYNC_INTERVAL,
        'auto_enabled' => ENABLE_AUTO_SYNC
    ],
    'debug' => [
        'enabled' => DEBUG_MODE,
        'log_level' => LOG_LEVEL
    ],
    'integration' => [
        'mode' => INTEGRATION_MODE
    ]
];
