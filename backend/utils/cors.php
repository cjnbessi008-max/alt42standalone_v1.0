<?php
/**
 * CORS Handler
 * Handles Cross-Origin Resource Sharing
 */

function handleCors($corsConfig) {
    // Get origin
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Check if origin is allowed
    if (in_array($origin, $corsConfig['allowed_origins'])) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } elseif (in_array('*', $corsConfig['allowed_origins'])) {
        header('Access-Control-Allow-Origin: *');
    }

    // Set other CORS headers
    header('Access-Control-Allow-Methods: ' . implode(', ', $corsConfig['allowed_methods']));
    header('Access-Control-Allow-Headers: ' . implode(', ', $corsConfig['allowed_headers']));
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // 24 hours

    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
