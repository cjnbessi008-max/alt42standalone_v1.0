<?php
/**
 * API Handler for Derivative Flip Cards
 * Moodle LMS Integration
 *
 * Handles all API requests from the frontend application
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/recommendation-engine.php';

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : null;

// Handle POST requests (JSON body)
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : $action;
}

try {
    switch ($action) {
        case 'getStudent':
            handleGetStudent();
            break;

        case 'getCards':
            handleGetCards();
            break;

        case 'trackEvent':
            handleTrackEvent();
            break;

        case 'getProgress':
            handleGetProgress();
            break;

        case 'updateProgress':
            handleUpdateProgress();
            break;

        case 'getRecommendation':
            handleGetRecommendation();
            break;

        case 'getLearningPath':
            handleGetLearningPath();
            break;

        default:
            sendError('Invalid action', 400);
            break;
    }

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * Get student information from Moodle
 */
function handleGetStudent() {
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($studentId === 0) {
        sendError('Student ID is required', 400);
        return;
    }

    try {
        // Query Moodle user table
        $sql = "SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    u.email
                FROM " . DB_PREFIX . "user u
                WHERE u.id = :student_id
                AND u.deleted = 0";

        $student = fetchOne($sql, ['student_id' => $studentId]);

        if ($student) {
            // Get student progress if course_id provided
            $progress = 0;
            if ($courseId > 0) {
                $progress = getStudentProgress($studentId, $courseId);
            }

            sendSuccess([
                'student' => [
                    'id' => $student['id'],
                    'name' => trim($student['firstname'] . ' ' . $student['lastname']),
                    'username' => $student['username'],
                    'email' => $student['email'],
                    'progress' => $progress
                ]
            ]);
        } else {
            sendError('Student not found', 404);
        }

    } catch (Exception $e) {
        error_log('Error in handleGetStudent: ' . $e->getMessage());
        sendError('Failed to retrieve student data', 500);
    }
}

/**
 * Get all derivative cards
 */
function handleGetCards() {
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    try {
        // Check if custom cards table exists
        $tableExists = checkTableExists(TABLE_DERIVATIVE_CARDS);

        if ($tableExists) {
            // Get cards from database
            $sql = "SELECT
                        id,
                        rule_name,
                        formula,
                        example,
                        description,
                        display_order
                    FROM " . TABLE_DERIVATIVE_CARDS . "
                    WHERE active = 1";

            if ($courseId > 0) {
                $sql .= " AND (course_id = :course_id OR course_id IS NULL)";
                $cards = fetchAll($sql, ['course_id' => $courseId]);
            } else {
                $sql .= " ORDER BY display_order ASC";
                $cards = fetchAll($sql);
            }

            sendSuccess(['cards' => $cards]);

        } else {
            // Return default cards (will be handled by frontend)
            sendSuccess(['cards' => []]);
        }

    } catch (Exception $e) {
        error_log('Error in handleGetCards: ' . $e->getMessage());
        sendSuccess(['cards' => []]); // Return empty array, frontend will use defaults
    }
}

/**
 * Track student events (card views, flips, etc.)
 */
function handleTrackEvent() {
    $input = json_decode(file_get_contents('php://input'), true);

    $studentId = isset($input['student_id']) ? intval($input['student_id']) : 0;
    $cardId = isset($input['card_id']) ? intval($input['card_id']) : 0;
    $eventType = isset($input['event_type']) ? $input['event_type'] : '';
    $timestamp = isset($input['timestamp']) ? $input['timestamp'] : date('Y-m-d H:i:s');

    if ($studentId === 0 || $cardId === 0 || empty($eventType)) {
        sendError('Missing required parameters', 400);
        return;
    }

    try {
        // Check if events table exists
        $tableExists = checkTableExists(TABLE_CARD_EVENTS);

        if ($tableExists) {
            $sql = "INSERT INTO " . TABLE_CARD_EVENTS . "
                    (student_id, card_id, event_type, event_timestamp, created_at)
                    VALUES (:student_id, :card_id, :event_type, :event_timestamp, NOW())";

            insert($sql, [
                'student_id' => $studentId,
                'card_id' => $cardId,
                'event_type' => $eventType,
                'event_timestamp' => $timestamp
            ]);

            // Update student progress
            updateStudentProgressRecord($studentId, $cardId);

            sendSuccess(['message' => 'Event tracked successfully']);
        } else {
            // Table doesn't exist, just return success
            sendSuccess(['message' => 'Event logged (table not initialized)']);
        }

    } catch (Exception $e) {
        error_log('Error in handleTrackEvent: ' . $e->getMessage());
        sendError('Failed to track event', 500);
    }
}

/**
 * Get student progress
 */
function handleGetProgress() {
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($studentId === 0) {
        sendError('Student ID is required', 400);
        return;
    }

    $progress = getStudentProgress($studentId, $courseId);

    sendSuccess([
        'progress' => $progress,
        'student_id' => $studentId,
        'course_id' => $courseId
    ]);
}

/**
 * Update student progress
 */
