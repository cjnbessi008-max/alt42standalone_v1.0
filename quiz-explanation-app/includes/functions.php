<?php
/**
 * Common Functions
 * Utility functions used throughout the application
 */

/**
 * Start session if not already started
 */
function ensureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    ensureSession();
    return isset($_SESSION['user_id']);
}

/**
 * Get current user data
 */
function getCurrentUser() {
    ensureSession();
    if (!isLoggedIn()) {
        return null;
    }

    $db = Database::getInstance();
    return $db->queryOne(
        'SELECT * FROM users WHERE id = ?',
        [$_SESSION['user_id']]
    );
}

/**
 * Check if current user has a specific role
 */
function hasRole($role) {
    $user = getCurrentUser();
    return $user && $user['role'] === $role;
}

/**
 * Require login
 */
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /login.php');
        exit;
    }
}

/**
 * Require specific role
 */
function requireRole($role) {
    requireLogin();
    if (!hasRole($role)) {
        http_response_code(403);
        die('Access denied. You do not have permission to access this page.');
    }
}

/**
 * Sanitize input
 */
function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Format date for display
 */
function formatDate($date, $format = 'Y-m-d H:i:s') {
    if (!$date) return '';
    $dt = new DateTime($date);
    return $dt->format($format);
}

/**
 * Calculate time difference in human readable format
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
        return formatDate($datetime, 'M d, Y');
    }
}

/**
 * Generate CSRF token
 */
function generateCsrfToken() {
    ensureSession();
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token
 */
function validateCsrfToken($token) {
    ensureSession();
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Send success response
 */
function successResponse($data = [], $message = 'Success') {
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

/**
 * Calculate explanation score based on keywords
 */
function evaluateExplanation($explanationText, $keywords) {
    $score = 0;
    $maxScore = 0;
    $details = [];

    $explanationLower = mb_strtolower($explanationText, 'UTF-8');

    foreach ($keywords as $keyword) {
        $keywordLower = mb_strtolower($keyword['keyword'], 'UTF-8');
        $found = mb_strpos($explanationLower, $keywordLower) !== false;

        $weight = floatval($keyword['weight']);

        if ($keyword['keyword_type'] === 'required') {
            $maxScore += $weight;
            if ($found) {
                $score += $weight;
            }
        } elseif ($keyword['keyword_type'] === 'bonus' && $found) {
            $score += $weight;
        } elseif ($keyword['keyword_type'] === 'negative' && $found) {
            $score -= abs($weight);
        }

        $details[] = [
            'keyword_id' => $keyword['id'],
            'keyword' => $keyword['keyword'],
            'type' => $keyword['keyword_type'],
            'found' => $found,
            'weight' => $weight,
            'match_context' => $found ? extractContext($explanationText, $keywordLower, 30) : null
        ];
    }

    // Normalize score to 0-100 range
    $normalizedScore = $maxScore > 0 ? ($score / $maxScore) * 100 : 0;
    $normalizedScore = max(0, min(100, $normalizedScore)); // Clamp between 0 and 100

    return [
        'score' => $normalizedScore,
        'raw_score' => $score,
        'max_score' => $maxScore,
        'details' => $details
    ];
}

/**
 * Extract context around a keyword match
 */
function extractContext($text, $keyword, $contextLength = 30) {
    $pos = mb_stripos($text, $keyword, 0, 'UTF-8');
    if ($pos === false) {
        return null;
    }

    $start = max(0, $pos - $contextLength);
    $length = $contextLength * 2 + mb_strlen($keyword, 'UTF-8');

    $context = mb_substr($text, $start, $length, 'UTF-8');

    if ($start > 0) {
        $context = '...' . $context;
    }
    if ($start + $length < mb_strlen($text, 'UTF-8')) {
        $context .= '...';
    }

    return $context;
}

/**
 * Get setting value
 */
function getSetting($key, $default = null) {
    $db = Database::getInstance();
    $setting = $db->queryOne('SELECT setting_value, setting_type FROM settings WHERE setting_key = ?', [$key]);

    if (!$setting) {
        return $default;
    }

    $value = $setting['setting_value'];

    switch ($setting['setting_type']) {
        case 'boolean':
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        case 'number':
            return is_numeric($value) ? floatval($value) : $default;
        case 'json':
            return json_decode($value, true);
        default:
            return $value;
    }
}

/**
 * Update setting value
 */
function updateSetting($key, $value) {
    $db = Database::getInstance();
    return $db->execute(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [$value, $key]
    );
}

/**
 * Log error to database or file
 */
function logError($message, $context = []) {
    $logMessage = '[' . date('Y-m-d H:i:s') . '] ' . $message;
    if (!empty($context)) {
        $logMessage .= ' | Context: ' . json_encode($context);
    }
    error_log($logMessage);
}

/**
 * Redirect to URL
 */
function redirect($url) {
    header('Location: ' . $url);
    exit;
}

/**
 * Include header template
 */
function includeHeader($title = 'Quiz Explanation App') {
    include __DIR__ . '/../templates/header.php';
}

/**
 * Include footer template
 */
function includeFooter() {
    include __DIR__ . '/../templates/footer.php';
}
