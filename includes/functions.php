<?php
/**
 * Common Functions
 * 공통 유틸리티 함수
 */

/**
 * JSON 성공 응답 전송
 * @param mixed $data 응답 데이터
 * @param int $httpCode HTTP 상태 코드
 */
function sendSuccess($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * JSON 에러 응답 전송
 * @param string $message 에러 메시지
 * @param int $httpCode HTTP 상태 코드
 */
function sendError($message, $httpCode = 400) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => $message
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * 입력값 검증
 * @param array $data 검증할 데이터
 * @param array $required 필수 필드 배열
 * @return bool 검증 성공 여부
 */
function validateInput($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Missing required field: {$field}", 400);
        }
    }
    return true;
}

/**
 * 안전한 HTML 출력
 * @param string $text 출력할 텍스트
 * @return string 이스케이프된 텍스트
 */
function escapeHtml($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

/**
 * SQL 인젝션 방지를 위한 입력 정제
 * @param string $input 입력값
 * @return string 정제된 입력값
 */
function sanitizeInput($input) {
    return filter_var($input, FILTER_SANITIZE_STRING);
}

/**
 * 날짜 형식 변환
 * @param string $date 날짜 문자열
 * @param string $format 출력 형식
 * @return string 형식화된 날짜
 */
function formatDate($date, $format = 'Y-m-d H:i:s') {
    if (empty($date)) {
        return '';
    }
    $timestamp = strtotime($date);
    return date($format, $timestamp);
}

/**
 * 한국어 날짜 형식
 * @param string $date 날짜 문자열
 * @return string 한국어 날짜
 */
function formatKoreanDate($date) {
    if (empty($date)) {
        return '';
    }
    $timestamp = strtotime($date);
    return date('Y년 m월 d일 H시 i분', $timestamp);
}

/**
 * 시간 경과 표시 (예: "3분 전", "2시간 전")
 * @param string $date 날짜 문자열
 * @return string 경과 시간
 */
function timeAgo($date) {
    if (empty($date)) {
        return '';
    }

    $timestamp = strtotime($date);
    $diff = time() - $timestamp;

    if ($diff < 60) {
        return '방금 전';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . '분 전';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . '시간 전';
    } elseif ($diff < 2592000) {
        return floor($diff / 86400) . '일 전';
    } else {
        return formatKoreanDate($date);
    }
}

/**
 * 배열을 안전한 JSON으로 변환
 * @param array $array 배열
 * @return string JSON 문자열
 */
function safeJsonEncode($array) {
    return json_encode($array, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * JSON 문자열을 배열로 변환
 * @param string $json JSON 문자열
 * @return array|null 배열 또는 null
 */
function safeJsonDecode($json) {
    if (empty($json)) {
        return null;
    }
    return json_decode($json, true);
}

/**
 * 난이도 레벨을 한글로 변환
 * @param string $level 난이도 ('basic', 'intermediate', 'advanced')
 * @return string 한글 난이도
 */
function difficultyToKorean($level) {
    $map = [
        'basic' => '기초',
        'intermediate' => '중급',
        'advanced' => '고급'
    ];
    return $map[$level] ?? $level;
}

/**
 * 통계 개념 카테고리를 한글로 변환
 * @param string $category 카테고리
 * @return string 한글 카테고리
 */
function categoryToKorean($category) {
    $map = [
        'descriptive' => '기술통계',
        'probability' => '확률',
        'inference' => '추론통계',
        'correlation' => '상관분석'
    ];
    return $map[$category] ?? $category;
}

/**
 * 로그 기록
 * @param string $message 로그 메시지
 * @param string $level 로그 레벨 ('info', 'warning', 'error')
 */
function logMessage($message, $level = 'info') {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] [{$level}] {$message}\n";

    $logFile = __DIR__ . '/../logs/app.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    file_put_contents($logFile, $logMessage, FILE_APPEND);

    if ($level === 'error') {
        error_log($logMessage);
    }
}

/**
 * 디버그 출력
 * @param mixed $data 출력할 데이터
 * @param string $label 라벨
 */
function debug($data, $label = 'DEBUG') {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        $output = "[{$label}] " . print_r($data, true) . "\n";
        logMessage($output, 'debug');
    }
}

/**
 * 세션 시작
 */
function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * 사용자 인증 확인
 * @return array|null 사용자 정보 또는 null
 */
function getAuthenticatedUser() {
    initSession();
    return $_SESSION['user'] ?? null;
}

/**
 * 사용자 인증 설정
 * @param array $user 사용자 정보
 */
function setAuthenticatedUser($user) {
    initSession();
    $_SESSION['user'] = $user;
}

/**
 * 로그아웃
 */
function logout() {
    initSession();
    session_destroy();
}

/**
 * JWT 토큰 생성 (간단한 구현)
 * @param array $payload 페이로드
 * @param string $secret 시크릿 키
 * @return string JWT 토큰
 */
function createJWT($payload, $secret = 'your-secret-key') {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode($payload);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

/**
 * JWT 토큰 검증
 * @param string $jwt JWT 토큰
 * @param string $secret 시크릿 키
 * @return array|null 페이로드 또는 null
 */
function verifyJWT($jwt, $secret = 'your-secret-key') {
    $parts = explode('.', $jwt);

    if (count($parts) !== 3) {
        return null;
    }

    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64UrlSignature !== $base64UrlSignatureCheck) {
        return null;
    }

    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload));
    return json_decode($payload, true);
}

