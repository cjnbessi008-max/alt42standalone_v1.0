<?php
/**
 * Shapes API - CRUD operations for geometric shapes
 * PHP 7.1.9 compatible
 */

require_once 'config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

// Route requests
switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}

/**
 * GET - Retrieve shapes
 */
function handleGet($pdo) {
    $shape_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $user_id = getCurrentUserId();

    if ($shape_id) {
        // Get specific shape with guide lines
        $stmt = $pdo->prepare("
            SELECT s.*,
                   (SELECT JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', gl.id,
                           'line_type', gl.line_type,
                           'start_point', gl.start_point,
                           'end_point', gl.end_point,
                           'color', gl.color,
                           'is_visible', gl.is_visible
                       )
                   ) FROM guide_lines gl WHERE gl.shape_id = s.id) as guide_lines
            FROM shapes s
            WHERE s.id = ? AND s.user_id = ?
        ");
        $stmt->execute([$shape_id, $user_id]);
        $shape = $stmt->fetch();

        if (!$shape) {
            sendJSON(['error' => 'Shape not found'], 404);
        }

        // Parse JSON fields
        $shape['vertices'] = json_decode($shape['vertices'], true);
        $shape['guide_lines'] = $shape['guide_lines'] ? json_decode($shape['guide_lines'], true) : [];

        sendJSON(['success' => true, 'shape' => $shape]);
    } else {
        // Get all shapes for user
        $stmt = $pdo->prepare("SELECT * FROM shapes WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $shapes = $stmt->fetchAll();

        foreach ($shapes as &$shape) {
            $shape['vertices'] = json_decode($shape['vertices'], true);
        }

        sendJSON(['success' => true, 'shapes' => $shapes]);
    }
}

/**
 * POST - Create new shape and auto-generate guide lines
 */
function handlePost($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['shape_type']) || !isset($input['vertices'])) {
        sendJSON(['error' => 'Missing required fields'], 400);
    }

    $user_id = getCurrentUserId();
    $shape_name = $input['shape_name'] ?? 'Untitled Shape';
    $shape_type = $input['shape_type'];
    $vertices = $input['vertices'];
    $moodle_course_id = $input['moodle_course_id'] ?? null;
    $moodle_activity_id = $input['moodle_activity_id'] ?? null;

    // Validate vertices
    if (!is_array($vertices) || count($vertices) < 2) {
        sendJSON(['error' => 'Invalid vertices data'], 400);
    }

    try {
        $pdo->beginTransaction();

        // Insert shape
        $stmt = $pdo->prepare("
            INSERT INTO shapes (user_id, moodle_course_id, moodle_activity_id, shape_name, shape_type, vertices)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user_id,
            $moodle_course_id,
            $moodle_activity_id,
            $shape_name,
            $shape_type,
            json_encode($vertices)
        ]);

        $shape_id = $pdo->lastInsertId();

        // Auto-generate guide lines
        $guide_lines = generateGuideLines($vertices, $shape_id);

        // Insert guide lines
        foreach ($guide_lines as $guide_line) {
            $stmt = $pdo->prepare("
                INSERT INTO guide_lines (shape_id, line_type, reference_line_index, reference_point_index, start_point, end_point, color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $shape_id,
                $guide_line['line_type'],
                $guide_line['reference_line_index'],
                $guide_line['reference_point_index'],
                json_encode($guide_line['start_point']),
                json_encode($guide_line['end_point']),
                $guide_line['color']
            ]);
        }

        // Log activity
        logActivity($pdo, $user_id, $shape_id, 'create_shape', ['vertices_count' => count($vertices)]);

        $pdo->commit();

        sendJSON([
            'success' => true,
            'shape_id' => $shape_id,
            'guide_lines_generated' => count($guide_lines)
        ], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendJSON(['error' => 'Failed to create shape: ' . $e->getMessage()], 500);
    }
}

/**
 * PUT - Update existing shape
 */
