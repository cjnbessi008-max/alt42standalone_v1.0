<?php
/**
 * Problems API
 * Handles problem retrieval and answer submission
 */

header('Content-Type: application/json');
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = auth()->requireAuth();

try {
    switch ($method) {
        case 'GET':
            getProblems($user);
            break;

        case 'POST':
            submitAnswer($user);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Get problems by difficulty level
 */
function getProblems($user) {
    $difficulty = $_GET['difficulty'] ?? null;
    $problemId = $_GET['problem_id'] ?? null;
    $limit = min($_GET['limit'] ?? 10, 50);

    if ($problemId) {
        // Get specific problem
        $sql = "SELECT id, title, description, difficulty_level, problem_type,
                       question_data, hints, estimated_time, subject, tags
                FROM problems
                WHERE id = ? AND is_active = 1";

        $problem = db()->fetchOne($sql, [$problemId]);

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found']);
            return;
        }

        // Decode JSON fields
        $problem['question_data'] = json_decode($problem['question_data'], true);
        $problem['hints'] = json_decode($problem['hints'], true);
        $problem['tags'] = json_decode($problem['tags'], true);

        echo json_encode(['problem' => $problem]);

    } else if ($difficulty) {
        // Get random problems for difficulty level
        $sql = "SELECT id, title, description, difficulty_level, problem_type,
                       question_data, hints, estimated_time, subject, tags
                FROM problems
                WHERE difficulty_level = ? AND is_active = 1
                ORDER BY RAND()
                LIMIT ?";

        $problems = db()->fetchAll($sql, [$difficulty, $limit]);

        foreach ($problems as &$problem) {
            $problem['question_data'] = json_decode($problem['question_data'], true);
            $problem['hints'] = json_decode($problem['hints'], true);
            $problem['tags'] = json_decode($problem['tags'], true);
        }

        echo json_encode([
            'problems' => $problems,
            'difficulty' => $difficulty,
            'count' => count($problems)
        ]);

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'difficulty or problem_id parameter required']);
    }
}

/**
 * Submit answer and check correctness
 */
function submitAnswer($user) {
    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['session_id', 'problem_id', 'answer', 'time_spent_seconds'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field '$field' is required"]);
            return;
        }
    }

    $sessionId = $input['session_id'];
    $problemId = $input['problem_id'];
    $userAnswer = $input['answer'];
    $timeSpent = $input['time_spent_seconds'];
    $hintsUsed = $input['hints_used'] ?? 0;

    // Verify session belongs to user
    $session = db()->fetchOne(
        "SELECT id, user_id FROM learning_sessions WHERE id = ? AND session_status = 'active'",
        [$sessionId]
    );

    if (!$session || $session['user_id'] != $user['user_id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid session']);
        return;
    }

    // Get problem and correct answer
    $problem = db()->fetchOne(
        "SELECT id, correct_answer, difficulty_level, problem_type FROM problems WHERE id = ?",
        [$problemId]
    );

    if (!$problem) {
        http_response_code(404);
        echo json_encode(['error' => 'Problem not found']);
        return;
    }

    $correctAnswer = json_decode($problem['correct_answer'], true);

    // Check if answer is correct
    $isCorrect = checkAnswer($userAnswer, $correctAnswer, $problem['problem_type']);

    // Calculate score (0-100)
    $score = calculateScore($isCorrect, $timeSpent, $hintsUsed, $problem['difficulty_level']);

    // Check for previous attempts
    $attemptNumber = db()->fetchOne(
        "SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
         FROM problem_attempts
         WHERE session_id = ? AND problem_id = ?",
        [$sessionId, $problemId]
    )['next_attempt'];

    // Save attempt
    $attemptId = db()->insert('problem_attempts', [
        'session_id' => $sessionId,
        'problem_id' => $problemId,
        'user_id' => $user['user_id'],
        'attempt_number' => $attemptNumber,
        'submitted_at' => date('Y-m-d H:i:s'),
        'time_spent_seconds' => $timeSpent,
        'user_answer' => json_encode($userAnswer),
        'is_correct' => $isCorrect ? 1 : 0,
        'score' => $score,
        'hints_used' => $hintsUsed
    ]);

    // Update session statistics
    if ($attemptNumber == 1) {
        db()->query(
            "UPDATE learning_sessions
             SET problems_attempted = problems_attempted + 1,
                 problems_correct = problems_correct + ?
             WHERE id = ?",
            [$isCorrect ? 1 : 0, $sessionId]
        );
    }

    echo json_encode([
        'success' => true,
        'attempt_id' => $attemptId,
        'is_correct' => $isCorrect,
        'score' => $score,
        'attempt_number' => $attemptNumber,
        'correct_answer' => $isCorrect ? null : $correctAnswer,
        'explanation' => $correctAnswer['explanation'] ?? null
    ]);
}

/**
 * Check if user answer matches correct answer
 */
function checkAnswer($userAnswer, $correctAnswer, $problemType) {
    switch ($problemType) {
        case 'multiple_choice':
            return $userAnswer === $correctAnswer['answer'];

        case 'short_answer':
            if (isset($correctAnswer['numerator']) && isset($correctAnswer['denominator'])) {
                // Fraction answer
                return ($userAnswer['numerator'] == $correctAnswer['numerator'] &&
                        $userAnswer['denominator'] == $correctAnswer['denominator']);
            }
            return strtolower(trim($userAnswer)) === strtolower(trim($correctAnswer['answer']));

        case 'essay':
            // For essays, we'll need manual grading or AI - for now return false
            return false;

        case 'coding':
            // Would need code execution sandbox
            return false;

        default:
            return false;
    }
}

/**
 * Calculate score based on correctness, time, and hints
 */
function calculateScore($isCorrect, $timeSpent, $hintsUsed, $difficulty) {
    if (!$isCorrect) {
        return 0;
    }

    $baseScore = 100;

    // Deduct for hints used (10 points per hint)
    $hintPenalty = min($hintsUsed * 10, 30);

    // Time bonus/penalty (placeholder - would need expected time from problem)
    $timePenalty = 0;

    $finalScore = max(0, $baseScore - $hintPenalty - $timePenalty);

    return round($finalScore, 2);
}
