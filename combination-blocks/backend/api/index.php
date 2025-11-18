<?php
/**
 * Combination Blocks API
 * Main entry point for all API requests
 * PHP 7.1.9 compatible
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle.php';

// Load models
require_once __DIR__ . '/../models/CombinationBlock.php';
require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../models/StudentProgress.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');
$segments = explode('/', $path);

// Get request body for POST/PUT
$input = null;
if (in_array($method, ['POST', 'PUT'])) {
    $input = json_decode(file_get_contents('php://input'), true);
}

// Authentication (simple token-based for now)
$token = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
}

// Route handling
try {
    switch ($segments[0]) {
        case 'blocks':
            handleBlocksRequest($method, $segments, $input, $token);
            break;

        case 'attempts':
            handleAttemptsRequest($method, $segments, $input, $token);
            break;

        case 'progress':
            handleProgressRequest($method, $segments, $input, $token);
            break;

        case 'hints':
            handleHintsRequest($method, $segments, $input, $token);
            break;

        case 'health':
            echo json_encode([
                'status' => 'ok',
                'timestamp' => time(),
                'version' => '1.0.0'
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

/**
 * Handle /blocks requests
 */
function handleBlocksRequest($method, $segments, $input, $token) {
    $blockModel = new CombinationBlock();

    switch ($method) {
        case 'GET':
            if (isset($segments[1])) {
                // GET /blocks/{id}
                $block = $blockModel->getById((int)$segments[1]);
                if ($block) {
                    echo json_encode($block);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Block not found']);
                }
            } else {
                // GET /blocks (list all active blocks)
                $blocks = $blockModel->getAll();
                echo json_encode($blocks);
            }
            break;

        case 'POST':
            // POST /blocks (create new block - admin only)
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }
            $blockId = $blockModel->create($input);
            http_response_code(201);
            echo json_encode(['id' => $blockId, 'message' => 'Block created']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

/**
 * Handle /attempts requests
 */
function handleAttemptsRequest($method, $segments, $input, $token) {
    $attemptModel = new StudentAttempt();

    switch ($method) {
        case 'GET':
            if (isset($segments[1])) {
                // GET /attempts/{id}
                $attempt = $attemptModel->getById((int)$segments[1]);
                echo json_encode($attempt);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Attempt ID required']);
            }
            break;

        case 'POST':
            // POST /attempts (submit new attempt)
            if (!$input || !isset($input['combination_block_id']) || !isset($input['moodle_user_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            $result = $attemptModel->submitAttempt($input);
            http_response_code(201);
            echo json_encode($result);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
}

/**
 * Handle /progress requests
 */
function handleProgressRequest($method, $segments, $input, $token) {
    $progressModel = new StudentProgress();

    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    // GET /progress/{userId}/{blockId}
    if (isset($segments[1]) && isset($segments[2])) {
        $userId = (int)$segments[1];
        $blockId = (int)$segments[2];
        $progress = $progressModel->getProgress($userId, $blockId);
        echo json_encode($progress);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'User ID and Block ID required']);
    }
}

/**
 * Handle /hints requests
 */
function handleHintsRequest($method, $segments, $input, $token) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    // GET /hints/{blockId}
    if (!isset($segments[1])) {
        http_response_code(400);
        echo json_encode(['error' => 'Block ID required']);
        return;
    }

    $blockId = (int)$segments[1];
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT id, hint_text, hint_level, sort_order
        FROM block_hints
        WHERE combination_block_id = :blockId
        ORDER BY sort_order ASC
    ");
    $stmt->execute(['blockId' => $blockId]);
    $hints = $stmt->fetchAll();

    echo json_encode($hints);
}
