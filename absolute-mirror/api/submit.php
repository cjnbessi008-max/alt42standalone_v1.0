<?php
/**
 * Absolute Mirror API - Submit Answer
 * Records student attempt and validates answer
 */

require_once '../config/database.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['success' => false, 'error' => 'Method not allowed'], 405);
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        sendJSON(['success' => false, 'error' => 'Invalid JSON'], 400);
    }

    // Validate required fields
    if (!isset($input['problem_id']) || !isset($input['answer'])) {
        sendJSON(['success' => false, 'error' => 'Missing required fields'], 400);
    }

    $problemId = (int)$input['problem_id'];
    $answer = $input['answer'];
    $userId = isset($input['student_id']) ? (int)$input['student_id'] : null;
    $timeSpent = isset($input['time_spent']) ? (int)$input['time_spent'] : null;

    // Get database connection
    $pdo = getDBConnection();

    // Get problem details
    $stmt = $pdo->prepare("
        SELECT
            id,
            equation,
            solution_left,
            solution_right,
            difficulty
        FROM problems
        WHERE id = :id AND is_active = 1
    ");
    $stmt->bindValue(':id', $problemId, PDO::PARAM_INT);
    $stmt->execute();
    $problem = $stmt->fetch();

    if (!$problem) {
        sendJSON(['success' => false, 'error' => 'Problem not found'], 404);
    }

    // Validate answer
    $isCorrect = false;
    $submittedAnswers = is_array($answer) ? $answer : [$answer];

    // Check if submitted answers match solutions
    $solutionLeft = (float)$problem['solution_left'];
    $solutionRight = (float)$problem['solution_right'];

    foreach ($submittedAnswers as $submittedAnswer) {
        $submittedValue = (float)$submittedAnswer;

        // Allow small tolerance for floating point comparison
        if (abs($submittedValue - $solutionLeft) < 0.01 ||
            abs($submittedValue - $solutionRight) < 0.01) {
            $isCorrect = true;
            break;
        }
    }

    // For complete solution, check if both solutions are provided
    $isCompleteCorrect = false;
    if (count($submittedAnswers) === 2) {
        $sorted = $submittedAnswers;
        sort($sorted);
        $expectedSorted = [$solutionLeft, $solutionRight];
        sort($expectedSorted);

        if (abs($sorted[0] - $expectedSorted[0]) < 0.01 &&
            abs($sorted[1] - $expectedSorted[1]) < 0.01) {
            $isCompleteCorrect = true;
        }
    }

    // If user ID is provided, record the attempt
    if ($userId) {
        // Get attempt number for this user and problem
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM student_attempts
            WHERE user_id = :user_id AND problem_id = :problem_id
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':problem_id' => $problemId
        ]);
        $attemptNumber = $stmt->fetch()['count'] + 1;

        // Insert attempt
        $stmt = $pdo->prepare("
            INSERT INTO student_attempts (
                user_id,
                problem_id,
                answer_submitted,
                is_correct,
                attempt_number,
                time_spent_seconds,
                attempted_at
            ) VALUES (
                :user_id,
                :problem_id,
                :answer,
                :is_correct,
                :attempt_number,
                :time_spent,
                NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':problem_id' => $problemId,
            ':answer' => json_encode($submittedAnswers),
            ':is_correct' => $isCompleteCorrect ? 1 : 0,
            ':attempt_number' => $attemptNumber,
            ':time_spent' => $timeSpent
        ]);

        // Update student progress using stored procedure
        $stmt = $pdo->prepare("
            CALL update_student_progress(:user_id, :problem_id, :is_correct, :time_spent)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':problem_id' => $problemId,
            ':is_correct' => $isCompleteCorrect ? 1 : 0,
            ':time_spent' => $timeSpent ?? 0
        ]);
    }

    // Send response
    sendJSON([
        'success' => true,
        'is_correct' => $isCorrect,
        'is_complete_correct' => $isCompleteCorrect,
        'message' => $isCompleteCorrect
            ? '정답입니다! 두 해를 모두 찾았습니다.'
            : ($isCorrect
                ? '부분 정답입니다. 다른 해도 찾아보세요.'
                : '틀렸습니다. 다시 시도해보세요.'),
        'solutions' => [
            'left' => $solutionLeft,
            'right' => $solutionRight
        ]
    ]);

} catch (Exception $e) {
    error_log("Error submitting answer: " . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Failed to submit answer'
    ], 500);
}
