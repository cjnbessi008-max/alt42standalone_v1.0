<?php
/**
 * Pattern Loop Animation System Configuration
 * Compatible with PHP 7.1.9, MySQL 5.7, Moodle 3.7
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'pattern_loop_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Moodle 연동 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'root');
define('MOODLE_DB_PASS', '');
define('MOODLE_DB_PREFIX', 'mdl_');

// Moodle API 설정 (REST API 사용 시)
define('MOODLE_URL', 'http://localhost/moodle');
define('MOODLE_TOKEN', ''); // Moodle에서 발급받은 웹 서비스 토큰

// 애플리케이션 설정
define('APP_NAME', 'Pattern Loop Animation System');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost/alt42standalone_v1.0');

// 애니메이션 설정
define('DEFAULT_CANVAS_WIDTH', 360);
define('DEFAULT_CANVAS_HEIGHT', 640);
define('ANIMATION_FPS', 60);
define('MAX_PATTERNS', 5);

// 세션 설정
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_start();

// 에러 리포팅 (개발 환경)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 타임존 설정
date_default_timezone_set('Asia/Seoul');

// 데이터베이스 연결 함수
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
            die("Database connection failed");
        }
    }

    return $pdo;
}

// Moodle 데이터베이스 연결 함수
function getMoodleDBConnection() {
    static $moodle_pdo = null;

    if ($moodle_pdo === null) {
        try {
            $dsn = "mysql:host=" . MOODLE_DB_HOST . ";dbname=" . MOODLE_DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $moodle_pdo = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Moodle database connection failed: " . $e->getMessage());
            return null;
        }
    }

    return $moodle_pdo;
}

// 자동 로드 함수
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/../models/',
        __DIR__ . '/../controllers/',
    ];

    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});