function handleUpdateProgress() {
    $input = json_decode(file_get_contents('php://input'), true);

    $studentId = isset($input['student_id']) ? intval($input['student_id']) : 0;
    $courseId = isset($input['course_id']) ? intval($input['course_id']) : 0;
    $progress = isset($input['progress']) ? floatval($input['progress']) : 0;

    if ($studentId === 0) {
        sendError('Student ID is required', 400);
        return;
    }

    try {
        $tableExists = checkTableExists(TABLE_STUDENT_PROGRESS);

        if ($tableExists) {
            // Check if record exists
            $sql = "SELECT id FROM " . TABLE_STUDENT_PROGRESS . "
                    WHERE student_id = :student_id
                    AND course_id = :course_id";

            $existing = fetchOne($sql, [
                'student_id' => $studentId,
                'course_id' => $courseId
            ]);

            if ($existing) {
                // Update existing record
                $sql = "UPDATE " . TABLE_STUDENT_PROGRESS . "
                        SET progress = :progress,
                            updated_at = NOW()
                        WHERE student_id = :student_id
                        AND course_id = :course_id";

                executeQuery($sql, [
                    'progress' => $progress,
                    'student_id' => $studentId,
                    'course_id' => $courseId
                ]);
            } else {
                // Insert new record
                $sql = "INSERT INTO " . TABLE_STUDENT_PROGRESS . "
                        (student_id, course_id, progress, created_at, updated_at)
                        VALUES (:student_id, :course_id, :progress, NOW(), NOW())";

                insert($sql, [
                    'student_id' => $studentId,
                    'course_id' => $courseId,
                    'progress' => $progress
                ]);
            }

            sendSuccess(['message' => 'Progress updated successfully']);
        } else {
            sendSuccess(['message' => 'Progress logged (table not initialized)']);
        }

    } catch (Exception $e) {
        error_log('Error in handleUpdateProgress: ' . $e->getMessage());
        sendError('Failed to update progress', 500);
    }
}

/**
 * Get personalized card recommendation
 */
function handleGetRecommendation() {
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

    if ($studentId === 0) {
        sendError('Student ID is required', 400);
        return;
    }

    try {
        $recommendation = getRecommendedCard($studentId, $courseId);
        sendSuccess($recommendation);

    } catch (Exception $e) {
        error_log('Error in handleGetRecommendation: ' . $e->getMessage());
        sendError('Failed to get recommendation', 500);
    }
}

/**
 * Get personalized learning path
 */
function handleGetLearningPath() {
    $studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
    $courseId = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;
    $count = isset($_GET['count']) ? intval($_GET['count']) : 5;

    if ($studentId === 0) {
        sendError('Student ID is required', 400);
        return;
    }

    try {
        $path = getLearningPath($studentId, $courseId, $count);
        sendSuccess($path);

    } catch (Exception $e) {
        error_log('Error in handleGetLearningPath: ' . $e->getMessage());
        sendError('Failed to get learning path', 500);
    }
}

/**
 * Helper Functions
 */

/**
 * Get student progress percentage
 */
function getStudentProgress($studentId, $courseId) {
    try {
        $tableExists = checkTableExists(TABLE_STUDENT_PROGRESS);

        if (!$tableExists) {
            return 0;
        }

        $sql = "SELECT progress
                FROM " . TABLE_STUDENT_PROGRESS . "
                WHERE student_id = :student_id
                AND course_id = :course_id";

        $result = fetchOne($sql, [
            'student_id' => $studentId,
            'course_id' => $courseId
        ]);

        return $result ? floatval($result['progress']) : 0;

    } catch (Exception $e) {
        error_log('Error in getStudentProgress: ' . $e->getMessage());
        return 0;
    }
}

/**
 * Update student progress based on card interactions
 */
function updateStudentProgressRecord($studentId, $cardId) {
    try {
        // Calculate progress based on unique cards viewed
        $sql = "SELECT COUNT(DISTINCT card_id) as viewed_cards
                FROM " . TABLE_CARD_EVENTS . "
                WHERE student_id = :student_id
                AND event_type = 'flip'";

        $result = fetchOne($sql, ['student_id' => $studentId]);
        $viewedCards = $result ? intval($result['viewed_cards']) : 0;

        // Assume 12 cards total (can be dynamic)
        $totalCards = 12;
        $progress = ($viewedCards / $totalCards) * 100;

        // Update progress
        $tableExists = checkTableExists(TABLE_STUDENT_PROGRESS);
        if ($tableExists) {
            $sql = "INSERT INTO " . TABLE_STUDENT_PROGRESS . "
                    (student_id, course_id, progress, created_at, updated_at)
                    VALUES (:student_id, 0, :progress, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                    progress = :progress,
                    updated_at = NOW()";

            executeQuery($sql, [
                'student_id' => $studentId,
                'progress' => $progress
            ]);
        }

    } catch (Exception $e) {
        error_log('Error in updateStudentProgressRecord: ' . $e->getMessage());
    }
}

/**
 * Check if a table exists in the database
 */
function checkTableExists($tableName) {
    try {
        $sql = "SHOW TABLES LIKE :table_name";
        $result = fetchOne($sql, ['table_name' => $tableName]);
        return $result !== false;
    } catch (Exception $e) {
        error_log('Error checking table existence: ' . $e->getMessage());
        return false;
    }
}

/**
 * Send success response
 */
function sendSuccess($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit();
}

/**
 * Send error response
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code
    ]);
    exit();
}
?>
