<?php
/**
 * Problems API
 * 문제 데이터 조회 및 관리 API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../utils/db.php';
require_once __DIR__ . '/../moodle/connector.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGetProblems($db);
            break;

        case 'POST':
            handleCreateProblem($db);
            break;

        default:
            respondError('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Problems API Error: " . $e->getMessage());
    respondError('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * GET: 문제 목록 조회
 */
function handleGetProblems($db) {
    $studentId = $_GET['student_id'] ?? null;
    $moodleCourseId = $_GET['moodle_course_id'] ?? null;
    $difficulty = $_GET['difficulty'] ?? null;
    $problemId = $_GET['problem_id'] ?? null;

    // 단일 문제 조회
    if ($problemId) {
        $problem = $db->fetchOne(
            "SELECT * FROM problems WHERE id = :id AND is_active = TRUE",
            ['id' => $problemId]
        );

        if (!$problem) {
            respondError('Problem not found', 404);
        }

        // 학생의 진행 기록 포함
        if ($studentId) {
            $progress = $db->fetchAll(
                "SELECT * FROM student_progress
                 WHERE student_id = :student_id AND problem_id = :problem_id
                 ORDER BY submitted_at DESC",
                ['student_id' => $studentId, 'problem_id' => $problemId]
            );
            $problem['progress'] = $progress;
        }

        respondSuccess(['problem' => formatProblem($problem)]);
        return;
    }

    // 문제 목록 조회
    $sql = "SELECT p.* FROM problems p WHERE p.is_active = TRUE";
    $params = [];

    if ($moodleCourseId) {
        $sql .= " AND p.moodle_course_id = :course_id";
        $params['course_id'] = $moodleCourseId;
    }

    if ($difficulty) {
        $sql .= " AND p.difficulty = :difficulty";
        $params['difficulty'] = $difficulty;
    }

    $sql .= " ORDER BY p.difficulty, p.id";

    $problems = $db->fetchAll($sql, $params);

    // 각 문제에 대한 학생의 진행 상태 추가
    if ($studentId) {
        foreach ($problems as &$problem) {
            $progress = $db->fetchOne(
                "SELECT
                    COUNT(*) as attempts,
                    MAX(is_correct) as solved,
                    MAX(score) as best_score,
                    MIN(time_spent) as best_time
                 FROM student_progress
                 WHERE student_id = :student_id AND problem_id = :problem_id",
                ['student_id' => $studentId, 'problem_id' => $problem['id']]
            );
            $problem['student_stats'] = $progress;
        }
    }

    respondSuccess([
        'problems' => array_map('formatProblem', $problems),
        'total' => count($problems)
    ]);
}

/**
 * POST: 새 문제 생성
 */
function handleCreateProblem($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        respondError('Invalid JSON', 400);
    }

    // Validate required fields
    $required = ['title', 'vector1_x', 'vector1_y', 'vector2_x', 'vector2_y', 'target_angle'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            respondError("Missing required field: $field", 400);
        }
    }

    // Calculate angle for validation
    $calculatedAngle = calculateAngle(
        $input['vector1_x'], $input['vector1_y'],
        $input['vector2_x'], $input['vector2_y']
    );

    $angleDiff = abs($calculatedAngle - $input['target_angle']);
    if ($angleDiff > 0.1) {
        respondError("Vector coordinates don't match target angle (calculated: $calculatedAngle)", 400);
    }

    $data = [
        'title' => $input['title'],
        'description' => $input['description'] ?? '',
        'moodle_course_id' => $input['moodle_course_id'] ?? null,
        'moodle_quiz_id' => $input['moodle_quiz_id'] ?? null,
        'vector1_x' => $input['vector1_x'],
        'vector1_y' => $input['vector1_y'],
        'vector2_x' => $input['vector2_x'],
        'vector2_y' => $input['vector2_y'],
        'target_angle' => $input['target_angle'],
        'tolerance' => $input['tolerance'] ?? 2.0,
        'difficulty' => $input['difficulty'] ?? 'medium',
        'max_attempts' => $input['max_attempts'] ?? 3,
        'time_limit' => $input['time_limit'] ?? 300
    ];

    $problemId = $db->insert('problems', $data);

    respondSuccess([
        'message' => 'Problem created successfully',
        'problem_id' => $problemId
    ], 201);
}

/**
 * Calculate angle between two vectors (in degrees)
 */
function calculateAngle($x1, $y1, $x2, $y2) {
    $dot = $x1 * $x2 + $y1 * $y2;
    $mag1 = sqrt($x1 * $x1 + $y1 * $y1);
    $mag2 = sqrt($x2 * $x2 + $y2 * $y2);

    if ($mag1 == 0 || $mag2 == 0) {
        return 0;
    }

    $cosAngle = $dot / ($mag1 * $mag2);
    $cosAngle = max(-1, min(1, $cosAngle)); // Clamp to [-1, 1]

    return rad2deg(acos($cosAngle));
}

/**
 * Format problem data for response
 */
function formatProblem($problem) {
    return [
        'id' => (int)$problem['id'],
        'title' => $problem['title'],
        'description' => $problem['description'],
        'moodle_course_id' => $problem['moodle_course_id'] ? (int)$problem['moodle_course_id'] : null,
        'moodle_quiz_id' => $problem['moodle_quiz_id'] ? (int)$problem['moodle_quiz_id'] : null,
        'vector1' => [
            'x' => (float)$problem['vector1_x'],
            'y' => (float)$problem['vector1_y']
        ],
        'vector2' => [
            'x' => (float)$problem['vector2_x'],
            'y' => (float)$problem['vector2_y']
        ],
        'target_angle' => (float)$problem['target_angle'],
        'tolerance' => (float)$problem['tolerance'],
        'difficulty' => $problem['difficulty'],
        'max_attempts' => (int)$problem['max_attempts'],
        'time_limit' => (int)$problem['time_limit'],
        'progress' => $problem['progress'] ?? null,
        'student_stats' => $problem['student_stats'] ?? null
    ];
}

/**
 * Send success response
 */
function respondSuccess($data, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Send error response
 */
function respondError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
