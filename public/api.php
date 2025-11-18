<?php
/**
 * REST API Endpoint for Sequence Puzzle
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle_config.php';
require_once __DIR__ . '/../src/Puzzle/PuzzleEngine.php';
require_once __DIR__ . '/../src/Moodle/LTIProvider.php';
require_once __DIR__ . '/../src/Moodle/GradeSync.php';

header('Content-Type: application/json');

// Handle CORS
$allowedOrigins = ALLOWED_ORIGINS === '*' ? '*' : explode(',', ALLOWED_ORIGINS);
if ($allowedOrigins === '*' || in_array($_SERVER['HTTP_ORIGIN'] ?? '', $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . ($allowedOrigins === '*' ? '*' : $_SERVER['HTTP_ORIGIN']));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize database and services
$db = Database::getInstance();
$puzzleEngine = new PuzzleEngine($db);
$ltiProvider = new LTIProvider($db);
$gradeSync = new GradeSync($db);

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';

// Helper function to send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Helper function to get JSON input
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Validate session for protected endpoints
function validateSession() {
    global $ltiProvider;

    $sessionToken = $_SESSION['session_token'] ?? ($_GET['session_token'] ?? null);

    if (!$sessionToken) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $session = $ltiProvider->validateSession($sessionToken);
    if (!$session) {
        sendResponse(['error' => 'Invalid or expired session'], 401);
    }

    return $session;
}

// Route handling
try {
    switch ($path) {
        // Get categories
        case 'categories':
            if ($method === 'GET') {
                $categories = $puzzleEngine->getCategories();
                sendResponse(['categories' => $categories]);
            }
            break;

        // Get puzzle
        case 'puzzle':
            validateSession();
            if ($method === 'GET') {
                $puzzleId = $_GET['id'] ?? null;
                $difficulty = $_GET['difficulty'] ?? null;
                $categoryId = $_GET['category'] ?? null;

                if ($puzzleId) {
                    $puzzle = $puzzleEngine->getPuzzle($puzzleId);
                } elseif ($categoryId) {
                    $puzzles = $puzzleEngine->getPuzzlesByCategory($categoryId);
                    sendResponse(['puzzles' => $puzzles]);
                } else {
                    $puzzle = $puzzleEngine->getRandomPuzzle($difficulty);
                }

                if ($puzzle) {
                    sendResponse(['puzzle' => $puzzle]);
                } else {
                    sendResponse(['error' => 'Puzzle not found'], 404);
                }
            }
            break;

        // Start attempt
        case 'start_attempt':
            $session = validateSession();
            if ($method === 'POST') {
                $input = getJsonInput();
                $puzzleId = $input['puzzle_id'] ?? null;

                if (!$puzzleId) {
                    sendResponse(['error' => 'puzzle_id required'], 400);
                }

                $attempt = $puzzleEngine->startAttempt($session['id'], $puzzleId);
                sendResponse(['attempt' => $attempt]);
            }
            break;

        // Submit answer
        case 'submit_answer':
            $session = validateSession();
            if ($method === 'POST') {
                $input = getJsonInput();
                $attemptId = $input['attempt_id'] ?? null;
                $answer = $input['answer'] ?? null;

                if (!$attemptId || !$answer) {
                    sendResponse(['error' => 'attempt_id and answer required'], 400);
                }

                $result = $puzzleEngine->submitAnswer($attemptId, $answer);

                // Sync grade to Moodle if configured
                if (!isset($result['error']) && $result['is_correct']) {
                    $gradeSync->sendGrade($session['id'], $input['puzzle_id'] ?? 0, $result['score']);
                }

                sendResponse(['result' => $result]);
            }
            break;

        // Use hint
        case 'use_hint':
            validateSession();
            if ($method === 'POST') {
                $input = getJsonInput();
                $attemptId = $input['attempt_id'] ?? null;

                if (!$attemptId) {
                    sendResponse(['error' => 'attempt_id required'], 400);
                }

                $puzzleEngine->useHint($attemptId);
                sendResponse(['success' => true]);
            }
            break;

        // Get progress
        case 'progress':
            $session = validateSession();
            if ($method === 'GET') {
                $progress = $puzzleEngine->getProgress($session['id']);
                sendResponse(['progress' => $progress]);
            }
            break;

        // Get history
        case 'history':
            $session = validateSession();
            if ($method === 'GET') {
                $limit = intval($_GET['limit'] ?? 20);
                $history = $puzzleEngine->getAttemptHistory($session['id'], $limit);
                sendResponse(['history' => $history]);
            }
            break;

        // Health check
        case 'health':
            sendResponse(['status' => 'ok', 'version' => APP_VERSION]);
            break;

        default:
            sendResponse(['error' => 'Invalid action'], 400);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendResponse([
        'error' => DEBUG_MODE ? $e->getMessage() : 'Internal server error'
    ], 500);
}
