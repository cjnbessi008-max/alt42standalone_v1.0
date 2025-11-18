<?php
/**
 * Focus Light 웹앱 - Focus Elements API
 * 강조 요소 관리
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
    if (isset($_GET['shape_id'])) {
        $shapeId = intval($_GET['shape_id']);
        getFocusElementsByShape($pdo, $shapeId);
    } else if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        getFocusElementById($pdo, $id);
    } else {
        sendError('Missing required parameter: id or shape_id', 400);
    }
}

/**
 * 도형별 Focus 요소 조회
 */
function getFocusElementsByShape($pdo, $shapeId) {
    try {
        $stmt = $pdo->prepare('
            SELECT * FROM focus_elements
            WHERE shape_id = :shape_id AND is_active = 1
            ORDER BY display_order
        ');
        $stmt->execute([':shape_id' => $shapeId]);
        $elements = $stmt->fetchAll();

        sendResponse(true, $elements, 'Focus elements retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve focus elements: ' . $e->getMessage(), 500);
    }
}

/**
 * 특정 Focus 요소 조회
 */
function getFocusElementById($pdo, $id) {
    try {
        $stmt = $pdo->prepare('SELECT * FROM focus_elements WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $element = $stmt->fetch();

        if (!$element) {
            sendError('Focus element not found', 404);
        }

        sendResponse(true, $element, 'Focus element retrieved successfully');
    } catch (PDOException $e) {
        sendError('Failed to retrieve focus element: ' . $e->getMessage(), 500);
    }
}

/**
 * POST 요청 처리 (새 Focus 요소 생성)
 */
function handlePost($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['shape_id']) || !isset($data['element_type']) || !isset($data['element_selector'])) {
            sendError('Missing required fields: shape_id, element_type, element_selector', 400);
        }

        $sql = 'INSERT INTO focus_elements
                (shape_id, element_type, element_selector, label, highlight_color,
                 glow_intensity, animation_type, is_active, display_order)
                VALUES (:shape_id, :element_type, :element_selector, :label, :highlight_color,
                        :glow_intensity, :animation_type, :is_active, :display_order)';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':shape_id' => $data['shape_id'],
            ':element_type' => $data['element_type'],
            ':element_selector' => $data['element_selector'],
            ':label' => $data['label'] ?? null,
            ':highlight_color' => $data['highlight_color'] ?? '#FFD700',
            ':glow_intensity' => $data['glow_intensity'] ?? 3,
            ':animation_type' => $data['animation_type'] ?? 'glow',
            ':is_active' => $data['is_active'] ?? 1,
            ':display_order' => $data['display_order'] ?? 0
        ]);

        $elementId = $pdo->lastInsertId();

        sendResponse(true, ['id' => $elementId], 'Focus element created successfully');
    } catch (PDOException $e) {
        sendError('Failed to create focus element: ' . $e->getMessage(), 500);
    }
}

/**
 * PUT 요청 처리 (Focus 요소 업데이트)
 */
function handlePut($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id'])) {
            sendError('Missing required field: id', 400);
        }

        $updates = [];
        $params = [':id' => $data['id']];

        $fields = ['element_selector', 'label', 'highlight_color', 'glow_intensity',
                   'animation_type', 'is_active', 'display_order'];

        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($updates)) {
            sendError('No fields to update', 400);
        }

        $sql = 'UPDATE focus_elements SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse(true, null, 'Focus element updated successfully');
    } catch (PDOException $e) {
        sendError('Failed to update focus element: ' . $e->getMessage(), 500);
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
        $stmt = $pdo->prepare('DELETE FROM focus_elements WHERE id = :id');
        $stmt->execute([':id' => $id]);

        sendResponse(true, null, 'Focus element deleted successfully');
    } catch (PDOException $e) {
        sendError('Failed to delete focus element: ' . $e->getMessage(), 500);
    }
}