/**
 * 퍼센트 계산
 * @param int $part 부분
 * @param int $total 전체
 * @param int $decimals 소수점 자리수
 * @return float 퍼센트
 */
function calculatePercentage($part, $total, $decimals = 1) {
    if ($total == 0) {
        return 0;
    }
    return round(($part / $total) * 100, $decimals);
}

/**
 * 배열에서 특정 키의 값만 추출
 * @param array $array 배열
 * @param string $key 키
 * @return array 값 배열
 */
function pluck($array, $key) {
    return array_map(function($item) use ($key) {
        return $item[$key] ?? null;
    }, $array);
}

/**
 * 배열을 특정 키로 그룹화
 * @param array $array 배열
 * @param string $key 그룹화할 키
 * @return array 그룹화된 배열
 */
function groupBy($array, $key) {
    $result = [];
    foreach ($array as $item) {
        $groupKey = $item[$key] ?? 'unknown';
        $result[$groupKey][] = $item;
    }
    return $result;
}

/**
 * 랜덤 문자열 생성
 * @param int $length 길이
 * @return string 랜덤 문자열
 */
function generateRandomString($length = 16) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';

    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }

    return $randomString;
}

/**
 * 파일 업로드 처리
 * @param array $file $_FILES의 파일 정보
 * @param string $uploadDir 업로드 디렉토리
 * @param array $allowedTypes 허용된 MIME 타입
 * @return string|false 업로드된 파일 경로 또는 false
 */
function handleFileUpload($file, $uploadDir, $allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
    if (!isset($file['error']) || is_array($file['error'])) {
        return false;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }

    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $filename = uniqid() . '_' . basename($file['name']);
    $destination = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return false;
    }

    return $destination;
}

/**
 * 통계 계산 함수들
 */

/**
 * 평균 계산
 * @param array $data 데이터 배열
 * @return float 평균
 */
function calculateMean($data) {
    if (empty($data)) {
        return 0;
    }
    return array_sum($data) / count($data);
}

/**
 * 중앙값 계산
 * @param array $data 데이터 배열
 * @return float 중앙값
 */
function calculateMedian($data) {
    if (empty($data)) {
        return 0;
    }

    sort($data);
    $count = count($data);
    $middle = floor($count / 2);

    if ($count % 2 == 0) {
        return ($data[$middle - 1] + $data[$middle]) / 2;
    } else {
        return $data[$middle];
    }
}

/**
 * 최빈값 계산
 * @param array $data 데이터 배열
 * @return mixed 최빈값
 */
function calculateMode($data) {
    if (empty($data)) {
        return null;
    }

    $frequency = array_count_values($data);
    $maxFrequency = max($frequency);

    return array_search($maxFrequency, $frequency);
}

/**
 * 분산 계산
 * @param array $data 데이터 배열
 * @return float 분산
 */
function calculateVariance($data) {
    if (empty($data)) {
        return 0;
    }

    $mean = calculateMean($data);
    $sumSquaredDiff = 0;

    foreach ($data as $value) {
        $sumSquaredDiff += pow($value - $mean, 2);
    }

    return $sumSquaredDiff / count($data);
}

/**
 * 표준편차 계산
 * @param array $data 데이터 배열
 * @return float 표준편차
 */
function calculateStandardDeviation($data) {
    return sqrt(calculateVariance($data));
}
