<?php
/**
 * Check database connection to Moodle
 * GET /php/check-connection.php
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
    // Try to connect to database
    $conn = getDatabaseConnection();

    // Test query
    $result = $conn->query("SELECT VERSION() as version");

    if (!$result) {
        sendErrorResponse('Database query failed', 500);
    }

    $row = $result->fetch_assoc();
    $mysqlVersion = $row['version'];

    // Check if Riemann problems table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'mdl_riemann_problems'");
    $tableExists = ($tableCheck && $tableCheck->num_rows > 0);

    // Get problem count if table exists
    $problemCount = 0;
    if ($tableExists) {
        $countResult = $conn->query("SELECT COUNT(*) as count FROM mdl_riemann_problems WHERE is_active = 1");
        if ($countResult) {
            $countRow = $countResult->fetch_assoc();
            $problemCount = (int)$countRow['count'];
        }
    }

    // Format response
    $response = [
        'success' => true,
        'message' => 'Connected to Moodle database',
        'database' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'mysql_version' => $mysqlVersion,
            'charset' => DB_CHARSET
        ],
        'tables' => [
            'riemann_problems_exists' => $tableExists,
            'active_problems_count' => $problemCount
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];

    sendJsonResponse($response);

} catch (Exception $e) {
    error_log("Connection check failed: " . $e->getMessage());
    sendErrorResponse('Database connection failed: ' . $e->getMessage(), 500);
}