function handlePut($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        sendJSON(['error' => 'Shape ID required'], 400);
    }

    $shape_id = intval($input['id']);
    $user_id = getCurrentUserId();

    // Verify ownership
    $stmt = $pdo->prepare("SELECT id FROM shapes WHERE id = ? AND user_id = ?");
    $stmt->execute([$shape_id, $user_id]);
    if (!$stmt->fetch()) {
        sendJSON(['error' => 'Shape not found or unauthorized'], 404);
    }

    try {
        $pdo->beginTransaction();

        // Update shape
        $updates = [];
        $params = [];

        if (isset($input['shape_name'])) {
            $updates[] = "shape_name = ?";
            $params[] = $input['shape_name'];
        }
        if (isset($input['vertices'])) {
            $updates[] = "vertices = ?";
            $params[] = json_encode($input['vertices']);

            // Regenerate guide lines
            $pdo->prepare("DELETE FROM guide_lines WHERE shape_id = ?")->execute([$shape_id]);
            $guide_lines = generateGuideLines($input['vertices'], $shape_id);

            foreach ($guide_lines as $guide_line) {
                $stmt = $pdo->prepare("
                    INSERT INTO guide_lines (shape_id, line_type, reference_line_index, reference_point_index, start_point, end_point, color)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $shape_id,
                    $guide_line['line_type'],
                    $guide_line['reference_line_index'],
                    $guide_line['reference_point_index'],
                    json_encode($guide_line['start_point']),
                    json_encode($guide_line['end_point']),
                    $guide_line['color']
                ]);
            }
        }

        if (!empty($updates)) {
            $params[] = $shape_id;
            $sql = "UPDATE shapes SET " . implode(', ', $updates) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($params);
        }

        logActivity($pdo, $user_id, $shape_id, 'edit_shape', $input);

        $pdo->commit();
        sendJSON(['success' => true, 'message' => 'Shape updated']);

    } catch (Exception $e) {
        $pdo->rollBack();
        sendJSON(['error' => 'Failed to update shape: ' . $e->getMessage()], 500);
    }
}

/**
 * DELETE - Remove shape
 */
function handleDelete($pdo) {
    $shape_id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$shape_id) {
        sendJSON(['error' => 'Shape ID required'], 400);
    }

    $user_id = getCurrentUserId();

    $stmt = $pdo->prepare("DELETE FROM shapes WHERE id = ? AND user_id = ?");
    $stmt->execute([$shape_id, $user_id]);

    if ($stmt->rowCount() > 0) {
        logActivity($pdo, $user_id, $shape_id, 'delete_shape', null);
        sendJSON(['success' => true, 'message' => 'Shape deleted']);
    } else {
        sendJSON(['error' => 'Shape not found or unauthorized'], 404);
    }
}

/**
 * Generate parallel and perpendicular guide lines for a shape
 * @param array $vertices
 * @param int $shape_id
 * @return array
 */
function generateGuideLines($vertices, $shape_id) {
    $guide_lines = [];
    $count = count($vertices);

    // Generate parallel and perpendicular lines for each edge
    for ($i = 0; $i < $count; $i++) {
        $p1 = $vertices[$i];
        $p2 = $vertices[($i + 1) % $count];

        // Calculate edge vector
        $dx = $p2['x'] - $p1['x'];
        $dy = $p2['y'] - $p1['y'];
        $length = sqrt($dx * $dx + $dy * $dy);

        if ($length < 0.1) continue; // Skip very short edges

        // Normalize
        $ux = $dx / $length;
        $uy = $dy / $length;

        // Generate parallel line (offset from the edge)
        $offset = 30; // pixels
        $perpX = -$uy; // Perpendicular unit vector
        $perpY = $ux;

        $parallel_start = [
            'x' => $p1['x'] + $perpX * $offset,
            'y' => $p1['y'] + $perpY * $offset
        ];
        $parallel_end = [
            'x' => $p2['x'] + $perpX * $offset,
            'y' => $p2['y'] + $perpY * $offset
        ];

        $guide_lines[] = [
            'line_type' => 'parallel',
            'reference_line_index' => $i,
            'reference_point_index' => null,
            'start_point' => $parallel_start,
            'end_point' => $parallel_end,
            'color' => '#4ECDC4'
        ];

        // Generate perpendicular lines at each vertex
        $perp_length = 50; // pixels
        $perp_start = [
            'x' => $p1['x'] - $perpX * $perp_length / 2,
            'y' => $p1['y'] - $perpY * $perp_length / 2
        ];
        $perp_end = [
            'x' => $p1['x'] + $perpX * $perp_length / 2,
            'y' => $p1['y'] + $perpY * $perp_length / 2
        ];

        $guide_lines[] = [
            'line_type' => 'perpendicular',
            'reference_line_index' => $i,
            'reference_point_index' => $i,
            'start_point' => $perp_start,
            'end_point' => $perp_end,
            'color' => '#FF6B6B'
        ];
    }

    return $guide_lines;
}

/**
 * Log user activity
 */
function logActivity($pdo, $user_id, $shape_id, $action, $details) {
    $stmt = $pdo->prepare("
        INSERT INTO activity_logs (user_id, shape_id, action, details, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user_id,
        $shape_id,
        $action,
        $details ? json_encode($details) : null,
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);
}
