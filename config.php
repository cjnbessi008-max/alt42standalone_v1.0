<?php
/**
 * Moodle LMS 연동 설정
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7
 */

// Moodle 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'moodle_pass');
define('DB_CHARSET', 'utf8mb4');

// Moodle 설정 경로 (실제 Moodle 설치 경로로 변경 필요)
define('MOODLE_DIR', '/path/to/moodle');

// 앱 설정
define('APP_NAME', 'Boundary Slider');
define('APP_VERSION', '1.0.0');

// 데이터베이스 연결
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
