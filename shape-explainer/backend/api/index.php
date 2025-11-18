<?php
/**
 * Shape Explainer API - Main Entry Point
 * PHP 7.1.9 Compatible
 */

// Load configuration
require_once __DIR__ . '/../config/config.example.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/ShapeModel.php';
require_once __DIR__ . '/../models/QuestionModel.php';
require_once __DIR__ . '/../services/MoodleService.php';

// CORS Headers
if (ENABLE_CORS) {
    $allowedOrigins = explode(',', ALLOWED_ORIGINS);
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Set JSON response header
header('Content-Type: application/json; charset=utf-8');

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Get request data
 */
function getRequestData() {
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        return $data ?? [];
    }

    return $_POST;
}

// Parse request
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestUri = str_replace('/backend/api/', '', $requestUri);
$requestParts = explode('/', trim($requestUri, '/'));

$endpoint = $requestParts[0] ?? '';
$action = $requestParts[1] ?? '';
$param = $requestParts[2] ?? '';

try {
    // Route handling
    switch ($endpoint) {
        case 'shapes':
            handleShapesEndpoint($requestMethod, $action, $param);
            break;

        case 'questions':
            handleQuestionsEndpoint($requestMethod, $action, $param);
            break;

        case 'progress':
            handleProgressEndpoint($requestMethod, $action, $param);
            break;

        case 'moodle':
            handleMoodleEndpoint($requestMethod, $action, $param);
            break;

        case 'health':
            sendResponse(['status' => 'ok', 'version' => API_VERSION]);
            break;

        default:
            sendError('Endpoint not found', 404);
    }

} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError($e->getMessage(), 500);
}

/**
 * Handle /shapes endpoints
 */
function handleShapesEndpoint($method, $action, $param) {
    $shapeModel = new ShapeModel();

    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                $category = $_GET['category'] ?? null;
                $shapes = $shapeModel->getAllShapes($category);
                sendResponse(['success' => true, 'data' => $shapes]);

            } elseif ($action && is_numeric($action)) {
                $shape = $shapeModel->getCompleteShapeData($action);
                if ($shape) {
                    sendResponse(['success' => true, 'data' => $shape]);
                } else {
                    sendError('Shape not found', 404);
                }

            } elseif ($action === 'search') {
                $query = $_GET['q'] ?? '';
                $lang = $_GET['lang'] ?? 'ko';
                $shapes = $shapeModel->searchShapes($query, $lang);
                sendResponse(['success' => true, 'data' => $shapes]);

            } else {
                sendError('Invalid action', 400);
            }
            break;

        case 'POST':
            if ($action === 'create') {
                $data = getRequestData();
                $id = $shapeModel->createShape($data);
                sendResponse(['success' => true, 'id' => $id], 201);
            } else {
                sendError('Invalid action', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
}

/**
 * Handle /questions endpoints
 */
function handleQuestionsEndpoint($method, $action, $param) {
    $questionModel = new QuestionModel();

    switch ($method) {
        case 'GET':
            if ($action && is_numeric($action)) {
                $question = $questionModel->getQuestionByMoodleId($action);
                if ($question) {
                    sendResponse(['success' => true, 'data' => $question]);
                } else {
                    sendError('Question not found', 404);
                }

            } elseif ($action === 'stats' && $param) {
                $stats = $questionModel->getQuestionStats($param);
                sendResponse(['success' => true, 'data' => $stats]);

            } else {
                sendError('Invalid action', 400);
            }
            break;

        case 'POST':
            if ($action === 'create') {
                $data = getRequestData();
                $moodleQuestionId = $data['moodle_question_id'] ?? null;

                if (!$moodleQuestionId) {
                    sendError('moodle_question_id is required', 400);
                }

                $question = $questionModel->getOrCreateQuestion($moodleQuestionId, $data);
                sendResponse(['success' => true, 'data' => $question], 201);
            } else {
                sendError('Invalid action', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
}

/**
 * Handle /progress endpoints
 */
function handleProgressEndpoint($method, $action, $param) {
    $questionModel = new QuestionModel();

    switch ($method) {
        case 'GET':
            if ($action === 'user' && $param) {
                $progress = $questionModel->getUserProgress($param);
                sendResponse(['success' => true, 'data' => $progress]);

            } elseif ($action && $param) {
                // Get specific progress
                $progress = $questionModel->getProgress($action, $param);
                sendResponse(['success' => true, 'data' => $progress]);

            } else {
                sendError('Invalid parameters', 400);
            }
            break;

        case 'POST':
            if ($action === 'start') {
                $data = getRequestData();
                $userId = $data['user_id'] ?? null;
                $questionId = $data['question_id'] ?? null;

                if (!$userId || !$questionId) {
                    sendError('user_id and question_id are required', 400);
                }

                $progressId = $questionModel->startProgress($userId, $questionId);
                sendResponse(['success' => true, 'progress_id' => $progressId], 201);

            } elseif ($action === 'update' && $param) {
                $data = getRequestData();
                $questionModel->updateProgress($param, $data);
                sendResponse(['success' => true]);

            } elseif ($action === 'complete' && $param) {
                $data = getRequestData();
                $score = $data['score'] ?? 0;
                $timeSpent = $data['time_spent'] ?? 0;

                $questionModel->completeProgress($param, $score, $timeSpent);
                sendResponse(['success' => true]);

            } elseif ($action === 'interaction' && $param) {
                $questionModel->incrementInteraction($param);
                sendResponse(['success' => true]);

            } else {
                sendError('Invalid action', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
}

/**
 * Handle /moodle endpoints
 */
function handleMoodleEndpoint($method, $action, $param) {
    $moodleService = new MoodleService();

    switch ($method) {
        case 'GET':
            if ($action === 'validate') {
                $isValid = $moodleService->validateToken();
                sendResponse(['success' => true, 'valid' => $isValid]);

            } elseif ($action === 'question' && $param) {
                $question = $moodleService->getQuestion($param);
                sendResponse(['success' => true, 'data' => $question]);

            } elseif ($action === 'user' && $param) {
                $user = $moodleService->getUser($param);
                sendResponse(['success' => true, 'data' => $user]);

            } elseif ($action === 'course' && $param) {
                $course = $moodleService->getCourse($param);
                sendResponse(['success' => true, 'data' => $course]);

            } else {
                sendError('Invalid action', 400);
            }
            break;

        case 'POST':
            if ($action === 'grade') {
                $data = getRequestData();
                $userId = $data['user_id'] ?? null;
                $itemId = $data['item_id'] ?? null;
                $grade = $data['grade'] ?? null;

                if (!$userId || !$itemId || $grade === null) {
                    sendError('user_id, item_id, and grade are required', 400);
                }

                $result = $moodleService->submitGrade($userId, $itemId, $grade);
                sendResponse(['success' => true, 'result' => $result]);

            } else {
                sendError('Invalid action', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
}
