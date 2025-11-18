<?php
/**
 * Sessions API Endpoint
 * Handles student sessions and problem attempts
 */

require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

switch ($method) {
    case 'POST':
        handlePost($pdo);
        break;
    case 'PUT':
        handlePut($pdo);
        break;
    case 'GET':
        handleGet($pdo);
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

/**
 * POST /api/sessions.php - Create new session
 */
function handlePost($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $sessionId = bin2hex(random_bytes(16));
        $studentId = $input['student_id'] ?? null;
        $moodleUserId = $input['moodle_user_id'] ?? null;

        $stmt = $pdo->prepare('
            INSERT INTO student_sessions (session_id, student_id, moodle_user_id)
            VALUES (?, ?, ?)
        ');

        $stmt->execute([$sessionId, $studentId, $moodleUserId]);

        jsonResponse([
            'success' => true,
            'data' => ['session_id' => $sessionId]
        ], 201);

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

/**
 * PUT /api/sessions.php - Submit problem attempt
 */
function handlePut($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['session_id'], $input['problem_id'])) {
            jsonResponse(['error' => 'Missing required fields'], 400);
        }

        // Verify problem exists and get answer
        $stmt = $pdo->prepare('SELECT answer FROM problems WHERE id = ?');
        $stmt->execute([$input['problem_id']]);
        $problem = $stmt->fetch();

        if (!$problem) {
            jsonResponse(['error' => 'Problem not found'], 404);
        }

        $studentAnswer = $input['student_answer'] ?? null;
        $isCorrect = false;

        if ($studentAnswer !== null) {
            // Allow small floating point difference
            $isCorrect = abs($studentAnswer - $problem['answer']) < 0.01;
        }

        // Insert attempt
        $stmt = $pdo->prepare('
            INSERT INTO problem_attempts
            (session_id, problem_id, student_answer, is_correct, time_spent, gear_animation_completed)
            VALUES (?, ?, ?, ?, ?, ?)
        ');

        $stmt->execute([
            $input['session_id'],
            $input['problem_id'],
            $studentAnswer,
            $isCorrect,
            $input['time_spent'] ?? 0,
            $input['gear_animation_completed'] ?? false
        ]);

        jsonResponse([
            'success' => true,
            'data' => [
                'is_correct' => $isCorrect,
                'correct_answer' => $problem['answer']
            ]
        ]);

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

/**
 * GET /api/sessions.php?session_id=xxx - Get session statistics
 */
function handleGet($pdo) {
    try {
        if (!isset($_GET['session_id'])) {
            jsonResponse(['error' => 'session_id parameter required'], 400);
        }

        $sessionId = $_GET['session_id'];

        // Get session info
        $stmt = $pdo->prepare('SELECT * FROM student_sessions WHERE session_id = ?');
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            jsonResponse(['error' => 'Session not found'], 404);
        }

        // Get attempts
        $stmt = $pdo->prepare('
            SELECT pa.*, p.problem_text, p.answer as correct_answer
            FROM problem_attempts pa
            JOIN problems p ON pa.problem_id = p.id
            WHERE pa.session_id = ?
            ORDER BY pa.attempted_at DESC
        ');
        $stmt->execute([$sessionId]);
        $attempts = $stmt->fetchAll();

        // Calculate statistics
        $totalAttempts = count($attempts);
        $correctAttempts = array_reduce($attempts, function($carry, $item) {
            return $carry + ($item['is_correct'] ? 1 : 0);
        }, 0);

        jsonResponse([
            'success' => true,
            'data' => [
                'session' => $session,
                'attempts' => $attempts,
                'statistics' => [
                    'total_attempts' => $totalAttempts,
                    'correct_attempts' => $correctAttempts,
                    'accuracy' => $totalAttempts > 0 ? round($correctAttempts / $totalAttempts * 100, 2) : 0
                ]
            ]
        ]);

    } catch (PDOException $e) {
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
