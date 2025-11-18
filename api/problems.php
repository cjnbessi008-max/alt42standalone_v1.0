<?php
/**
 * Problems API
 * Handles CRUD operations for problems
 */

require_once __DIR__ . '/../config/database.php';

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;
        case 'POST':
            handlePost($db);
            break;
        case 'PUT':
            handlePut($db);
            break;
        case 'DELETE':
            handleDelete($db);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    errorResponse('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * GET - Retrieve problems
 */
function handleGet($db) {
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    $includeConditions = isset($_GET['include_conditions']) ? filter_var($_GET['include_conditions'], FILTER_VALIDATE_BOOLEAN) : false;

    if ($problemId) {
        // Get specific problem with conditions
        $problem = getProblemById($db, $problemId, $includeConditions);

        if (!$problem) {
            errorResponse('Problem not found', 404);
        }

        // If student_id provided, include progress
        if ($studentId) {
            $problem['student_progress'] = getStudentProgress($db, $studentId, $problemId);
            $problem['checked_conditions'] = getCheckedConditions($db, $studentId, $problemId);
        }

        successResponse($problem);
    } else {
        // Get all active problems
        $filters = [
            'subject' => isset($_GET['subject']) ? sanitize($_GET['subject']) : null,
            'difficulty' => isset($_GET['difficulty']) ? sanitize($_GET['difficulty']) : null,
            'grade_level' => isset($_GET['grade_level']) ? sanitize($_GET['grade_level']) : null,
            'teacher_id' => isset($_GET['teacher_id']) ? intval($_GET['teacher_id']) : null
        ];

        $problems = getProblems($db, $filters, $includeConditions);
        successResponse($problems);
    }
}

/**
 * POST - Create new problem
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        errorResponse('Invalid JSON input');
    }

    // Validate required fields
    $required = ['teacher_id', 'title', 'problem_text'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Missing required field: $field");
        }
    }

    $db->beginTransaction();

    try {
        // Insert problem
        $sql = "INSERT INTO problems (
            teacher_id, title, description, problem_text,
            subject, difficulty_level, grade_level,
            require_all_conditions, min_reading_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $params = [
            intval($input['teacher_id']),
            sanitize($input['title']),
            sanitize($input['description'] ?? ''),
            sanitize($input['problem_text']),
            sanitize($input['subject'] ?? 'mathematics'),
            sanitize($input['difficulty_level'] ?? 'medium'),
            sanitize($input['grade_level'] ?? ''),
            isset($input['require_all_conditions']) ? intval($input['require_all_conditions']) : 1,
            isset($input['min_reading_time']) ? intval($input['min_reading_time']) : 30
        ];

        $db->query($sql, $params);
        $problemId = $db->lastInsertId();

        // Insert conditions if provided
        if (!empty($input['conditions']) && is_array($input['conditions'])) {
            insertConditions($db, $problemId, $input['conditions']);
        }

        $db->commit();

        $problem = getProblemById($db, $problemId, true);
        successResponse($problem, 'Problem created successfully');

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * PUT - Update problem
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['id'])) {
        errorResponse('Problem ID is required');
    }

    $problemId = intval($input['id']);

    // Check if problem exists
    $existing = getProblemById($db, $problemId);
    if (!$existing) {
        errorResponse('Problem not found', 404);
    }

    $db->beginTransaction();

    try {
        // Update problem
        $sql = "UPDATE problems SET
            title = ?, description = ?, problem_text = ?,
            subject = ?, difficulty_level = ?, grade_level = ?,
            require_all_conditions = ?, min_reading_time = ?,
            is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?";

        $params = [
            sanitize($input['title'] ?? $existing['title']),
            sanitize($input['description'] ?? $existing['description']),
            sanitize($input['problem_text'] ?? $existing['problem_text']),
            sanitize($input['subject'] ?? $existing['subject']),
            sanitize($input['difficulty_level'] ?? $existing['difficulty_level']),
            sanitize($input['grade_level'] ?? $existing['grade_level']),
            isset($input['require_all_conditions']) ? intval($input['require_all_conditions']) : $existing['require_all_conditions'],
            isset($input['min_reading_time']) ? intval($input['min_reading_time']) : $existing['min_reading_time'],
            isset($input['is_active']) ? intval($input['is_active']) : $existing['is_active'],
            $problemId
        ];

        $db->query($sql, $params);

        // Update conditions if provided
        if (isset($input['conditions']) && is_array($input['conditions'])) {
            // Delete existing conditions
            $db->query("DELETE FROM conditions WHERE problem_id = ?", [$problemId]);
            // Insert new conditions
            insertConditions($db, $problemId, $input['conditions']);
        }

        $db->commit();

        $problem = getProblemById($db, $problemId, true);
        successResponse($problem, 'Problem updated successfully');

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * DELETE - Delete problem
 */
function handleDelete($db) {
    $problemId = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$problemId) {
        errorResponse('Problem ID is required');
    }

    $problem = getProblemById($db, $problemId);
    if (!$problem) {
        errorResponse('Problem not found', 404);
    }

    $db->query("DELETE FROM problems WHERE id = ?", [$problemId]);
    successResponse([], 'Problem deleted successfully');
}

