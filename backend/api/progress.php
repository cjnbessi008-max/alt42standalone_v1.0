<?php
/**
 * Progress API
 * 학생 진행 상황 관리 API
 */

require_once __DIR__ . '/../config/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDbConnection();

    switch ($method) {
        case 'GET':
            // Get student progress
            $problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;
            $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;

            if (!$problemId || !$studentId) {
                sendError('problem_id and student_id required', 400);
            }

            getProgress($db, $problemId, $studentId);
            break;

        case 'POST':
            // Update progress
            $data = getRequestBody();
            updateProgress($db, $data);
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Progress API Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * Get student progress for a problem
 */
function getProgress($db, $problemId, $studentId) {
    $stmt = $db->prepare("
        SELECT * FROM student_progress
        WHERE problem_id = :problem_id AND student_id = :student_id
    ");

    $stmt->execute([
        ':problem_id' => $problemId,
        ':student_id' => $studentId
    ]);

    $progress = $stmt->fetch();

    if (!$progress) {
        // No progress yet, return default
        sendSuccess([
            'problemId' => $problemId,
            'studentId' => $studentId,
            'currentStep' => 0,
            'totalSteps' => 0,
            'completed' => false,
            'timeSpent' => 0,
            'attempts' => 0
        ]);
    }

    sendSuccess([
        'problemId' => $progress['problem_id'],
        'studentId' => $progress['student_id'],
        'currentStep' => $progress['current_step'],
        'totalSteps' => $progress['total_steps'],
        'completed' => (bool)$progress['completed'],
        'timeSpent' => $progress['time_spent'],
        'attempts' => $progress['attempts']
    ]);
}

/**
 * Update student progress
 */
function updateProgress($db, $data) {
    $required = ['problemId', 'studentId', 'currentStep'];
    $missing = validateRequiredFields($data, $required);

    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
    }

    // Check if progress exists
    $stmt = $db->prepare("
        SELECT id FROM student_progress
        WHERE problem_id = :problem_id AND student_id = :student_id
    ");

    $stmt->execute([
        ':problem_id' => $data['problemId'],
        ':student_id' => $data['studentId']
    ]);

    $exists = $stmt->fetch();

    if ($exists) {
        // Update existing progress
        $sql = "UPDATE student_progress SET
                current_step = :current_step,
                completed = :completed,
                time_spent = time_spent + :time_spent,
                attempts = attempts + 1,
                updated_at = NOW()
                WHERE problem_id = :problem_id AND student_id = :student_id";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':problem_id' => $data['problemId'],
            ':student_id' => $data['studentId'],
            ':current_step' => $data['currentStep'],
            ':completed' => isset($data['completed']) ? (int)$data['completed'] : 0,
            ':time_spent' => $data['timeSpent'] ?? 0
        ]);
    } else {
        // Insert new progress
        $sql = "INSERT INTO student_progress
                (problem_id, student_id, current_step, total_steps, completed, time_spent, attempts, created_at, updated_at)
                VALUES (:problem_id, :student_id, :current_step, :total_steps, :completed, :time_spent, 1, NOW(), NOW())";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':problem_id' => $data['problemId'],
            ':student_id' => $data['studentId'],
            ':current_step' => $data['currentStep'],
            ':total_steps' => $data['totalSteps'] ?? 0,
            ':completed' => isset($data['completed']) ? (int)$data['completed'] : 0,
            ':time_spent' => $data['timeSpent'] ?? 0
        ]);
    }

    sendSuccess(null, 'Progress updated successfully');
}
