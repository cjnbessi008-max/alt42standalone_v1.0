<?php
/**
 * Ratio Alive - 설정 파일 예제
 * 이 파일을 config.php로 복사하여 실제 설정을 입력하세요.
 */

// ========================================
// 데이터베이스 설정
// ========================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here'); // 실제 비밀번호로 변경하세요
define('DB_CHARSET', 'utf8mb4');

// ========================================
// Moodle 설정
// ========================================
define('MOODLE_VERSION', '3.7');
define('MOODLE_ROOT', '/var/www/html/moodle'); // Moodle 설치 경로
define('MOODLE_DATA', '/var/moodledata'); // Moodle 데이터 디렉토리

// Moodle 테이블 프리픽스
define('MOODLE_PREFIX', 'mdl_');

// ========================================
// 애플리케이션 설정
// ========================================
define('APP_NAME', 'Ratio Alive');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true); // 프로덕션: false, 개발: true

// ========================================
// 보안 설정
// ========================================
define('SESSION_TIMEOUT', 3600); // 1시간 (초 단위)
define('SESSION_NAME', 'ratio_alive_session');
define('API_RATE_LIMIT', 100); // 시간당 요청 제한

// ========================================
// CORS 설정
// ========================================
// 허용할 도메인 (프로덕션에서는 구체적으로 지정)
define('ALLOWED_ORIGINS', ['*']); // 예: ['https://moodle.example.com']
