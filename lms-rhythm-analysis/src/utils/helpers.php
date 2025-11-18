<?php
/**
 * Helper Utility Functions
 */

/**
 * Format seconds to human readable time
 * @param int $seconds
 * @return string
 */
function formatTime($seconds) {
    if ($seconds < 60) {
        return $seconds . '초';
    } else if ($seconds < 3600) {
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        return $minutes . '분 ' . $secs . '초';
    } else {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        return $hours . '시간 ' . $minutes . '분';
    }
}

/**
 * Format score display
 * @param float $score
 * @param float $max_score
 * @return string
 */
function formatScore($score, $max_score) {
    if ($max_score == 0) {
        return 'N/A';
    }
    $percentage = ($score / $max_score) * 100;
    return sprintf('%.1f%%', $percentage);
}

/**
 * Get pattern type in Korean
 * @param string $pattern_type
 * @return string
 */
function getPatternTypeKorean($pattern_type) {
    $types = [
        'daily' => '일일 학습형',
        'weekly' => '주간 학습형',
        'concentrated' => '집중형',
        'distributed' => '분산형'
    ];
    return $types[$pattern_type] ?? $pattern_type;
}

/**
 * Get routine type in Korean
 * @param string $routine_type
 * @return string
 */
function getRoutineTypeKorean($routine_type) {
    $types = [
        'quick_thinker' => '빠른 사고형',
        'deliberate_thinker' => '신중한 사고형',
        'varied' => '다양한 사고형'
    ];
    return $types[$routine_type] ?? $routine_type;
}

/**
 * Get revision pattern in Korean
 * @param string $revision_pattern
 * @return string
 */
function getRevisionPatternKorean($revision_pattern) {
    $patterns = [
        'minimal' => '최소 반복형',
        'moderate' => '적절한 반복형',
        'extensive' => '적극적 반복형'
    ];
    return $patterns[$revision_pattern] ?? $revision_pattern;
}

/**
 * Get problem solving approach in Korean
 * @param string $approach
 * @return string
 */
function getApproachKorean($approach) {
    $approaches = [
        'sequential' => '순차적 접근',
        'selective' => '선택적 접근',
        'random' => '무작위 접근',
        'unknown' => '알 수 없음'
    ];
    return $approaches[$approach] ?? $approach;
}

/**
 * Get score color class based on value
 * @param float $score
 * @return string CSS class name
 */
function getScoreColorClass($score) {
    if ($score >= 80) return 'score-excellent';
    if ($score >= 60) return 'score-good';
    if ($score >= 40) return 'score-fair';
    return 'score-poor';
}

/**
 * Sanitize output for HTML
 * @param string $text
 * @return string
 */
function e($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

/**
 * Format date in Korean style
 * @param string $date
 * @return string
 */
function formatDateKorean($date) {
    $timestamp = strtotime($date);
    return date('Y년 m월 d일', $timestamp);
}

/**
 * Get day of week in Korean
 * @param int $day_number 0=Sunday, 6=Saturday
 * @return string
 */
function getDayOfWeekKorean($day_number) {
    $days = ['일', '월', '화', '수', '목', '금', '토'];
    return $days[$day_number] ?? '';
}

/**
 * Check if user is logged in
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Get current user ID from session
 * @return int|null
 */
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

/**
 * Redirect to URL
 * @param string $url
 */
function redirect($url) {
    header("Location: $url");
    exit;
}

/**
 * Set flash message
 * @param string $type 'success', 'error', 'info', 'warning'
 * @param string $message
 */
function setFlashMessage($type, $message) {
    $_SESSION['flash_message'] = [
        'type' => $type,
        'message' => $message
    ];
}

/**
 * Get and clear flash message
 * @return array|null
 */
function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = $_SESSION['flash_message'];
        unset($_SESSION['flash_message']);
        return $message;
    }
    return null;
}

/**
 * JSON response
 * @param array $data
 * @param int $status_code
 */
function jsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
