<?php
/**
 * Progress API
 * 학습 진행상황 기록 및 조회 API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../utils/db.php';
require_once __DIR__ . '/../moodle/connector.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            handleGetProgress($db);
            break;

        case 'POST':
            handleSubmitProgress($db);
            break;

        default:
            respondError('Method not allowed', 405);
    }

} catch (Exception $e) {
    error_log("Progress API Error: " . $e->getMessage());
    respondError('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * GET: 진행 상황 조회
 */
function handleGetProgress($db) {
    $studentId = $_GET['student_id'] ?? null;
    $problemId = $_GET['problem_id'] ?? null;

    if (!$studentId) {
        respondError('student_id is required', 400);
    }

    if ($problemId) {
        // 특정 문제에 대한 진행 기록
        $progress = $db->fetchAll(
            "SELECT sp.*, p.title as problem_title, p.target_angle
             FROM student_progress sp
             JOIN problems p ON sp.problem_id = p.id
             WHERE sp.student_id = :student_id AND sp.problem_id = :problem_id
             ORDER BY sp.submitted_at DESC",
            ['student_id' => $studentId, 'problem_id' => $problemId]
        );

        respondSuccess([
            'progress' => array_map('formatProgress', $progress),
            'total_attempts' => count($progress)
        ]);
    } else {
        // 전체 진행 상황
        $stats = $db->fetchOne(
            "SELECT * FROM student_statistics WHERE student_id = :student_id",
            ['student_id' => $studentId]
        );

        $recentProgress = $db->fetchAll(
            "SELECT sp.*, p.title as problem_title
             FROM student_progress sp
             JOIN problems p ON sp.problem_id = p.id
             WHERE sp.student_id = :student_id
             ORDER BY sp.submitted_at DESC
             LIMIT 10",
            ['student_id' => $studentId]
        );

        respondSuccess([
            'statistics' => $stats,
            'recent_progress' => array_map('formatProgress', $recentProgress)
        ]);
    }
}

/**
 * POST: 진행 상황 제출
 */
