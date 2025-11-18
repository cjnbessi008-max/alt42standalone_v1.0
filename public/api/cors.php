<?php
/**
 * CORS Handler
 */

$config = require __DIR__ . '/config.php';
$corsConfig = $config['cors'];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if origin is allowed
if (in_array($origin, $corsConfig['allowed_origins']) || in_array('*', $corsConfig['allowed_origins'])) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . $corsConfig['allowed_origins'][0]);
}

header("Access-Control-Allow-Methods: " . implode(', ', $corsConfig['allowed_methods']));
header("Access-Control-Allow-Headers: " . implode(', ', $corsConfig['allowed_headers']));
header("Access-Control-Max-Age: " . $corsConfig['max_age']);
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
