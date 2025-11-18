<?php
/**
 * Similarity Detector REST API
 * Main entry point for all API requests
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'SimilarityDetector\\';
    $base_dir = __DIR__ . '/../';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// Load configuration
$dbConfig = require __DIR__ . '/../../config/database.php';
$moodleConfig = require __DIR__ . '/../../config/moodle.php';

// Database connection
try {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['database'],
        $dbConfig['charset']
    );

    $db = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Initialize classes
use SimilarityDetector\Moodle\MoodleConnector;
use SimilarityDetector\Detector\SimilarityDetector;

$moodleConnector = new MoodleConnector($moodleConfig['moodle_db']);
$similarityDetector = new SimilarityDetector(
    $db,
    $moodleConfig['similarity_detection']['min_confidence'],
    $moodleConfig['similarity_detection']['max_hints_per_problem']
);

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$pathParts = explode('/', trim($path, '/'));

// Route handler
try {
    switch ($pathParts[0]) {
        case 'health':
            handleHealth();
            break;

        case 'problems':
            handleProblems($method, $pathParts, $moodleConnector, $similarityDetector);
            break;

        case 'hints':
            handleHints($method, $pathParts, $similarityDetector);
            break;

        case 'detect':
            handleDetect($method, $moodleConnector, $similarityDetector);
            break;

        case 'search':
            handleSearch($method, $moodleConnector);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Health check endpoint
 */
function handleHealth()
{
    echo json_encode([
        'status' => 'ok',
        'timestamp' => time(),
        'version' => '1.0.0'
    ]);
}

/**
 * Handle problem-related requests
 */
function handleProblems($method, $pathParts, $moodleConnector, $similarityDetector)
{
    if ($method === 'GET') {
        if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
            // Get specific problem
            $problemId = (int)$pathParts[1];
            $problem = getProblemById($problemId, $moodleConnector, $similarityDetector);

            if ($problem) {
                echo json_encode($problem);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Problem not found']);
            }
        } else {
            // List problems
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $type = isset($_GET['type']) ? $_GET['type'] : null;

            if ($type) {
                $problems = $moodleConnector->getQuestionsByType($type, $limit);
            } else {
                // Get all questions (you might want to implement a getAll method)
                $problems = [];
            }

            echo json_encode(['problems' => $problems]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

/**
 * Handle hints-related requests
 */
function handleHints($method, $pathParts, $similarityDetector)
{
    if ($method === 'GET') {
        if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
            // Get hints for specific problem
            $problemId = (int)$pathParts[1];
            $hints = $similarityDetector->getHints($problemId);

            echo json_encode(['hints' => $hints]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Problem ID required']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

/**
 * Handle detection requests
 */
function handleDetect($method, $moodleConnector, $similarityDetector)
{
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['problem_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'problem_id required']);
            return;
        }

        $problemId = (int)$input['problem_id'];

        // Get problem from Moodle
        $problem = $moodleConnector->getQuestion($problemId);

        if (!$problem) {
            http_response_code(404);
            echo json_encode(['error' => 'Problem not found in Moodle']);
            return;
        }

        // Detect hints
        $result = $similarityDetector->detectHints($problem);

        echo json_encode([
            'success' => true,
            'data' => $result
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

/**
 * Handle search requests
 */
function handleSearch($method, $moodleConnector)
{
    if ($method === 'GET') {
        $query = isset($_GET['q']) ? $_GET['q'] : '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['error' => 'Search query required']);
            return;
        }

        $results = $moodleConnector->searchQuestions($query, $limit);

        echo json_encode(['results' => $results]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}

/**
 * Get problem by ID with hints
 */
function getProblemById($problemId, $moodleConnector, $similarityDetector)
{
    $problem = $moodleConnector->getQuestion($problemId);

    if ($problem) {
        $hints = $similarityDetector->getHints($problemId);
        $problem['hints'] = $hints;
    }

    return $problem;
}
