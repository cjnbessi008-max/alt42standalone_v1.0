<?php
/**
 * Student Progress API
 * Handles tracking student reading behavior and condition checks
 */

require_once __DIR__ . '/../config/database.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;
        case 'POST':
            handlePost($db);
            break;
        case 'PUT':
            handleUpdate($db);
            break;
        default:
            errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    error_log("Student Progress API Error: " . $e->getMessage());
    errorResponse('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * GET - Get student progress
 */
function handleGet($db) {
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    $problemId = isset($_GET['problem_id']) ? intval($_GET['problem_id']) : null;

    if (!$studentId) {
        errorResponse('Student ID is required');
    }

    if ($problemId) {
        // Get progress for specific problem
        $progress = getProgress($db, $studentId, $problemId);
        if (!$progress) {
            // Initialize progress if not exists
            $progress = initializeProgress($db, $studentId, $problemId);
        }

        // Get condition check details
        $progress['condition_checks'] = getConditionChecks($db, $studentId, $problemId);
        $progress['reading_sessions'] = getReadingSessions($db, $studentId, $problemId);

        successResponse($progress);
    } else {
        // Get all progress for student
        $allProgress = getAllProgress($db, $studentId);
        successResponse($allProgress);
    }
}

/**
 * POST - Start problem (initialize progress)
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['student_id']) || empty($input['problem_id'])) {
        errorResponse('Student ID and Problem ID are required');
    }

    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);

    // Check if progress already exists
    $existing = getProgress($db, $studentId, $problemId);

    if ($existing) {
        // Update started_at if status is not_started
        if ($existing['status'] === 'not_started') {
            $db->query(
                "UPDATE student_progress SET status = 'reading', started_at = NOW() WHERE id = ?",
                [$existing['id']]
            );
        }

        // Start new reading session
        startReadingSession($db, $studentId, $problemId);

        $progress = getProgress($db, $studentId, $problemId);
        successResponse($progress, 'Progress updated');
    } else {
        // Create new progress record
        $progress = initializeProgress($db, $studentId, $problemId);
        startReadingSession($db, $studentId, $problemId);

        successResponse($progress, 'Progress initialized');
    }
}

/**
 * PUT - Update progress (condition checks, reading time, etc.)
 */
function handleUpdate($db) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['student_id']) || empty($input['problem_id'])) {
        errorResponse('Student ID and Problem ID are required');
    }

    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);
    $action = $input['action'] ?? '';

    $db->beginTransaction();

    try {
        switch ($action) {
            case 'check_condition':
                handleCheckCondition($db, $input);
                break;

            case 'update_reading_time':
                handleUpdateReadingTime($db, $input);
                break;

            case 'end_session':
                handleEndSession($db, $input);
                break;

            case 'submit':
                handleSubmit($db, $input);
                break;

            default:
                errorResponse('Invalid action');
        }

        $db->commit();

        $progress = getProgress($db, $studentId, $problemId);
        $progress['condition_checks'] = getConditionChecks($db, $studentId, $problemId);

        successResponse($progress, 'Progress updated successfully');

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
}

/**
 * Handle condition check
 */
function handleCheckCondition($db, $input) {
    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);
    $conditionId = intval($input['condition_id']);
    $timeToCheck = isset($input['time_to_check']) ? intval($input['time_to_check']) : null;

    // Check if already checked
    $existing = $db->fetchOne(
        "SELECT id FROM condition_checks WHERE student_id = ? AND condition_id = ?",
        [$studentId, $conditionId]
    );

    if (!$existing) {
        $sql = "INSERT INTO condition_checks (student_id, problem_id, condition_id, time_to_check)
                VALUES (?, ?, ?, ?)";
        $db->query($sql, [$studentId, $problemId, $conditionId, $timeToCheck]);

        // Check if all critical conditions are checked
        updateProgressStatus($db, $studentId, $problemId);
    }
}

/**
 * Handle reading time update
 */
function handleUpdateReadingTime($db, $input) {
    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);
    $additionalTime = isset($input['additional_time']) ? intval($input['additional_time']) : 0;

    $sql = "UPDATE student_progress
            SET total_reading_time = total_reading_time + ?
            WHERE student_id = ? AND problem_id = ?";

    $db->query($sql, [$additionalTime, $studentId, $problemId]);
}

/**
 * Handle session end
 */
function handleEndSession($db, $input) {
    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);
    $sessionDuration = isset($input['session_duration']) ? intval($input['session_duration']) : 0;
    $scrollEvents = isset($input['scroll_events']) ? intval($input['scroll_events']) : 0;
    $mouseMovements = isset($input['mouse_movements']) ? intval($input['mouse_movements']) : 0;
    $focusLostCount = isset($input['focus_lost_count']) ? intval($input['focus_lost_count']) : 0;

    // End the current reading session
    $sql = "UPDATE student_reading_sessions
            SET session_end = NOW(),
                duration_seconds = ?,
                scroll_events = ?,
                mouse_movements = ?,
                focus_lost_count = ?
            WHERE student_id = ? AND problem_id = ?
            AND session_end IS NULL
            ORDER BY session_start DESC
            LIMIT 1";

    $db->query($sql, [$sessionDuration, $scrollEvents, $mouseMovements, $focusLostCount, $studentId, $problemId]);

    // Update total reading time
    handleUpdateReadingTime($db, ['student_id' => $studentId, 'problem_id' => $problemId, 'additional_time' => $sessionDuration]);
}

