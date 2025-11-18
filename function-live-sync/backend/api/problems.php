<?php
/**
 * Function Live Sync - Problems API
 * 문제 정보 조회 API (Moodle 연동)
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProblem();
        break;

    case 'POST':
        createProblem();
        break;

    case 'PUT':
        updateProblem();
        break;

    case 'DELETE':
        deleteProblem();
        break;

    default:
        errorResponse('Method not allowed', 405);
}

/**
 * 문제 조회
 */
function getProblem() {
    $pdo = getDbConnection();

    // ID로 조회
    if (isset($_GET['id'])) {
        $id = validateInput($_GET['id'], 'int');

        if (!$id) {
            errorResponse('Invalid problem ID');
        }

        $stmt = $pdo->prepare('
            SELECT * FROM problems WHERE id = :id
        ');
        $stmt->execute(['id' => $id]);
        $problem = $stmt->fetch();

        if (!$problem) {
            errorResponse('Problem not found', 404);
        }

        successResponse(['problem' => $problem]);
    }

    // Moodle 문제 ID로 조회
    if (isset($_GET['moodle_id'])) {
        $moodleId = validateInput($_GET['moodle_id'], 'int');

        $stmt = $pdo->prepare('
            SELECT * FROM problems WHERE moodle_question_id = :moodle_id
        ');
        $stmt->execute(['moodle_id' => $moodleId]);
        $problem = $stmt->fetch();

        if (!$problem) {
            errorResponse('Problem not found', 404);
        }

        successResponse(['problem' => $problem]);
    }

    // 전체 문제 목록 조회
    $stmt = $pdo->query('
        SELECT * FROM problems
        ORDER BY created_at DESC
        LIMIT 100
    ');
    $problems = $stmt->fetchAll();

    successResponse(['problems' => $problems, 'count' => count($problems)]);
}

/**
 * 새 문제 생성
 */
function createProblem() {
    $pdo = getDbConnection();
    $data = getPostData();

    // 필수 필드 검증
    $required = ['title', 'initial_function'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            errorResponse("Missing required field: $field");
        }
    }

    // 데이터 검증
    $title = validateInput($data['title'], 'string', 255);
    $description = validateInput($data['description'] ?? '', 'string');
    $functionType = validateInput($data['function_type'] ?? 'linear', 'string');
    $initialFunction = validateInput($data['initial_function'], 'string', 500);
    $moodleQuestionId = validateInput($data['moodle_question_id'] ?? null, 'int');

    $xRangeMin = validateInput($data['x_range_min'] ?? -10, 'float');
    $xRangeMax = validateInput($data['x_range_max'] ?? 10, 'float');
    $yRangeMin = validateInput($data['y_range_min'] ?? -10, 'float');
    $yRangeMax = validateInput($data['y_range_max'] ?? 10, 'float');
    $gridSize = validateInput($data['grid_size'] ?? 1, 'float');

    $showGrid = isset($data['show_grid']) ? (bool)$data['show_grid'] : true;
    $showAxes = isset($data['show_axes']) ? (bool)$data['show_axes'] : true;
    $allowStudentEdit = isset($data['allow_student_edit']) ? (bool)$data['allow_student_edit'] : true;

    try {
        $stmt = $pdo->prepare('
            INSERT INTO problems (
                moodle_question_id, title, description, function_type,
                initial_function, x_range_min, x_range_max, y_range_min, y_range_max,
                grid_size, show_grid, show_axes, allow_student_edit
            ) VALUES (
                :moodle_id, :title, :description, :function_type,
                :initial_function, :x_min, :x_max, :y_min, :y_max,
                :grid_size, :show_grid, :show_axes, :allow_edit
            )
        ');

        $stmt->execute([
            'moodle_id' => $moodleQuestionId,
            'title' => $title,
            'description' => $description,
            'function_type' => $functionType,
            'initial_function' => $initialFunction,
            'x_min' => $xRangeMin,
            'x_max' => $xRangeMax,
            'y_min' => $yRangeMin,
            'y_max' => $yRangeMax,
            'grid_size' => $gridSize,
            'show_grid' => $showGrid,
            'show_axes' => $showAxes,
            'allow_edit' => $allowStudentEdit
        ]);

        $problemId = $pdo->lastInsertId();

        logMessage("New problem created: ID=$problemId, Title=$title");

        successResponse([
            'problem_id' => $problemId,
            'message' => 'Problem created successfully'
        ]);
    } catch (PDOException $e) {
        logMessage("Error creating problem: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to create problem', 500);
    }
}

/**
 * 문제 업데이트
 */
function updateProblem() {
    $pdo = getDbConnection();
    $data = getPostData();

    if (empty($data['id'])) {
        errorResponse('Problem ID is required');
    }

    $id = validateInput($data['id'], 'int');

    // 존재 여부 확인
    $stmt = $pdo->prepare('SELECT id FROM problems WHERE id = :id');
    $stmt->execute(['id' => $id]);

    if (!$stmt->fetch()) {
        errorResponse('Problem not found', 404);
    }

    // 업데이트할 필드 구성
    $updates = [];
    $params = ['id' => $id];

    $allowedFields = [
        'title', 'description', 'function_type', 'initial_function',
        'x_range_min', 'x_range_max', 'y_range_min', 'y_range_max',
        'grid_size', 'show_grid', 'show_axes', 'allow_student_edit'
    ];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }

    if (empty($updates)) {
        errorResponse('No fields to update');
    }

    try {
        $sql = 'UPDATE problems SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        logMessage("Problem updated: ID=$id");

        successResponse(['message' => 'Problem updated successfully']);
    } catch (PDOException $e) {
        logMessage("Error updating problem: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to update problem', 500);
    }
}

/**
 * 문제 삭제
 */
function deleteProblem() {
    $pdo = getDbConnection();
    $data = getPostData();

    if (empty($data['id'])) {
        errorResponse('Problem ID is required');
    }

    $id = validateInput($data['id'], 'int');

    try {
        $stmt = $pdo->prepare('DELETE FROM problems WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            errorResponse('Problem not found', 404);
        }

        logMessage("Problem deleted: ID=$id");

        successResponse(['message' => 'Problem deleted successfully']);
    } catch (PDOException $e) {
        logMessage("Error deleting problem: " . $e->getMessage(), 'ERROR');
        errorResponse('Failed to delete problem', 500);
    }
}
