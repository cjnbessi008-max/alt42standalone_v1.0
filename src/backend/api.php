<?php
/**
 * Function Digest API
 * RESTful API for function digest functionality
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ALLOW_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'Database.php';
require_once 'MoodleAPI.php';
require_once 'FunctionDigestGenerator.php';

// Initialize classes
$db = new Database();
$moodle = new MoodleAPI();
$generator = new FunctionDigestGenerator();

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    switch ($endpoint) {

        // GET /api.php?endpoint=digest&question_id=123
        case 'digest':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed', 405);
            }

            $questionId = isset($_GET['question_id']) ? intval($_GET['question_id']) : 0;
            if ($questionId <= 0) {
                throw new Exception('Invalid question_id', 400);
            }

            // Get digest from database
            $digests = $db->getDigestByMoodleQuestionId($questionId);

            if (empty($digests)) {
                // Generate new digest from Moodle question
                $questionData = $moodle->getQuestion($questionId);

                if (isset($questionData['error'])) {
                    throw new Exception($questionData['error'], 500);
                }

                // For demo, return empty if no digest exists
                http_response_code(404);
                echo json_encode(['error' => 'No digest found for this question']);
                exit;
            }

            // Format response
            $response = [
                'success' => true,
                'question_id' => $questionId,
                'digests' => $digests
            ];

            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        // POST /api.php?endpoint=generate
        case 'generate':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            $problemId = isset($input['problem_id']) ? intval($input['problem_id']) : 0;
            $functionName = isset($input['function_name']) ? trim($input['function_name']) : '';
            $functionCode = isset($input['function_code']) ? trim($input['function_code']) : '';
            $language = isset($input['language']) ? trim($input['language']) : 'python';

            if ($problemId <= 0 || empty($functionName) || empty($functionCode)) {
                throw new Exception('Missing required fields: problem_id, function_name, function_code', 400);
            }

            // Generate digest
            $digest = $generator->generateEnhancedDigest($functionName, $functionCode, '', $language);

            // Save to database
            $success = $db->createDigest(
                $problemId,
                $functionName,
                $functionCode,
                $digest['line1'],
                $digest['line2'],
                $digest['line3'],
                $language
            );

            if (!$success) {
                throw new Exception('Failed to save digest', 500);
            }

            $response = [
                'success' => true,
                'message' => 'Digest generated successfully',
                'digest' => $digest
            ];

            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        // GET /api.php?endpoint=moodle_sync&question_id=123
        case 'moodle_sync':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed', 405);
            }

            $questionId = isset($_GET['question_id']) ? intval($_GET['question_id']) : 0;
            if ($questionId <= 0) {
                throw new Exception('Invalid question_id', 400);
            }

            // Fetch from Moodle
            $questionData = $moodle->getQuestion($questionId);

            if (isset($questionData['error'])) {
                throw new Exception($questionData['error'], 500);
            }

            // Extract functions from question text
            $questionText = isset($questionData['questiontext']) ? $questionData['questiontext'] : '';
            $functions = $moodle->extractFunctions($questionText);

            $response = [
                'success' => true,
                'question_id' => $questionId,
                'question_text' => $questionText,
                'functions_found' => count($functions),
                'functions' => $functions
            ];

            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        // POST /api.php?endpoint=log_view
        case 'log_view':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed', 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            $userId = isset($input['user_id']) ? intval($input['user_id']) : 0;
            $digestId = isset($input['digest_id']) ? intval($input['digest_id']) : 0;

            if ($userId <= 0 || $digestId <= 0) {
                throw new Exception('Invalid user_id or digest_id', 400);
            }

            $success = $db->logDigestView($userId, $digestId);

            $response = [
                'success' => $success,
                'message' => 'View logged'
            ];

            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        // GET /api.php?endpoint=health
        case 'health':
            $response = [
                'success' => true,
                'message' => 'Function Digest API is running',
                'timestamp' => date('Y-m-d H:i:s'),
                'php_version' => phpversion(),
                'mysql_version' => $db->getConnection()->getAttribute(PDO::ATTR_SERVER_VERSION)
            ];

            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            break;

        default:
            throw new Exception('Unknown endpoint: ' . $endpoint, 404);
    }

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $code
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
