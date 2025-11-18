<?php
/**
 * Student Progress API Endpoint
 * 학생 진행 상황 관련 API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$db = Database::getInstance()->getConnection();

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

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * GET: 진행 상황 조회
 */
function handleGet($db) {
    $studentId = $_GET['student_id'] ?? null;
    $problemId = $_GET['problem_id'] ?? null;

    if (!$studentId) {
        http_response_code(400);
        echo json_encode(['error' => 'student_id is required']);
        return;
    }

    if ($problemId) {
        // 특정 문제의 진행 상황
        $stmt = $db->prepare("
            SELECT * FROM student_progress
            WHERE student_id = ? AND problem_id = ?
            ORDER BY started_at DESC LIMIT 1
        ");
        $stmt->execute([$studentId, $problemId]);
        $progress = $stmt->fetch();

        echo json_encode(['success' => true, 'data' => $progress ?: null]);
    } else {
        // 학생의 모든 진행 상황
        $stmt = $db->prepare("
            SELECT sp.*, p.title, p.equation, p.difficulty
            FROM student_progress sp
            JOIN problems p ON sp.problem_id = p.id
            WHERE sp.student_id = ?
            ORDER BY sp.started_at DESC
        ");
        $stmt->execute([$studentId]);
        $progress = $stmt->fetchAll();

        echo json_encode(['success' => true, 'data' => $progress]);
    }
}

/**
 * POST: 새 진행 상황 시작
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['student_id']) || !isset($input['problem_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'student_id and problem_id are required']);
        return;
    }

    $stmt = $db->prepare("
        INSERT INTO student_progress (student_id, problem_id, solution_steps)
        VALUES (?, ?, ?)
    ");

    $stmt->execute([
        $input['student_id'],
        $input['problem_id'],
        json_encode([])
    ]);

    $progressId = $db->lastInsertId();

    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $progressId,
            'message' => 'Progress started'
        ]
    ]);
}

/**
 * PUT: 진행 상황 업데이트
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Progress id is required']);
        return;
    }

    $updateFields = [];
    $params = [];

    if (isset($input['solution_steps'])) {
        $updateFields[] = "solution_steps = ?";
        $params[] = json_encode($input['solution_steps']);
    }

    if (isset($input['is_solved'])) {
        $updateFields[] = "is_solved = ?";
        $params[] = $input['is_solved'] ? 1 : 0;

        if ($input['is_solved']) {
            $updateFields[] = "completed_at = NOW()";
        }
    }

    if (isset($input['time_spent'])) {
        $updateFields[] = "time_spent = ?";
        $params[] = $input['time_spent'];
    }

    $updateFields[] = "attempt_count = attempt_count + 1";

    $params[] = $input['id'];

    $sql = "UPDATE student_progress SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Progress updated']);
}
