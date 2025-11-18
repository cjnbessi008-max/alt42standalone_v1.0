<?php
/**
 * Submit Answer API Endpoint
 * Handles student answer submissions
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/LogarithmCalculator.php';
require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/response.php';

// Load configuration
$config = require __DIR__ . '/../config/config.php';

// Enable CORS
handleCors($config['cors']);

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
    exit;
}

// Get database instance
try {
    $db = Database::getInstance($config);
} catch (Exception $e) {
    sendError('Database connection failed', 500);
    exit;
}

// Initialize models
$calculator = new LogarithmCalculator();
$attemptModel = new StudentAttempt($db, $calculator);

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['student_id', 'problem_id', 'answer'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        sendError("Missing required field: $field", 400);
        exit;
    }
}

// Add client information
$input['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
$input['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? null;

try {
    // Record the attempt
    $result = $attemptModel->record($input);

    // Return result with feedback
    sendSuccess($result, 201);

} catch (InvalidArgumentException $e) {
    sendError($e->getMessage(), 400);
} catch (Exception $e) {
    error_log('Submit error: ' . $e->getMessage());
    sendError('Failed to submit answer', 500);
}
