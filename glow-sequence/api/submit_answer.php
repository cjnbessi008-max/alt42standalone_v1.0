<?php
/**
 * Submit Answer API
 * Handles student answer submissions and scoring
 */

require_once '../config/database.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    errorResponse('Invalid JSON input');
}

// Validate required fields
$required = ['student_id', 'sequence_id', 'answer'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        errorResponse("Missing required field: $field");
    }
}

$student_id = intval($input['student_id']);
$sequence_id = intval($input['sequence_id']);
$answer = sanitizeInput($input['answer']);
$time_spent = isset($input['time_spent']) ? intval($input['time_spent']) : 0;
$hint_used = isset($input['hint_used']) ? boolval($input['hint_used']) : false;

try {
    $connection = getDbConnection();
    $connection->begin_transaction();

    // Get the sequence and correct answer
    $seqSql = "SELECT correct_answer, max_attempts, difficulty_level FROM glow_sequences WHERE id = ? AND is_active = TRUE";
    $seqStmt = $connection->prepare($seqSql);
    $seqStmt->bind_param('i', $sequence_id);
    $seqStmt->execute();
    $seqResult = $seqStmt->get_result();

    if ($seqResult->num_rows === 0) {
        throw new Exception("Sequence not found");
    }

    $sequence = $seqResult->fetch_assoc();
    $seqStmt->close();

    // Check correct answer (normalize comparison)
    $is_correct = (trim(strtolower($answer)) === trim(strtolower($sequence['correct_answer'])));

    // Get current attempt number for this student and sequence
    $attemptSql = "SELECT COUNT(*) as attempt_count FROM glow_attempts WHERE student_id = ? AND sequence_id = ?";
    $attemptStmt = $connection->prepare($attemptSql);
    $attemptStmt->bind_param('ii', $student_id, $sequence_id);
    $attemptStmt->execute();
    $attemptResult = $attemptStmt->get_result();
    $attempt_number = $attemptResult->fetch_assoc()['attempt_count'] + 1;
    $attemptStmt->close();

    // Calculate score based on correctness, attempts, time, and hint usage
    $score = 0;
    if ($is_correct) {
        $base_score = 100;

        // Difficulty multiplier
        $difficulty_multiplier = [
            'easy' => 1.0,
            'medium' => 1.5,
            'hard' => 2.0
        ];
        $multiplier = $difficulty_multiplier[$sequence['difficulty_level']] ?? 1.0;

        // Penalty for multiple attempts (10% per additional attempt)
        $attempt_penalty = max(0, 1 - (($attempt_number - 1) * 0.1));

        // Penalty for hint usage (20% reduction)
        $hint_penalty = $hint_used ? 0.8 : 1.0;

        // Time bonus (if solved quickly, up to 20% bonus)
        $time_bonus = 1.0;
        if ($time_spent > 0 && $time_spent < 30) {
            $time_bonus = 1.2;
        } elseif ($time_spent >= 30 && $time_spent < 45) {
            $time_bonus = 1.1;
        }

        $score = round($base_score * $multiplier * $attempt_penalty * $hint_penalty * $time_bonus);
    }

    // Insert attempt record
    $insertSql = "INSERT INTO glow_attempts (student_id, sequence_id, student_answer, is_correct, attempt_number, time_spent_seconds, hint_used, score_earned)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $insertStmt = $connection->prepare($insertSql);
    $insertStmt->bind_param('iisiiiis', $student_id, $sequence_id, $answer, $is_correct, $attempt_number, $time_spent, $hint_used, $score);

    if (!$insertStmt->execute()) {
        throw new Exception("Failed to insert attempt: " . $insertStmt->error);
    }
    $attempt_id = $insertStmt->insert_id;
    $insertStmt->close();

    // Update or insert progress record
    $status = 'in_progress';
    if ($is_correct) {
        $status = 'completed';
    } elseif ($attempt_number >= $sequence['max_attempts']) {
        $status = 'failed';
    }

    // Calculate mastery level (percentage of correct answers)
    $masterySql = "SELECT
                       COUNT(*) as total,
                       SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                   FROM glow_attempts
                   WHERE student_id = ? AND sequence_id = ?";
    $masteryStmt = $connection->prepare($masterySql);
    $masteryStmt->bind_param('ii', $student_id, $sequence_id);
    $masteryStmt->execute();
    $masteryResult = $masteryStmt->get_result();
    $masteryData = $masteryResult->fetch_assoc();
    $masteryStmt->close();

    $mastery_level = ($masteryData['total'] > 0) ?
        round(($masteryData['correct'] / $masteryData['total']) * 100, 2) : 0;

    // Update progress
    $progressSql = "INSERT INTO glow_progress (student_id, sequence_id, status, best_score, total_attempts, first_attempt_at, completed_at, mastery_level)
                    VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        best_score = GREATEST(best_score, VALUES(best_score)),
                        total_attempts = total_attempts + 1,
                        completed_at = CASE WHEN VALUES(status) = 'completed' THEN NOW() ELSE completed_at END,
                        mastery_level = VALUES(mastery_level)";

    $completed_at = ($status === 'completed') ? date('Y-m-d H:i:s') : null;
    $progressStmt = $connection->prepare($progressSql);
    $progressStmt->bind_param('iisiisD', $student_id, $sequence_id, $status, $score, $attempt_number, $completed_at, $mastery_level);

    if (!$progressStmt->execute()) {
        throw new Exception("Failed to update progress: " . $progressStmt->error);
    }
    $progressStmt->close();

    // Update student total score
    $updateStudentSql = "UPDATE glow_students SET total_score = total_score + ?, total_attempts = total_attempts + 1 WHERE id = ?";
    $updateStudentStmt = $connection->prepare($updateStudentSql);
    $updateStudentStmt->bind_param('ii', $score, $student_id);
    $updateStudentStmt->execute();
    $updateStudentStmt->close();

    $connection->commit();

    // Prepare response
    $response = [
        'attempt_id' => $attempt_id,
        'is_correct' => $is_correct,
        'correct_answer' => $is_correct ? null : $sequence['correct_answer'], // Only show if wrong
        'score_earned' => $score,
        'attempt_number' => $attempt_number,
        'max_attempts' => intval($sequence['max_attempts']),
        'status' => $status,
        'mastery_level' => $mastery_level,
        'can_retry' => ($status === 'in_progress')
    ];

    // Add feedback message
    if ($is_correct) {
        $messages = [
            '정답입니다! 훌륭해요! 🎉',
            '맞았습니다! 잘했어요! ⭐',
            '정확합니다! 계속해서 좋은 성과를 내고 있네요! 👍'
        ];
        $response['feedback'] = $messages[array_rand($messages)];
    } else {
        if ($status === 'failed') {
            $response['feedback'] = '아쉽지만 모든 시도를 사용했습니다. 힌트를 확인하고 다시 도전해보세요!';
        } else {
            $response['feedback'] = '틀렸습니다. 다시 한번 생각해보세요. 힌트가 필요하면 힌트 버튼을 눌러주세요!';
        }
    }

    successResponse($response, 'Answer submitted successfully');

} catch (Exception $e) {
    if (isset($connection)) {
        $connection->rollback();
    }
    error_log("Error in submit_answer.php: " . $e->getMessage());
    errorResponse($e->getMessage(), 500);
}
