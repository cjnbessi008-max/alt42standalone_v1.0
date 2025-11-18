<?php
/**
 * Get all available Riemann Sum problems from Moodle database
 * GET /php/get-all-problems.php
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
    // Get database connection
    $conn = getDatabaseConnection();

    // Query to get all active problems
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
                p.difficulty,
                p.created_at
            FROM mdl_riemann_problems p
            WHERE p.is_active = 1
            ORDER BY p.difficulty ASC, p.id ASC";

    $result = executeQuery($conn, $sql);

    if (!$result) {
        sendErrorResponse('Database query failed', 500);
    }

    $problems = [];
    while ($row = $result->fetch_assoc()) {
        $problems[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'function' => $row['function_expr'],
            'function_display' => $row['function_display'],
            'interval_a' => (float)$row['interval_a'],
            'interval_b' => (float)$row['interval_b'],
            'riemann_type' => $row['riemann_type'],
            'exact_answer' => (float)$row['exact_answer'],
            'difficulty' => $row['difficulty'],
            'created_at' => $row['created_at']
        ];
    }

    // Format response
    $response = [
        'success' => true,
        'count' => count($problems),
        'problems' => $problems
    ];

    sendJsonResponse($response);

} catch (Exception $e) {
    error_log("Error in get-all-problems.php: " . $e->getMessage());
    sendErrorResponse('Internal server error', 500);
}
