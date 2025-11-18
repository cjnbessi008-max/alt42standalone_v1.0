<?php
/**
 * Application Configuration
 */

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Seoul');

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Application settings
define('APP_NAME', 'AI Education LMS - Personalized Learning');
define('APP_VERSION', '1.0.0');
define('API_BASE_PATH', '/api/v1');

// Learning pattern thresholds
define('PATTERN_CONFIDENCE_THRESHOLD', 60.0); // Minimum confidence to classify pattern
define('MIN_ATTEMPTS_FOR_PATTERN', 5); // Minimum attempts before pattern detection

// Recommendation settings
define('RECOMMENDATION_BATCH_SIZE', 10); // Number of problems to recommend at once
define('DIFFICULTY_ADJUSTMENT_FACTOR', 0.2); // How much to adjust difficulty based on performance

// Session settings
define('SESSION_TIMEOUT', 3600); // 1 hour

/**
 * Send JSON response
 */
function sendResponse($success, $data = null, $message = null, $code = 200) {
    http_response_code($code);

    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($message !== null) {
        $response['message'] = $message;
    }

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $code = 400, $details = null) {
    http_response_code($code);

    $response = [
        'success' => false,
        'error' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($details !== null) {
        $response['details'] = $details;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Validate required fields
 */
function validateRequired($data, $required_fields) {
    $missing = [];

    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    return true;
}

/**
 * Sanitize input
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }

    return htmlspecialchars(strip_tags(trim($data)));
}
