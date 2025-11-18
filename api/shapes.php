<?php
/**
 * Shapes API Endpoint
 * Handles shape data retrieval and management
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
            handleGetShapes($pdo);
            break;
        case 'POST':
            handleCreateShape($pdo);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    errorResponse($e->getMessage(), 500);
}

/**
 * Get all shapes or a specific shape
 */
function handleGetShapes($pdo) {
    $shapeId = isset($_GET['id']) ? intval($_GET['id']) : null;

    try {
        if ($shapeId) {
            // Get specific shape with properties
            $stmt = $pdo->prepare("
                SELECT s.*,
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'property_id', sp.property_id,
                            'name', sp.property_name,
                            'value', sp.property_value,
                            'type', sp.property_type,
                            'order', sp.display_order
                        )
                    )
                    FROM shape_properties sp
                    WHERE sp.shape_id = s.shape_id AND sp.is_visible = 1
                    ORDER BY sp.display_order
                    ) as properties
                FROM shapes s
                WHERE s.shape_id = ?
            ");
            $stmt->execute([$shapeId]);
            $shape = $stmt->fetch();

            if (!$shape) {
                errorResponse('Shape not found', 404);
            }

            // Decode JSON fields
            if ($shape['mathematical_properties']) {
                $shape['mathematical_properties'] = json_decode($shape['mathematical_properties'], true);
            }
            if ($shape['properties']) {
                $shape['properties'] = json_decode($shape['properties'], true);
            }

            successResponse($shape, 'Shape retrieved successfully');
        } else {
            // Get all shapes
            $stmt = $pdo->query("
                SELECT shape_id, name, type, color, description, mathematical_properties
                FROM shapes
                ORDER BY shape_id
            ");
            $shapes = $stmt->fetchAll();

            // Decode JSON fields for each shape
            foreach ($shapes as &$shape) {
                if ($shape['mathematical_properties']) {
                    $shape['mathematical_properties'] = json_decode($shape['mathematical_properties'], true);
                }
            }

            successResponse($shapes, 'Shapes retrieved successfully');
        }
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}

/**
 * Create a new shape (admin function)
 */
function handleCreateShape($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['name']) || !isset($input['type'])) {
        errorResponse('Name and type are required', 400);
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO shapes (name, type, color, description, mathematical_properties)
            VALUES (?, ?, ?, ?, ?)
        ");

        $mathProps = isset($input['mathematical_properties'])
            ? json_encode($input['mathematical_properties'])
            : null;

        $stmt->execute([
            $input['name'],
            $input['type'],
            $input['color'] ?? '#3498db',
            $input['description'] ?? null,
            $mathProps
        ]);

        $shapeId = $pdo->lastInsertId();

        successResponse(['shape_id' => $shapeId], 'Shape created successfully');
    } catch (PDOException $e) {
        errorResponse('Database error: ' . $e->getMessage(), 500);
    }
}
