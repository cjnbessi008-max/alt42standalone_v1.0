<?php
/**
 * Focus Light 웹앱 - 도형 API
 * 도형 데이터 관리
 */

require_once 'config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

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
        sendError('Method not allowed', 405);
}

/**
 * GET 요청 처리
 */
function handleGet($pdo) {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        getShapeById($pdo, $id);
    } else if (isset($_GET['problem_id'])) {
        $problemId = intval($_GET['problem_id']);
        getShapesByProblem($pdo, $problemId);
    } else {
        sendError('Missing required parameter: id or problem_id', 400);
    }
}

/**
 * 문제별 도형 조회
 */
function getShapesByProblem($pdo, $problemId) {
    try {
        $stmt = $pdo->prepare('SELECT * FROM shapes WHERE problem_id = :problem_id ORDER BY id');
        $stmt->execute([':problem_id' => $problemId]);
        $shapes = $stmt->fetchAll();

        foreach ($shapes as &$shape) {
            if ($shape['properties']) {
                $shape['properties'] = json_decode($shape['properties'], true);
            }
        }

        sendResponse(true, $shapes, 'Shapes retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve shapes: ' . $e->getMessage(), 500);
    }
}

/**
 * 특정 도형 조회
 */
function getShapeById($pdo, $id) {
    try {
        $stmt = $pdo->prepare('SELECT * FROM shapes WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $shape = $stmt->fetch();

        if (!$shape) {
            sendError('Shape not found', 404);
        }

        if ($shape['properties']) {
            $shape['properties'] = json_decode($shape['properties'], true);
        }

        sendResponse(true, $shape, 'Shape retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve shape: ' . $e->getMessage(), 500);
    }
}

/**
 * POST 요청 처리 (새 도형 생성)
 */
function handlePost($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['problem_id']) || !isset($data['shape_type']) || !isset($data['svg_data'])) {
            sendError('Missing required fields: problem_id, shape_type, svg_data', 400);
        }

        $sql = 'INSERT INTO shapes (problem_id, shape_type, svg_data, properties, position_x, position_y)
                VALUES (:problem_id, :shape_type, :svg_data, :properties, :position_x, :position_y)';

        $properties = isset($data['properties']) ? json_encode($data['properties']) : null;

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':problem_id' => $data['problem_id'],
            ':shape_type' => $data['shape_type'],
            ':svg_data' => $data['svg_data'],
            ':properties' => $properties,
            ':position_x' => $data['position_x'] ?? 0,
            ':position_y' => $data['position_y'] ?? 0
        ]);

        $shapeId = $pdo->lastInsertId();

        sendResponse(true, ['id' => $shapeId], 'Shape created successfully');
    } catch (PDOException $e) {
        sendError('Failed to create shape: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT 요청 처리 (도형 업데이트)
 */
function handlePut($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id'])) {
            sendError('Missing required field: id', 400);
        }

        $updates = [];
        $params = [':id' => $data['id']];

        if (isset($data['svg_data'])) {
            $updates[] = 'svg_data = :svg_data';
            $params[':svg_data'] = $data['svg_data'];
        }
        if (isset($data['properties'])) {
            $updates[] = 'properties = :properties';
            $params[':properties'] = json_encode($data['properties']);
        }
        if (isset($data['position_x'])) {
            $updates[] = 'position_x = :position_x';
            $params[':position_x'] = $data['position_x'];
        }
        if (isset($data['position_y'])) {
            $updates[] = 'position_y = :position_y';
            $params[':position_y'] = $data['position_y'];
        }

        if (empty($updates)) {
            sendError('No fields to update', 400);
        }

        $sql = 'UPDATE shapes SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(true, null, 'Shape updated successfully');
    } catch (PDOException $e) {
        sendError('Failed to update shape: ' . $e->getMessage(), 500);
    }
}

/**
 * DELETE 요청 처리
 */
function handleDelete($pdo) {
    try {
        if (!isset($_GET['id'])) {
            sendError('Missing required parameter: id', 400);
        }

        $id = intval($_GET['id']);
        $stmt = $pdo->prepare('DELETE FROM shapes WHERE id = :id');
        $stmt->execute([':id' => $id]);

        sendResponse(true, null, 'Shape deleted successfully');
    } catch (PDOException $e) {
        sendError('Failed to delete shape: ' . $e->getMessage(), 500);
    }
}
