<?php
/**
 * REST API Endpoints
 * Handles all API requests for Stat Digest system
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Autoloader for classes
spl_autoload_register(function ($class) {
    $prefix = 'StatDigest\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api.php', '', $path);
$segments = array_filter(explode('/', $path));

// Get request body for POST/PUT
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?: [];

// Merge with GET parameters
$params = array_merge($_GET, $data);

// Response helper
function sendResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $statusCode = 400)
{
    sendResponse(['error' => $message], $statusCode);
}

// Router
try {
    // Health check
    if ($path === '/health' || $path === '/') {
        sendResponse([
            'status' => 'ok',
            'message' => 'Stat Digest API is running',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Database connection test
    if ($path === '/test-db') {
        try {
            $db = \StatDigest\Utils\Database::getInstance();
            $result = $db->fetchOne('SELECT 1 as test');
            sendResponse([
                'status' => 'ok',
                'message' => 'Database connection successful',
                'result' => $result
            ]);
        } catch (Exception $e) {
            sendError('Database connection failed: ' . $e->getMessage(), 500);
        }
    }

    // Sync quiz from Moodle
    if ($path === '/sync/quiz' && $method === 'POST') {
        $quizId = $params['quiz_id'] ?? null;

        if (!$quizId) {
            sendError('quiz_id parameter is required');
        }

        $moodleService = new \StatDigest\Services\MoodleService();
        $result = $moodleService->syncQuestions($quizId);

        sendResponse($result);
    }

    // Sync attempts from Moodle
    if ($path === '/sync/attempts' && $method === 'POST') {
        $quizId = $params['quiz_id'] ?? null;

        if (!$quizId) {
            sendError('quiz_id parameter is required');
        }

        $moodleService = new \StatDigest\Services\MoodleService();
        $result = $moodleService->syncAttempts($quizId);

        sendResponse($result);
    }

    // Compute statistics
    if ($path === '/stats/compute' && $method === 'POST') {
        $problemId = $params['problem_id'] ?? null;

        $statService = new \StatDigest\Services\StatDigestService();

        if ($problemId) {
            $result = $statService->computeProblemStats($problemId);
        } else {
            $result = $statService->computeAllStats();
        }

        sendResponse($result);
    }

    // Get digest summary
    if ($path === '/digest/summary' && $method === 'GET') {
        $sessionId = $params['session_id'] ?? uniqid('session_');
        $filters = [
            'category' => $params['category'] ?? null,
            'difficulty_min' => $params['difficulty_min'] ?? null,
            'difficulty_max' => $params['difficulty_max'] ?? null,
        ];

        $statService = new \StatDigest\Services\StatDigestService();
        $result = $statService->getDigestSummary($sessionId, $filters);

        sendResponse($result);
    }

    // Get top difficult problems
    if ($path === '/digest/difficult' && $method === 'GET') {
        $limit = $params['limit'] ?? 10;

        $statService = new \StatDigest\Services\StatDigestService();
        $result = $statService->getTopDifficultProblems($limit);

        sendResponse(['problems' => $result]);
    }

    // Get performance insights
    if ($path === '/digest/insights' && $method === 'GET') {
        $statService = new \StatDigest\Services\StatDigestService();
        $result = $statService->getPerformanceInsights();

        sendResponse($result);
    }

    // Get all problems
    if ($path === '/problems' && $method === 'GET') {
        $db = \StatDigest\Utils\Database::getInstance();
        $problems = $db->fetchAll(
            'SELECT p.*, sd.accuracy_rate, sd.difficulty_index
            FROM problems p
            LEFT JOIN stat_digests sd ON p.id = sd.problem_id
            ORDER BY p.created_at DESC
            LIMIT 50'
        );

        sendResponse(['problems' => $problems]);
    }

    // Get problem stats by ID
    if (preg_match('#^/problems/(\d+)/stats$#', $path, $matches) && $method === 'GET') {
        $problemId = $matches[1];

        $db = \StatDigest\Utils\Database::getInstance();
        $stats = $db->fetchOne(
            'SELECT * FROM stat_digests WHERE problem_id = ?',
            [$problemId]
        );

        if (!$stats) {
            sendError('Statistics not found for problem ID ' . $problemId, 404);
        }

        sendResponse($stats);
    }

    // Not found
    sendError('Endpoint not found: ' . $path, 404);

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
