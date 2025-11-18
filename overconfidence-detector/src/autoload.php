<?php
/**
 * Autoloader
 * PSR-4 기반 클래스 자동 로딩
 */

spl_autoload_register(function ($class) {
    // 네임스페이스 접두사
    $prefix = 'OverconfidenceDetector\\';

    // 베이스 디렉토리
    $baseDir = __DIR__ . '/';

    // 클래스가 접두사를 사용하는지 확인
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // 상대 클래스 이름 가져오기
    $relativeClass = substr($class, $len);

    // 파일 경로 생성
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // 파일이 존재하면 로드
    if (file_exists($file)) {
        require $file;
    }
});

// 설정 로드
date_default_timezone_set('Asia/Seoul');

// 에러 리포팅 (프로덕션에서는 off)
$appConfig = require __DIR__ . '/../config/app.php';
if ($appConfig['app']['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// 세션 시작
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