function handleSubmitProgress($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        respondError('Invalid JSON', 400);
    }

    // Validate required fields
    $required = ['student_id', 'problem_id', 'submitted_angle', 'time_spent'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            respondError("Missing required field: $field", 400);
        }
    }

    $studentId = $input['student_id'];
    $problemId = $input['problem_id'];
    $submittedAngle = $input['submitted_angle'];
    $timeSpent = $input['time_spent'];

    // Get problem details
    $problem = $db->fetchOne(
        "SELECT * FROM problems WHERE id = :id AND is_active = TRUE",
        ['id' => $problemId]
    );

    if (!$problem) {
        respondError('Problem not found', 404);
    }

    // Get student details
    $student = $db->fetchOne(
        "SELECT * FROM students WHERE id = :id",
        ['id' => $studentId]
    );

    if (!$student) {
        respondError('Student not found', 404);
    }

    // Calculate current attempt number
    $attempts = $db->fetchOne(
        "SELECT COUNT(*) as count FROM student_progress
         WHERE student_id = :student_id AND problem_id = :problem_id",
        ['student_id' => $studentId, 'problem_id' => $problemId]
    );
    $attemptNumber = $attempts['count'] + 1;

    // Check max attempts
    if ($attemptNumber > $problem['max_attempts']) {
        respondError('Maximum attempts exceeded', 400);
    }

    // Calculate angle error
    $targetAngle = (float)$problem['target_angle'];
    $tolerance = (float)$problem['tolerance'];
    $angleError = abs($submittedAngle - $targetAngle);

    // Determine correctness
    $isCorrect = $angleError <= $tolerance;

    // Calculate score (0-100)
    // Perfect match = 100, error at tolerance = 50, beyond tolerance = 0
    if ($isCorrect) {
        $score = 100 - (($angleError / $tolerance) * 50);
    } else {
        $score = max(0, 50 - (($angleError - $tolerance) / $tolerance) * 50);
    }
    $score = round($score, 2);

    // Calculate light intensity (based on accuracy)
    // Light is brightest when angle is exact
    $maxError = 180; // Maximum possible angle error
    $lightIntensity = max(0, min(100, 100 - ($angleError / $maxError) * 100));
    $lightIntensity = round($lightIntensity, 2);

    // Save progress
    $progressData = [
        'student_id' => $studentId,
        'problem_id' => $problemId,
        'attempt_number' => $attemptNumber,
        'submitted_angle' => $submittedAngle,
        'angle_error' => $angleError,
        'is_correct' => $isCorrect,
        'score' => $score,
        'time_spent' => $timeSpent,
        'light_intensity' => $lightIntensity
    ];

    $progressId = $db->insert('student_progress', $progressData);

    // Sync to Moodle if course is linked
    $syncedToMoodle = false;
    if ($problem['moodle_course_id'] && $student['moodle_user_id']) {
        try {
            $moodle = new MoodleConnector();
            $syncedToMoodle = $moodle->syncProgress(
                $student['moodle_user_id'],
                $problem['moodle_course_id'],
                $problem['moodle_quiz_id'],
                $score,
                $timeSpent
            );

            if ($syncedToMoodle) {
                $db->update(
                    'student_progress',
                    ['synced_to_moodle' => true, 'synced_at' => date('Y-m-d H:i:s')],
                    'id = :id',
                    ['id' => $progressId]
                );
            }
        } catch (Exception $e) {
            error_log("Failed to sync to Moodle: " . $e->getMessage());
        }
    }

    respondSuccess([
        'message' => $isCorrect ? 'Correct answer!' : 'Try again',
        'progress_id' => $progressId,
        'is_correct' => $isCorrect,
        'score' => $score,
        'angle_error' => $angleError,
        'light_intensity' => $lightIntensity,
        'attempt_number' => $attemptNumber,
        'attempts_remaining' => max(0, $problem['max_attempts'] - $attemptNumber),
        'synced_to_moodle' => $syncedToMoodle,
        'feedback' => generateFeedback($angleError, $tolerance, $isCorrect)
    ], 201);
}

/**
 * Generate feedback based on performance
 */
function generateFeedback($angleError, $tolerance, $isCorrect) {
    if ($isCorrect) {
        if ($angleError < $tolerance * 0.3) {
            return '완벽합니다! 매우 정확한 답변입니다.';
        } else if ($angleError < $tolerance * 0.6) {
            return '잘했습니다! 정확한 답변입니다.';
        } else {
            return '정답입니다!';
        }
    } else {
        if ($angleError < $tolerance * 2) {
            return '거의 다 왔습니다! 조금만 더 조정해보세요.';
        } else if ($angleError < $tolerance * 5) {
            return '아직 조금 더 조정이 필요합니다.';
        } else {
            return '각도 차이가 많습니다. 다시 시도해보세요.';
        }
    }
}

/**
 * Format progress data for response
 */
function formatProgress($progress) {
    return [
        'id' => (int)$progress['id'],
        'student_id' => (int)$progress['student_id'],
        'problem_id' => (int)$progress['problem_id'],
        'problem_title' => $progress['problem_title'] ?? null,
        'attempt_number' => (int)$progress['attempt_number'],
        'submitted_angle' => (float)$progress['submitted_angle'],
        'target_angle' => isset($progress['target_angle']) ? (float)$progress['target_angle'] : null,
        'angle_error' => (float)$progress['angle_error'],
        'is_correct' => (bool)$progress['is_correct'],
        'score' => (float)$progress['score'],
        'time_spent' => (int)$progress['time_spent'],
        'light_intensity' => (float)$progress['light_intensity'],
        'submitted_at' => $progress['submitted_at'],
        'synced_to_moodle' => (bool)$progress['synced_to_moodle']
    ];
}

/**
 * Send success response
 */
function respondSuccess($data, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Send error response
 */
function respondError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
