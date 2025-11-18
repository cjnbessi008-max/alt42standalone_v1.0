<?php
/**
 * Save Final Results
 * Completes the session and syncs grade with Moodle
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
    $moodleUserId = $_SESSION[SESSION_PREFIX . 'moodle_user_id'];
    $courseId = $_SESSION[SESSION_PREFIX . 'course_id'];
    $cmId = $_SESSION[SESSION_PREFIX . 'cm_id'];

    // Validate required fields
    $requiredFields = ['totalProblems', 'completedProblems', 'score', 'answers'];

    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            sendJSON([
                'success' => false,
                'error' => "Missing required field: $field"
            ], 400);
        }
    }

    $db = getDB();
    $db->beginTransaction();

    // Complete session using stored procedure
    $stmt = $db->prepare("CALL sp_complete_session(:session_id, :total_score)");
    $stmt->execute([
        'session_id' => $sessionId,
        'total_score' => $input['score']
    ]);

    // Calculate grade (0-100)
    $maxScore = $input['totalProblems'] * POINTS_CORRECT;
    $gradePercentage = ($input['score'] / $maxScore) * 100;
    $gradePercentage = max(0, min(100, round($gradePercentage, 2)));

    // Sync with Moodle gradebook
    $gradeItemId = null;
    $gradeSynced = false;

    if (file_exists(MOODLE_REQUIRE)) {
        require_once(MOODLE_REQUIRE);
        require_once($CFG->libdir . '/gradelib.php');

        // Get grade item
        $gradeItem = grade_item::fetch([
            'courseid' => $courseId,
            'itemtype' => 'mod',
            'itemmodule' => 'colorunion',
            'iteminstance' => $cmId
        ]);

        if ($gradeItem) {
            $gradeItemId = $gradeItem->id;

            // Update grade
            $gradeItem->update_final_grade(
                $moodleUserId,
                $gradePercentage,
                'colorunion',
                false,
                FORMAT_PLAIN,
                null,
                time()
            );

            $gradeSynced = true;

            // Update completion status
            $completion = new completion_info(get_course($courseId));
            if ($completion->is_enabled()) {
                $cm = get_coursemodule_from_id('colorunion', $cmId);
                $completion->update_state($cm, COMPLETION_COMPLETE, $moodleUserId);
            }
        }
    }

    // Save grade sync record
    $stmt = $db->prepare("
        INSERT INTO cu_grade_sync (
            user_id, session_id, moodle_grade_item_id,
            grade, grade_max, sync_status, error_message
        ) VALUES (
            :user_id, :session_id, :grade_item_id,
            :grade, :grade_max, :sync_status, :error_message
        )
    ");

    $stmt->execute([
        'user_id' => $userId,
        'session_id' => $sessionId,
        'grade_item_id' => $gradeItemId,
        'grade' => $gradePercentage,
        'grade_max' => 100,
        'sync_status' => $gradeSynced ? 'synced' : 'failed',
        'error_message' => $gradeSynced ? null : 'Grade item not found'
    ]);

    $db->commit();

    // Get performance statistics
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
            ROUND(AVG(time_spent_seconds), 0) as avg_time,
            SUM(points_earned) as total_points
        FROM cu_attempts a
        JOIN cu_problems p ON a.problem_id = p.id
        WHERE p.session_id = :session_id
    ");
    $stmt->execute(['session_id' => $sessionId]);
    $stats = $stmt->fetch();

    // Get user's overall progress
    $stmt = $db->prepare("
        SELECT * FROM cu_progress
        WHERE user_id = :user_id AND course_id = :course_id
    ");
    $stmt->execute([
        'user_id' => $userId,
        'course_id' => $courseId
    ]);
    $progress = $stmt->fetch();

    // Log completion event
    logEvent($userId, $sessionId, 'session_completed', [
        'total_problems' => $input['totalProblems'],
        'completed_problems' => $input['completedProblems'],
        'score' => $input['score'],
        'grade' => $gradePercentage,
        'grade_synced' => $gradeSynced
    ]);

    // Clear session
    unset($_SESSION[SESSION_PREFIX . 'session_id']);

    sendJSON([
        'success' => true,
        'sessionId' => $sessionId,
        'finalScore' => $input['score'],
        'grade' => $gradePercentage,
        'gradeSynced' => $gradeSynced,
        'statistics' => [
            'totalAttempts' => (int)$stats['total_attempts'],
            'correctAttempts' => (int)$stats['correct_attempts'],
            'accuracy' => $stats['total_attempts'] > 0
                ? round(($stats['correct_attempts'] / $stats['total_attempts']) * 100, 2)
                : 0,
            'averageTime' => (int)$stats['avg_time'],
            'totalPoints' => (int)$stats['total_points']
        ],
        'progress' => [
            'totalSessions' => (int)$progress['total_sessions'],
            'totalProblemsAttempted' => (int)$progress['total_problems_attempted'],
            'totalProblemsCorrect' => (int)$progress['total_problems_correct'],
            'bestScore' => (int)$progress['best_score'],
            'averageScore' => (float)$progress['average_score']
        ],
        'message' => '모든 문제를 완료했습니다! 수고하셨습니다.'
    ]);

} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Database error in save-final-results.php: ' . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'Database error occurred'
    ], 500);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Error in save-final-results.php: ' . $e->getMessage());
    sendJSON([
        'success' => false,
        'error' => 'An error occurred while saving final results'
    ], 500);
}
