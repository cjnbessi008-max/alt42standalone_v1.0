<?php
/**
 * REST API Endpoints for Slope Sense
 */

define('SLOPE_SENSE', true);
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/moodle-integration.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$moodle = new MoodleIntegration();
$response = ['success' => false, 'data' => null, 'error' => null];

try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'init':
            // Initialize session and get problems
            $courseId = intval($_GET['course_id'] ?? 1);
            $activityId = intval($_GET['activity_id'] ?? 1);
            $userId = intval($_GET['user_id'] ?? 1);

            $session = $moodle->createSession($userId, $courseId);
            $problems = $moodle->getProblemsForActivity($courseId, $activityId);

            $response['success'] = true;
            $response['data'] = [
                'session' => $session,
                'problems' => $problems,
                'user_id' => $userId
            ];
            break;

        case 'get_problem':
            // Get a specific problem
            $problemId = intval($_GET['problem_id'] ?? 0);

            $db = Database::getInstance();
            $problem = $db->fetch(
                "SELECT * FROM slope_problems WHERE id = :id",
                [':id' => $problemId]
            );

            if ($problem) {
                $response['success'] = true;
                $response['data'] = $problem;
            } else {
                $response['error'] = 'Problem not found';
            }
            break;

        case 'submit_answer':
            // Submit user answer
            $input = json_decode(file_get_contents('php://input'), true);

            $sessionId = intval($input['session_id'] ?? 0);
            $problemId = intval($input['problem_id'] ?? 0);
            $userId = intval($input['user_id'] ?? 0);
            $userAnswer = $input['answer'] ?? null;
            $timeSpent = intval($input['time_spent'] ?? 0);
            $hintsUsed = intval($input['hints_used'] ?? 0);

            if ($userAnswer === null) {
                throw new Exception('Answer is required');
            }

            $result = $moodle->recordAttempt(
                $sessionId,
                $problemId,
                $userId,
                $userAnswer,
                $timeSpent,
                $hintsUsed
            );

            $response['success'] = true;
            $response['data'] = $result;
            break;

        case 'get_progress':
            // Get user progress
            $userId = intval($_GET['user_id'] ?? 0);
            $courseId = intval($_GET['course_id'] ?? 1);

            $progress = $moodle->getUserProgress($userId, $courseId);

            $response['success'] = true;
            $response['data'] = $progress;
            break;

        case 'validate_session':
            // Validate session token
            $token = $_GET['token'] ?? '';

            $session = $moodle->validateSession($token);

            if ($session) {
                $response['success'] = true;
                $response['data'] = $session;
            } else {
                $response['error'] = 'Invalid or expired session';
            }
            break;

        default:
            $response['error'] = 'Invalid action';
            http_response_code(400);
    }

} catch (Exception $e) {
    $response['error'] = DEBUG_MODE ? $e->getMessage() : 'An error occurred';
    http_response_code(500);
}

echo json_encode($response);
