<?php
/**
 * Hidden Length Application - Shapes API
 * Endpoints for managing and retrieving shape problems
 */

require_once __DIR__ . '/database.php';

$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse request
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
$shape_id = isset($path_parts[2]) && is_numeric($path_parts[2]) ? intval($path_parts[2]) : null;

switch ($method) {
    case 'GET':
        if ($shape_id) {
            getShapeById($db, $shape_id);
        } else {
            getAllShapes($db);
        }
        break;

    case 'POST':
        createShape($db);
        break;

    case 'PUT':
        if ($shape_id) {
            updateShape($db, $shape_id);
        } else {
            error_response('Shape ID required', 400);
        }
        break;

    case 'DELETE':
        if ($shape_id) {
            deleteShape($db, $shape_id);
        } else {
            error_response('Shape ID required', 400);
        }
        break;

    default:
        error_response('Method not allowed', 405);
}

/**
 * Get all shapes with optional filtering
 */
function getAllShapes($db) {
    $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : null;
    $difficulty = isset($_GET['difficulty']) ? intval($_GET['difficulty']) : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

    $sql = "SELECT s.*, sc.name as category_name, sc.difficulty_level as category_difficulty
            FROM shapes s
            LEFT JOIN shape_categories sc ON s.category_id = sc.id
            WHERE s.is_active = 1";

    $params = [];

    if ($category_id) {
        $sql .= " AND s.category_id = :category_id";
        $params['category_id'] = $category_id;
    }

    if ($difficulty) {
        $sql .= " AND s.difficulty_level = :difficulty";
        $params['difficulty'] = $difficulty;
    }

    $sql .= " ORDER BY s.difficulty_level ASC, s.id ASC LIMIT :limit OFFSET :offset";
    $params['limit'] = $limit;
    $params['offset'] = $offset;

    // PDO doesn't support binding LIMIT/OFFSET directly, need to use prepare
    $conn = $db->getConnection();
    $stmt = $conn->prepare($sql);

    foreach ($params as $key => $value) {
        $type = ($key === 'limit' || $key === 'offset') ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue(':' . $key, $value, $type);
    }

    $stmt->execute();
    $shapes = $stmt->fetchAll();

    // Decode JSON fields
    foreach ($shapes as &$shape) {
        $shape['shape_data'] = json_decode($shape['shape_data'], true);
        $shape['hidden_length_data'] = json_decode($shape['hidden_length_data'], true);
    }

    success_response($shapes);
}

/**
 * Get a single shape by ID
 */
function getShapeById($db, $shape_id) {
    $sql = "SELECT s.*, sc.name as category_name, sc.difficulty_level as category_difficulty
            FROM shapes s
            LEFT JOIN shape_categories sc ON s.category_id = sc.id
            WHERE s.id = :id AND s.is_active = 1";

    $shape = $db->queryOne($sql, ['id' => $shape_id]);

    if (!$shape) {
        error_response('Shape not found', 404);
    }

    // Decode JSON fields
    $shape['shape_data'] = json_decode($shape['shape_data'], true);
    $shape['hidden_length_data'] = json_decode($shape['hidden_length_data'], true);

    success_response($shape);
}

/**
 * Create a new shape (admin only)
 */
function createShape($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['category_id', 'title', 'shape_type', 'shape_data', 'hidden_length_data', 'correct_answer'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            error_response("Missing required field: $field", 400);
        }
    }

    $sql = "INSERT INTO shapes (category_id, title, description, shape_type, shape_data,
            hidden_length_data, difficulty_level, correct_answer, hint_text, explanation)
            VALUES (:category_id, :title, :description, :shape_type, :shape_data,
            :hidden_length_data, :difficulty_level, :correct_answer, :hint_text, :explanation)";

    $params = [
        'category_id' => $input['category_id'],
        'title' => $input['title'],
        'description' => $input['description'] ?? null,
        'shape_type' => $input['shape_type'],
        'shape_data' => json_encode($input['shape_data'], JSON_UNESCAPED_UNICODE),
        'hidden_length_data' => json_encode($input['hidden_length_data'], JSON_UNESCAPED_UNICODE),
        'difficulty_level' => $input['difficulty_level'] ?? 1,
        'correct_answer' => $input['correct_answer'],
        'hint_text' => $input['hint_text'] ?? null,
        'explanation' => $input['explanation'] ?? null
    ];

    $result = $db->execute($sql, $params);

    success_response([
        'id' => $result['last_insert_id'],
        'message' => 'Shape created successfully'
    ]);
}

/**
 * Update an existing shape (admin only)
 */
function updateShape($db, $shape_id) {
    $input = json_decode(file_get_contents('php://input'), true);

    // Build dynamic UPDATE query
    $allowed_fields = ['category_id', 'title', 'description', 'shape_type', 'shape_data',
                       'hidden_length_data', 'difficulty_level', 'correct_answer', 'hint_text',
                       'explanation', 'is_active'];

    $update_fields = [];
    $params = ['id' => $shape_id];

    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $update_fields[] = "$field = :$field";
            if ($field === 'shape_data' || $field === 'hidden_length_data') {
                $params[$field] = json_encode($input[$field], JSON_UNESCAPED_UNICODE);
            } else {
                $params[$field] = $input[$field];
            }
        }
    }

    if (empty($update_fields)) {
        error_response('No fields to update', 400);
    }

    $sql = "UPDATE shapes SET " . implode(', ', $update_fields) . " WHERE id = :id";
    $result = $db->execute($sql, $params);

    if ($result['affected_rows'] === 0) {
        error_response('Shape not found or no changes made', 404);
    }

    success_response(['message' => 'Shape updated successfully']);
}

/**
 * Delete a shape (soft delete - set is_active = 0)
 */
function deleteShape($db, $shape_id) {
    $sql = "UPDATE shapes SET is_active = 0 WHERE id = :id";
    $result = $db->execute($sql, ['id' => $shape_id]);

    if ($result['affected_rows'] === 0) {
        error_response('Shape not found', 404);
    }

    success_response(['message' => 'Shape deleted successfully']);
}
