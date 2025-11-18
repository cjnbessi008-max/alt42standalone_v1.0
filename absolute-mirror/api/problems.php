<?php
/**
 * Absolute Mirror API - Get Problems
 * Returns list of problems with optional filtering
 */

require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(['success' => false, 'error' => 'Method not allowed'], 405);
}

try {
    // Get query parameters
    $difficulty = $_GET['difficulty'] ?? null;
    $grade_level = $_GET['grade_level'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $active_only = isset($_GET['active_only']) ? (bool)$_GET['active_only'] : true;

    // Build query
    $sql = "SELECT
                id,
                title,
                description,
                equation,
                axis_of_symmetry,
                target_value,
                solution_left,
                solution_right,
                difficulty,
                grade_level,
                created_at
            FROM problems
            WHERE 1=1";

    $params = [];

    if ($active_only) {
        $sql .= " AND is_active = 1";
    }

    if ($difficulty) {
        $sql .= " AND difficulty = :difficulty";
        $params[':difficulty'] = $difficulty;
    }

    if ($grade_level) {
        $sql .= " AND grade_level = :grade_level";
        $params[':grade_level'] = $grade_level;
    }

    // Add ordering and pagination
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

    // Get database connection
    $pdo = getDBConnection();

    // Prepare and execute query
    $stmt = $pdo->prepare($sql);

    // Bind parameters
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $problems = $stmt->fetchAll();

    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM problems WHERE 1=1";
    if ($active_only) {
        $countSql .= " AND is_active = 1";
    }
    if ($difficulty) {
        $countSql .= " AND difficulty = :difficulty";
    }
    if ($grade_level) {
        $countSql .= " AND grade_level = :grade_level";
    }

    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];

    // Send response
    sendJSON([
        'success' => true,
        'data' => $problems,
        'total' => (int)$total,
        'limit' => $limit,
        'offset' => $offset
    ]);

} catch (Exception $e) {
    error_log("Error fetching problems: " . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Failed to fetch problems'
    ], 500);
}
