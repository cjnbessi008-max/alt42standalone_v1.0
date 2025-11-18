<?php
/**
 * Problems API Endpoint
 *
 * Handles requests for problem/quiz information
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . CORS_ALLOWED_ORIGINS);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../moodle_connector.php';

$moodle = new MoodleConnector();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet($moodle);
            break;

        case 'POST':
            handlePost($moodle);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function handleGet($moodle) {
    $action = $_GET['action'] ?? 'list';

    switch ($action) {
        case 'get':
            $problemId = $_GET['id'] ?? null;
            if (!$problemId) {
                http_response_code(400);
                echo json_encode(['error' => 'Problem ID required']);
                return;
            }

            $problem = $moodle->getFunctionProblem($problemId);
            if ($problem) {
                echo json_encode([
                    'success' => true,
                    'data' => $problem
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Problem not found']);
            }
            break;

        case 'list':
            $courseId = $_GET['course_id'] ?? 1;
            $problems = $moodle->getCourseFunctionProblems($courseId);
            echo json_encode([
                'success' => true,
                'data' => $problems
            ]);
            break;

        case 'progress':
            $userId = $_GET['user_id'] ?? null;
            $courseId = $_GET['course_id'] ?? 1;

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                return;
            }

            $progress = $moodle->getUserProgress($userId, $courseId);
            echo json_encode([
                'success' => true,
                'data' => $progress
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePost($moodle) {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? null;

    switch ($action) {
        case 'submit_answer':
            $userId = $data['user_id'] ?? null;
            $problemId = $data['problem_id'] ?? null;
            $answer = $data['answer'] ?? null;
            $timeTaken = $data['time_taken'] ?? 0;

            if (!$userId || !$problemId || $answer === null) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                return;
            }

            $success = $moodle->saveUserAnswer($userId, $problemId, $answer, $timeTaken);
            echo json_encode([
                'success' => $success,
                'message' => $success ? 'Answer saved successfully' : 'Failed to save answer'
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

?>
