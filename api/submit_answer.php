<?php
/**
 * Submit Answer API
 * Handles user answer submission
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $sessionId = isset($input['session_id']) ? intval($input['session_id']) : null;
    $problemId = isset($input['problem_id']) ? intval($input['problem_id']) : null;
    $userAnswer = isset($input['answer']) ? $input['answer'] : null;

    if (!$sessionId || !$problemId || $userAnswer === null) {
        throw new Exception('Missing required fields: session_id, problem_id, answer');
    }

    $db = Database::getInstance()->getConnection();

    // Get problem details
    $stmt = $db->prepare('SELECT * FROM problems WHERE id = :id');
    $stmt->execute(['id' => $problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    // Check answer correctness (simple comparison for now)
    $isCorrect = trim($userAnswer) === trim($problem['substituted_code']);

    // Store answer
    $stmt = $db->prepare('
        INSERT INTO user_answers (session_id, problem_id, user_answer, is_correct)
        VALUES (:session_id, :problem_id, :answer, :is_correct)
    ');
    $stmt->execute([
        'session_id' => $sessionId,
        'problem_id' => $problemId,
        'answer' => $userAnswer,
        'is_correct' => $isCorrect ? 1 : 0
    ]);

    // Optionally submit to Moodle
    if (MOODLE_TOKEN) {
        try {
            $moodle = new MoodleAPI();
            // Submit to Moodle (attempt_id would come from session)
            // $moodle->submitAnswer($attemptId, $problem['moodle_problem_id'], $userAnswer);
        } catch (Exception $e) {
            error_log('Moodle submit error: ' . $e->getMessage());
        }
    }

    $response = [
        'success' => true,
        'data' => [
            'is_correct' => $isCorrect,
            'answer_id' => intval($db->lastInsertId())
        ]
    ];

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
