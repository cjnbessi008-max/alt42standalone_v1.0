<?php
/**
 * Save Progress
 * Saves user's problem attempt and updates progress
 */

require_once __DIR__ . '/config.php';

// Set headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON([
        'success' => false,
        'error' => 'Method not allowed'
    ], 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendJSON([
            'success' => false,
            'error' => 'Invalid JSON input'
        ], 400);
    }

    // Start session and validate
    session_start();

    if (!isset($_SESSION[SESSION_PREFIX . 'session_id'])) {
        sendJSON([
            'success' => false,
            'error' => 'No active session'
        ], 401);
    }

    $sessionId = $_SESSION[SESSION_PREFIX . 'session_id'];
    $userId = $_SESSION[SESSION_PREFIX . 'user_id'];

    // Validate required fields
    $requiredFields = ['problemData', 'answer'];

    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            sendJSON([
                'success' => false,
                'error' => "Missing required field: $field"
            ], 400);
        }
    }

    $problemData = $input['problemData'];
    $answer = $input['answer'];

    // Validate problem data
    if (!isset($problemData['problemNumber'], $problemData['setA'], $problemData['setB'],
               $problemData['union'], $problemData['colorA'], $problemData['colorB'],
               $problemData['colorUnion'], $problemData['correctAnswer'])) {
        sendJSON([
            'success' => false,
            'error' => 'Invalid problem data'
        ], 400);
    }

    $db = getDB();

    // Begin transaction
    $db->beginTransaction();

    // Save problem
    $stmt = $db->prepare("
        INSERT INTO cu_problems (
            session_id, problem_number, set_a, set_b, union_set,
            color_a, color_b, color_union, correct_answer
        ) VALUES (
            :session_id, :problem_number, :set_a, :set_b, :union_set,
            :color_a, :color_b, :color_union, :correct_answer
        )
        ON DUPLICATE KEY UPDATE
            set_a = VALUES(set_a),
            set_b = VALUES(set_b),
            union_set = VALUES(union_set),
            color_a = VALUES(color_a),
            color_b = VALUES(color_b),
            color_union = VALUES(color_union),
            correct_answer = VALUES(correct_answer)
    ");

    $stmt->execute([
        'session_id' => $sessionId,
        'problem_number' => $problemData['problemNumber'],
        'set_a' => json_encode($problemData['setA']),
        'set_b' => json_encode($problemData['setB']),
        'union_set' => json_encode($problemData['union']),
        'color_a' => $problemData['colorA'],
        'color_b' => $problemData['colorB'],
        'color_union' => $problemData['colorUnion'],
        'correct_answer' => $problemData['correctAnswer']
    ]);

    // Get problem ID
    $problemId = $db->lastInsertId();
    if (!$problemId) {
        // If ON DUPLICATE KEY UPDATE was triggered, get existing problem ID
        $stmt = $db->prepare("
            SELECT id FROM cu_problems
            WHERE session_id = :session_id AND problem_number = :problem_number
        ");
        $stmt->execute([
            'session_id' => $sessionId,
            'problem_number' => $problemData['problemNumber']
        ]);
        $problem = $stmt->fetch();
        $problemId = $problem['id'];
    }

    // Validate answer data
    if (!isset($answer['userAnswer'], $answer['isCorrect'], $answer['timeSpent'])) {
        $db->rollBack();
        sendJSON([
            'success' => false,
            'error' => 'Invalid answer data'
        ], 400);
    }

    // Calculate points
    $pointsEarned = $answer['isCorrect'] ? POINTS_CORRECT : POINTS_INCORRECT;

    // Add time bonus if enabled and correct
    if ($answer['isCorrect'] && TIME_BONUS_ENABLED && $answer['timeSpent'] < 30) {
        $timeBonus = floor((30 - $answer['timeSpent']) * TIME_BONUS_MULTIPLIER);
        $pointsEarned += $timeBonus;
    }

    // Save attempt using stored procedure
    $stmt = $db->prepare("
        CALL sp_save_attempt(
            :problem_id,
            :user_id,
            :user_answer,
            :is_correct,
            :time_spent,
            :points_earned
        )
    ");

    $stmt->execute([
        'problem_id' => $problemId,
        'user_id' => $userId,
        'user_answer' => $answer['userAnswer'],
        'is_correct' => $answer['isCorrect'] ? 1 : 0,
        'time_spent' => $answer['timeSpent'],
        'points_earned' => $pointsEarned
    ]);

    // Update session score
    $stmt = $db->prepare("
        UPDATE cu_sessions
        SET total_score = total_score + :points
        WHERE id = :session_id
    ");
    $stmt->execute([
        'points' => $pointsEarned,
        'session_id' => $sessionId
    ]);

    // Commit transaction
    $db->commit();

    // Log event
    logEvent($userId, $sessionId, 'problem_attempted', [
        'problem_number' => $problemData['problemNumber'],
        'is_correct' => $answer['isCorrect'],
        'points_earned' => $pointsEarned,
        'time_spent' => $answer['timeSpent']
    ]);

    // Get updated session score
    $stmt = $db->prepare("SELECT total_score FROM cu_sessions WHERE id = :session_id");
    $stmt->execute(['session_id' => $sessionId]);
    $session = $stmt->fetch();

    sendJSON([
        'success' => true,
        'problemId' => $problemId,
        'pointsEarned' => $pointsEarned,
        'totalScore' => $session['total_score'],
        'message' => $answer['isCorrect'] ? '정답입니다!' : '다시 시도해보세요.'
    ]);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Database error in save-progress.php: ' . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Database error occurred'
    ], 500);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Error in save-progress.php: ' . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'An error occurred while saving progress'
    ], 500);
}
