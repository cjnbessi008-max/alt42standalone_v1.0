<?php
/**
 * API Endpoint for Reverse Bloom
 * Handles AJAX requests from frontend
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in JSON response
ini_set('log_errors', 1);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload dependencies
require_once __DIR__ . '/../src/controllers/QuestionController.php';

try {
    // Initialize controller
    $controller = new QuestionController();

    // Handle request
    $controller->handleRequest();

} catch (Exception $e) {
    // Log error
    error_log("API Error: " . $e->getMessage());

    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $_ENV['APP_DEBUG'] ? $e->getMessage() : 'An error occurred'
    ]);
}