/**
 * Helper: Get problem by ID
 */
function getProblemById($db, $problemId, $includeConditions = false) {
    $sql = "SELECT p.*, t.name as teacher_name
            FROM problems p
            LEFT JOIN teachers t ON p.teacher_id = t.id
            WHERE p.id = ?";

    $problem = $db->fetchOne($sql, [$problemId]);

    if ($problem && $includeConditions) {
        $problem['conditions'] = getConditions($db, $problemId);
    }

    return $problem;
}

/**
 * Helper: Get all problems with filters
 */
function getProblems($db, $filters = [], $includeConditions = false) {
    $sql = "SELECT p.*, t.name as teacher_name
            FROM problems p
            LEFT JOIN teachers t ON p.teacher_id = t.id
            WHERE p.is_active = 1";

    $params = [];

    if (!empty($filters['subject'])) {
        $sql .= " AND p.subject = ?";
        $params[] = $filters['subject'];
    }

    if (!empty($filters['difficulty'])) {
        $sql .= " AND p.difficulty_level = ?";
        $params[] = $filters['difficulty'];
    }

    if (!empty($filters['grade_level'])) {
        $sql .= " AND p.grade_level = ?";
        $params[] = $filters['grade_level'];
    }

    if (!empty($filters['teacher_id'])) {
        $sql .= " AND p.teacher_id = ?";
        $params[] = $filters['teacher_id'];
    }

    $sql .= " ORDER BY p.created_at DESC";

    $problems = $db->fetchAll($sql, $params);

    if ($includeConditions) {
        foreach ($problems as &$problem) {
            $problem['conditions'] = getConditions($db, $problem['id']);
        }
    }

    return $problems;
}

/**
 * Helper: Get conditions for a problem
 */
function getConditions($db, $problemId) {
    $sql = "SELECT * FROM conditions
            WHERE problem_id = ?
            ORDER BY condition_order ASC, id ASC";

    return $db->fetchAll($sql, [$problemId]);
}

/**
 * Helper: Insert conditions
 */
function insertConditions($db, $problemId, $conditions) {
    $sql = "INSERT INTO conditions (
        problem_id, condition_text, condition_order,
        is_critical, highlight_color
    ) VALUES (?, ?, ?, ?, ?)";

    foreach ($conditions as $index => $condition) {
        $params = [
            $problemId,
            sanitize($condition['text'] ?? $condition['condition_text']),
            isset($condition['order']) ? intval($condition['order']) : $index,
            isset($condition['is_critical']) ? intval($condition['is_critical']) : 1,
            sanitize($condition['highlight_color'] ?? '#ffeb3b')
        ];

        $db->query($sql, $params);
    }
}

/**
 * Helper: Get student progress
 */
function getStudentProgress($db, $studentId, $problemId) {
    $sql = "SELECT * FROM student_progress
            WHERE student_id = ? AND problem_id = ?";

    return $db->fetchOne($sql, [$studentId, $problemId]);
}

/**
 * Helper: Get checked conditions
 */
function getCheckedConditions($db, $studentId, $problemId) {
    $sql = "SELECT condition_id, checked_at, time_to_check
            FROM condition_checks
            WHERE student_id = ? AND problem_id = ?";

    return $db->fetchAll($sql, [$studentId, $problemId]);
}