/**
 * Handle problem submission
 */
function handleSubmit($db, $input) {
    $studentId = intval($input['student_id']);
    $problemId = intval($input['problem_id']);

    // Verify all critical conditions are checked
    $problem = $db->fetchOne("SELECT * FROM problems WHERE id = ?", [$problemId]);

    if ($problem['require_all_conditions']) {
        $totalCritical = $db->fetchOne(
            "SELECT COUNT(*) as count FROM conditions WHERE problem_id = ? AND is_critical = 1",
            [$problemId]
        )['count'];

        $checkedCritical = $db->fetchOne(
            "SELECT COUNT(*) as count FROM condition_checks cc
             JOIN conditions c ON cc.condition_id = c.id
             WHERE cc.student_id = ? AND cc.problem_id = ? AND c.is_critical = 1",
            [$studentId, $problemId]
        )['count'];

        if ($checkedCritical < $totalCritical) {
            throw new Exception('All critical conditions must be checked before submission');
        }
    }

    // Check minimum reading time
    $progress = getProgress($db, $studentId, $problemId);
    if ($progress['total_reading_time'] < $problem['min_reading_time']) {
        throw new Exception('Minimum reading time not met');
    }

    // Update progress
    $sql = "UPDATE student_progress
            SET status = 'submitted',
                first_submission_at = COALESCE(first_submission_at, NOW()),
                submission_attempts = submission_attempts + 1
            WHERE student_id = ? AND problem_id = ?";

    $db->query($sql, [$studentId, $problemId]);
}

/**
 * Initialize progress for a student-problem pair
 */
function initializeProgress($db, $studentId, $problemId) {
    $sql = "INSERT INTO student_progress (student_id, problem_id, status, started_at)
            VALUES (?, ?, 'not_started', NOW())";

    $db->query($sql, [$studentId, $problemId]);

    return getProgress($db, $studentId, $problemId);
}

/**
 * Start a new reading session
 */
function startReadingSession($db, $studentId, $problemId) {
    $sql = "INSERT INTO student_reading_sessions (student_id, problem_id)
            VALUES (?, ?)";

    $db->query($sql, [$studentId, $problemId]);
}

/**
 * Get progress for student-problem
 */
function getProgress($db, $studentId, $problemId) {
    $sql = "SELECT * FROM student_progress
            WHERE student_id = ? AND problem_id = ?";

    return $db->fetchOne($sql, [$studentId, $problemId]);
}

/**
 * Get all progress for a student
 */
function getAllProgress($db, $studentId) {
    $sql = "SELECT sp.*, p.title, p.subject, p.difficulty_level
            FROM student_progress sp
            JOIN problems p ON sp.problem_id = p.id
            WHERE sp.student_id = ?
            ORDER BY sp.updated_at DESC";

    return $db->fetchAll($sql, [$studentId]);
}

/**
 * Get condition checks
 */
function getConditionChecks($db, $studentId, $problemId) {
    $sql = "SELECT cc.*, c.condition_text, c.is_critical
            FROM condition_checks cc
            JOIN conditions c ON cc.condition_id = c.id
            WHERE cc.student_id = ? AND cc.problem_id = ?
            ORDER BY cc.checked_at ASC";

    return $db->fetchAll($sql, [$studentId, $problemId]);
}

/**
 * Get reading sessions
 */
function getReadingSessions($db, $studentId, $problemId) {
    $sql = "SELECT * FROM student_reading_sessions
            WHERE student_id = ? AND problem_id = ?
            ORDER BY session_start DESC";

    return $db->fetchAll($sql, [$studentId, $problemId]);
}

/**
 * Update progress status based on condition checks
 */
function updateProgressStatus($db, $studentId, $problemId) {
    // Get total critical conditions
    $totalCritical = $db->fetchOne(
        "SELECT COUNT(*) as count FROM conditions WHERE problem_id = ? AND is_critical = 1",
        [$problemId]
    )['count'];

    // Get checked critical conditions
    $checkedCritical = $db->fetchOne(
        "SELECT COUNT(*) as count FROM condition_checks cc
         JOIN conditions c ON cc.condition_id = c.id
         WHERE cc.student_id = ? AND cc.problem_id = ? AND c.is_critical = 1",
        [$studentId, $problemId]
    )['count'];

    // Update status if all critical conditions checked
    if ($totalCritical > 0 && $checkedCritical >= $totalCritical) {
        $sql = "UPDATE student_progress
                SET status = 'conditions_checked'
                WHERE student_id = ? AND problem_id = ? AND status = 'reading'";

        $db->query($sql, [$studentId, $problemId]);
    }
}
