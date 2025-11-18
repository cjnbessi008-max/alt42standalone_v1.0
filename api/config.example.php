<?php
/**
 * Moodle LMS 연결 설정 예제
 *
 * 사용 방법:
 * 1. 이 파일을 config.php로 복사
 * 2. 아래 설정값들을 실제 환경에 맞게 수정
 * 3. DEV_MODE를 false로 변경하여 실제 모드 활성화
 */

// 데이터베이스 설정
define('DB_HOST', 'localhost');          // MySQL 호스트
define('DB_NAME', 'moodle');             // Moodle 데이터베이스 이름
define('DB_USER', 'moodle_user');        // 데이터베이스 사용자명
define('DB_PASS', 'your_password_here'); // 데이터베이스 비밀번호
define('DB_CHARSET', 'utf8mb4');         // 문자 인코딩

// Moodle 설정
define('MOODLE_URL', 'http://your-moodle-site.com');  // Moodle 사이트 URL
define('MOODLE_TOKEN', 'your_moodle_webservice_token_here'); // WebService 토큰

// 개발 모드
// true: 실제 DB 연결 없이 샘플 데이터로 동작
// false: 실제 Moodle DB 연결
define('DEV_MODE', true);

// 에러 리포팅 (개발 중)
if (DEV_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

/**
 * 데이터베이스 연결
 */
function getDBConnection() {
    if (DEV_MODE) {
        return null;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        logError("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * Moodle Web Service API 호출
 */
function callMoodleAPI($functionName, $params = []) {
    if (DEV_MODE) {
        return ['success' => true, 'data' => []];
    }

    $url = MOODLE_URL . '/webservice/rest/server.php';

    $postData = array_merge([
        'wstoken' => MOODLE_TOKEN,
        'wsfunction' => $functionName,
        'moodlewsrestformat' => 'json'
    ], $params);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        logError("Moodle API call failed: HTTP $httpCode");
        return ['success' => false, 'error' => 'API call failed'];
    }

    $data = json_decode($response, true);
    return ['success' => true, 'data' => $data];
}

/**
 * JSON 응답 전송
 */
function sendJSONResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 에러 로깅
 */
function logError($message) {
    $logFile = __DIR__ . '/error.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

/**
 * 입력 값 검증 및 정제
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
