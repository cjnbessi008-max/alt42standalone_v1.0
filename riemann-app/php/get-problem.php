<?php
/**
 * Get a specific Riemann Sum problem from Moodle database
 * GET /php/get-problem.php?id=1
 */

require_once __DIR__ . '/../config/database.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

try {
    // Get problem ID from query parameter
    if (!isset($_GET['id'])) {
        sendErrorResponse('Problem ID is required', 400);
    }

    $problemId = validateIntParam($_GET['id'], 'problem ID');

    // Get database connection
    $conn = getDatabaseConnection();

    // Query to get problem from Moodle database
    // Adjust table and column names based on your Moodle schema
    $sql = "SELECT
                p.id,
                p.title,
                p.description,
                p.function_expr,
                p.function_display,
                p.interval_a,
                p.interval_b,
                p.riemann_type,
                p.exact_answer,
                p.created_at,
                p.updated_at
            FROM mdl_riemann_problems p
            WHERE p.id = ? AND p.is_active = 1
            LIMIT 1";

    $result = executeQuery($conn, $sql, 'i', [$problemId]);

    if (!$result) {
        sendErrorResponse('Database query failed', 500);
    }

    if ($result->num_rows === 0) {
        sendErrorResponse('Problem not found', 404);
    }

    $problem = $result->fetch_assoc();

    // Format response
    $response = [
        'success' => true,
        'problem' => [
            'id' => (int)$problem['id'],
            'title' => $problem['title'],
            'description' => $problem['description'],
            'function' => $problem['function_expr'],
            'function_display' => $problem['function_display'],
            'interval_a' => (float)$problem['interval_a'],
            'interval_b' => (float)$problem['interval_b'],
            'riemann_type' => $problem['riemann_type'],
            'exact_answer' => (float)$problem['exact_answer'],
            'created_at' => $problem['created_at'],
            'updated_at' => $problem['updated_at']
        ]
    ];

    sendJsonResponse($response);

} catch (Exception $e) {
    error_log("Error in get-problem.php: " . $e->getMessage());
    sendErrorResponse('Internal server error', 500);
}
