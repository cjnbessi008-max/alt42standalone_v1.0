<?php
/**
 * API Response Helpers
 * Standardized response functions
 */

/**
 * Send success response
 *
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 */
function sendSuccess($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => true,
        'data' => $data,
        'timestamp' => time()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 *
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 * @param array $errors Additional error details
 */
function sendError($message, $statusCode = 400, $errors = []) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $message,
            'code' => $statusCode,
            'details' => $errors
        ],
        'timestamp' => time()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send validation error response
 *
 * @param array $errors Validation errors
 */
function sendValidationError($errors) {
    sendError('Validation failed', 422, $errors);
}
