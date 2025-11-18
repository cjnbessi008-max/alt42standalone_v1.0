<?php
/**
 * Common Helper Functions
 *
 * @package InvariantFinder
 */

defined('APP_ACCESS') or die('Direct access not permitted');

/**
 * Sanitize input data
 */
function clean($data) {
    if (is_array($data)) {
        return array_map('clean', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Redirect to a URL
 */
function redirect($url, $statusCode = 302) {
    header("Location: $url", true, $statusCode);
    exit;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Require login - redirect to login page if not authenticated
 */
function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'];
        redirect('login.php');
    }
}

/**
 * Get current user data
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }

    $sql = "SELECT id, username, email, full_name, role, created_at, last_login
            FROM users
            WHERE id = ? AND is_active = 1
            LIMIT 1";

    return db()->fetchOne($sql, [$_SESSION['user_id']]);
}

/**
 * Check if user has specific role
 */
function hasRole($role) {
    $user = getCurrentUser();
    return $user && $user['role'] === $role;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * Format date/time
 */
function formatDate($datetime, $format = 'Y-m-d H:i:s') {
    if (empty($datetime)) {
        return '-';
    }
    return date($format, strtotime($datetime));
}

/**
 * Time ago function
 */
function timeAgo($datetime) {
    $time = strtotime($datetime);
    $diff = time() - $time;

    if ($diff < 60) {
        return $diff . ' seconds ago';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' minutes ago';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' hours ago';
    } elseif ($diff < 2592000) {
        return floor($diff / 86400) . ' days ago';
    } else {
        return date('M j, Y', $time);
    }
}

/**
 * Format time duration (seconds to readable format)
 */
function formatDuration($seconds) {
    if ($seconds < 60) {
        return $seconds . 's';
    } elseif ($seconds < 3600) {
        $minutes = floor($seconds / 60);
        $secs = $seconds % 60;
        return $minutes . 'm ' . $secs . 's';
    } else {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        return $hours . 'h ' . $minutes . 'm';
    }
}

/**
 * Flash message functions
 */
function setFlash($type, $message) {
    $_SESSION['flash'][$type] = $message;
}

function getFlash($type) {
    if (isset($_SESSION['flash'][$type])) {
        $message = $_SESSION['flash'][$type];
        unset($_SESSION['flash'][$type]);
        return $message;
    }
    return null;
}

function hasFlash($type) {
    return isset($_SESSION['flash'][$type]);
}

/**
 * JSON response helper
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Error response helper
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['success' => false, 'error' => $message], $statusCode);
}

/**
 * Success response helper
 */
function successResponse($data = [], $message = 'Success') {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data));
}

/**
 * Get activity by ID
 */
function getActivity($activityId) {
    $sql = "SELECT a.*, u.username as creator_name
            FROM activities a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.id = ? AND a.is_active = 1
            LIMIT 1";

    return db()->fetchOne($sql, [$activityId]);
}

/**
 * Get user's attempt for an activity
 */
function getUserAttempt($userId, $activityId) {
    $sql = "SELECT *
            FROM attempts
            WHERE user_id = ? AND activity_id = ?
            ORDER BY attempt_number DESC
            LIMIT 1";

    return db()->fetchOne($sql, [$userId, $activityId]);
}

/**
 * Create new attempt
 */
function createAttempt($userId, $activityId) {
    // Get last attempt number
    $lastAttempt = getUserAttempt($userId, $activityId);
    $attemptNumber = $lastAttempt ? $lastAttempt['attempt_number'] + 1 : 1;

    $data = [
        'user_id' => $userId,
        'activity_id' => $activityId,
        'attempt_number' => $attemptNumber,
        'invariants_found' => json_encode([]),
        'scale_actions' => 0,
        'time_spent' => 0,
        'completed' => 0,
        'score' => 0.00
    ];

    return db()->insert('attempts', $data);
}

/**
 * Calculate score based on invariants found
 */
function calculateScore($shapeType, $foundInvariants, $scaleActions, $timeSpent) {
    $shapeConfig = SHAPE_TYPES[$shapeType];
    $possibleInvariants = count($shapeConfig['invariants']);
    $foundCount = 0;

    // Count matched invariants
    foreach ($shapeConfig['invariants'] as $invariant) {
        foreach ($foundInvariants as $found) {
            if (strpos($found, $invariant) !== false) {
                $foundCount++;
                break;
            }
        }
    }

    // Base score (70%)
    $baseScore = ($foundCount / $possibleInvariants) * 100 * BASE_SCORE_WEIGHT;

    // Efficiency bonus (20%) - fewer scale actions is better
    $efficiencyScore = max(0, (15 - $scaleActions) / 15) * 100 * EFFICIENCY_BONUS_WEIGHT;

    // Time bonus (10%) - faster is better (up to 5 minutes)
    $timeScore = max(0, (300 - $timeSpent) / 300) * 100 * TIME_BONUS_WEIGHT;

    $totalScore = min(100, $baseScore + $efficiencyScore + $timeScore);

    return round($totalScore, 2);
}

/**
 * Get leaderboard data
 */
function getLeaderboard($shapeType = null, $limit = 10) {
    $sql = "SELECT l.*, u.username, u.full_name
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            WHERE 1=1";

    $params = [];

    if ($shapeType) {
        $sql .= " AND l.shape_type = ?";
        $params[] = $shapeType;
    }

    $sql .= " ORDER BY l.avg_score DESC, l.total_score DESC
              LIMIT " . intval($limit);

    return db()->fetchAll($sql, $params);
}

/**
 * Get user statistics
 */
function getUserStats($userId) {
    $sql = "SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_attempts,
                AVG(CASE WHEN completed = 1 THEN score ELSE NULL END) as avg_score,
                MAX(score) as best_score,
                SUM(time_spent) as total_time
            FROM attempts
            WHERE user_id = ?";

    return db()->fetchOne($sql, [$userId]);
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate random string
 */
function randomString($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Log interaction
 */
function logInteraction($attemptId, $actionType, $actionData) {
    return db()->insert('interactions', [
        'attempt_id' => $attemptId,
        'action_type' => $actionType,
        'action_data' => json_encode($actionData)
    ]);
}
