<?php
/**
 * Record Student Attempt API
 * Saves student answers to database
 */

require_once 'config.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError('Invalid JSON input', 400);
}

// Validate required fields
$requiredFields = ['problem_id', 'student_answer', 'is_correct'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        sendError("Missing required field: $field", 400);
    }
}

try {
    $db = getDBConnection();

    // Get current user ID
    $studentId = getMoodleUserId();

    // Check if problem exists
    $checkSql = "SELECT id FROM " . TABLE_PROBLEMS . " WHERE id = :problem_id LIMIT 1";
    $checkStmt = $db->prepare($checkSql);
    $checkStmt->bindParam(':problem_id', $input['problem_id'], PDO::PARAM_INT);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        sendError('Problem not found', 404);
    }

    // Count previous attempts for this problem by this student
    $countSql = "SELECT COUNT(*) as count FROM " . TABLE_ATTEMPTS . "
                 WHERE problem_id = :problem_id AND student_id = :student_id";
    $countStmt = $db->prepare($countSql);
    $countStmt->bindParam(':problem_id', $input['problem_id'], PDO::PARAM_INT);
    $countStmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $countStmt->execute();
    $attemptCount = $countStmt->fetch()['count'] + 1;

    // Insert attempt record
    $sql = "INSERT INTO " . TABLE_ATTEMPTS . "
            (problem_id, student_id, student_answer, is_correct, time_spent, attempt_count)
            VALUES
            (:problem_id, :student_id, :student_answer, :is_correct, :time_spent, :attempt_count)";

    $stmt = $db->prepare($sql);
    $stmt->bindParam(':problem_id', $input['problem_id'], PDO::PARAM_INT);
    $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt->bindParam(':student_answer', $input['student_answer'], PDO::PARAM_STR);
    $stmt->bindParam(':is_correct', $input['is_correct'], PDO::PARAM_INT);

    $timeSpent = $input['time_spent'] ?? null;
    $stmt->bindParam(':time_spent', $timeSpent, PDO::PARAM_INT);
    $stmt->bindParam(':attempt_count', $attemptCount, PDO::PARAM_INT);

    $stmt->execute();

    // Get inserted ID
    $attemptId = $db->lastInsertId();

    // Send success response
    sendJSON([
        'success' => true,
        'attempt_id' => (int)$attemptId,
        'attempt_count' => $attemptCount,
        'message' => 'Attempt recorded successfully'
    ], 201);

} catch (Exception $e) {
    error_log("Error in record-attempt.php: " . $e->getMessage());
    sendError('Failed to record attempt: ' . $e->getMessage(), 500);
}
