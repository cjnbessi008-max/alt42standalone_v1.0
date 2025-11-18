<?php
/**
 * Transformations API Endpoint
 * Handles transformation types and animation data
 */

require_once __DIR__ . '/../config/database.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

try {
    switch ($method) {
        case 'GET':
            handleGetTransformations($pdo);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    errorResponse($e->getMessage(), 500);
}

/**
 * Get all transformations
 */
function handleGetTransformations($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT transformation_id, name, type, description, animation_duration
            FROM transformations
            ORDER BY transformation_id
        ");
        $transformations = $stmt->fetchAll();

        successResponse($transformations, 'Transformations retrieved successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
