<?php
/**
 * API Endpoint: Get All Available Solid Shapes
 * Returns list of all 3D solid shapes in the database
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../includes/db.php';

function sendResponse($success, $data = null, $message = '', $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $db = Database::getInstance();

    // Get query parameters
    $category = $_GET['category'] ?? null;
    $shapeId = $_GET['shape_id'] ?? null;

    // Build SQL query
    $sql = "SELECT
                id,
                name,
                name_kr,
                vertices,
                faces,
                color,
                category,
                created_at,
                updated_at
            FROM solid_shapes";

    $params = [];
    $whereClauses = [];

    if ($shapeId) {
        $whereClauses[] = "id = :shape_id";
        $params[':shape_id'] = (int)$shapeId;
    }

    if ($category) {
        $validCategories = ['basic', 'polyhedron', 'curved', 'composite'];
        if (in_array($category, $validCategories)) {
            $whereClauses[] = "category = :category";
            $params[':category'] = $category;
        }
    }

    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(" AND ", $whereClauses);
    }

    $sql .= " ORDER BY category ASC, name ASC";

    $shapes = $db->fetchAll($sql, $params);

    // Parse JSON fields
    foreach ($shapes as &$shape) {
        $shape['vertices'] = json_decode($shape['vertices'], true);
        $shape['faces'] = json_decode($shape['faces'], true);
    }

    // Group by category if requested
    $groupByCategory = isset($_GET['group_by_category']) && $_GET['group_by_category'] === 'true';

    if ($groupByCategory) {
        $grouped = [];
        foreach ($shapes as $shape) {
            $cat = $shape['category'];
            if (!isset($grouped[$cat])) {
                $grouped[$cat] = [];
            }
            $grouped[$cat][] = $shape;
        }
        $shapes = $grouped;
    }

    sendResponse(true, [
        'shapes' => $shapes,
        'count' => is_array($shapes) && !$groupByCategory ? count($shapes) : null
    ], 'Shapes retrieved successfully');

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendResponse(false, null, APP_DEBUG ? $e->getMessage() : 'An error occurred', 500);
}
