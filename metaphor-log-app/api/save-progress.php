<?php
/**
 * Save Progress API
 * Saves student progress and answers
 */

require_once 'db.php';

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    exit;
}

try {
    $db = getDB();

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $requiredFields = ['moodle_user_id', 'problem_id', 'submitted_answer'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    $moodleUserId = intval($input['moodle_user_id']);
    $problemId = intval($input['problem_id']);
    $submittedAnswer = floatval($input['submitted_answer']);
    $timeSpent = isset($input['time_spent']) ? intval($input['time_spent']) : 0;
    $metaphorInteractions = isset($input['metaphor_interactions']) ? json_encode($input['metaphor_interactions']) : '{}';

    // Get correct answer from problem
    $stmt = $db->prepare("SELECT answer, metaphor_type FROM log_problems WHERE id = ?");
    $stmt->execute([$problemId]);
    $problem = $stmt->fetch();

    if (!$problem) {
        throw new Exception('Problem not found');
    }

    $correctAnswer = floatval($problem['answer']);
    $isCorrect = abs($submittedAnswer - $correctAnswer) < 0.01; // Allow small floating point differences

    // Check if student has attempted this problem before
    $stmt = $db->prepare("SELECT id, attempt_count FROM student_progress WHERE moodle_user_id = ? AND problem_id = ?");
    $stmt->execute([$moodleUserId, $problemId]);
    $existingProgress = $stmt->fetch();

    if ($existingProgress) {
        // Update existing progress
        $newAttemptCount = $existingProgress['attempt_count'] + 1;
        $stmt = $db->prepare("
            UPDATE student_progress
            SET attempt_count = ?,
                is_correct = ?,
                time_spent = time_spent + ?,
                metaphor_interactions = ?,
                submitted_answer = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $newAttemptCount,
            $isCorrect ? 1 : 0,
            $timeSpent,
            $metaphorInteractions,
            $submittedAnswer,
            $existingProgress['id']
        ]);
        $progressId = $existingProgress['id'];
    } else {
        // Insert new progress
        $stmt = $db->prepare("
            INSERT INTO student_progress
            (moodle_user_id, problem_id, attempt_count, is_correct, time_spent, metaphor_interactions, submitted_answer)
            VALUES (?, ?, 1, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $moodleUserId,
            $problemId,
            $isCorrect ? 1 : 0,
            $timeSpent,
            $metaphorInteractions,
            $submittedAnswer
        ]);
        $progressId = $db->lastInsertId();
    }

    // Update metaphor preferences
    if ($isCorrect) {
        updateMetaphorPreferences($db, $moodleUserId, $problem['metaphor_type']);
    }

    echo json_encode([
        'success' => true,
        'progress_id' => $progressId,
        'is_correct' => $isCorrect,
        'correct_answer' => $correctAnswer,
        'feedback' => generateFeedback($isCorrect, $correctAnswer, $submittedAnswer)
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Update metaphor preferences based on success
 */
function updateMetaphorPreferences($db, $moodleUserId, $metaphorType) {
    // Check if preference exists
    $stmt = $db->prepare("
        SELECT id, success_rate, usage_count
        FROM metaphor_preferences
        WHERE moodle_user_id = ? AND metaphor_type = ?
    ");
    $stmt->execute([$moodleUserId, $metaphorType]);
    $pref = $stmt->fetch();

    if ($pref) {
        // Calculate new success rate
        $totalSuccesses = ($pref['success_rate'] / 100) * $pref['usage_count'] + 1;
        $newUsageCount = $pref['usage_count'] + 1;
        $newSuccessRate = ($totalSuccesses / $newUsageCount) * 100;

        $stmt = $db->prepare("
            UPDATE metaphor_preferences
            SET success_rate = ?,
                usage_count = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$newSuccessRate, $newUsageCount, $pref['id']]);
    } else {
        // Create new preference
        $stmt = $db->prepare("
            INSERT INTO metaphor_preferences
            (moodle_user_id, metaphor_type, success_rate, usage_count)
            VALUES (?, ?, 100.00, 1)
        ");
        $stmt->execute([$moodleUserId, $metaphorType]);
    }
}

/**
 * Generate feedback message in Korean
 */
function generateFeedback($isCorrect, $correctAnswer, $submittedAnswer) {
    if ($isCorrect) {
        return '정답입니다! 로그의 개념을 잘 이해하셨네요.';
    } else {
        return sprintf(
            '틀렸습니다. 정답은 %s입니다. 다시 한번 시각화를 통해 확인해보세요.',
            $correctAnswer
        );
    }
}
