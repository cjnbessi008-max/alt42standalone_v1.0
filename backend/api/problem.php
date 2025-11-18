<?php
/**
 * Problem API Endpoint
 * Handles requests for problem data
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/LogarithmCalculator.php';
require_once __DIR__ . '/../models/Problem.php';
require_once __DIR__ . '/../utils/cors.php';
require_once __DIR__ . '/../utils/response.php';

// Load configuration
$config = require __DIR__ . '/../config/config.php';

// Enable CORS
handleCors($config['cors']);

// Get database instance
try {
    $db = Database::getInstance($config);
} catch (Exception $e) {
    sendError('Database connection failed', 500);
    exit;
}

// Initialize models
$calculator = new LogarithmCalculator();
$problemModel = new Problem($db, $calculator);

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Parse request
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api/problem';

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path
$path = str_replace($basePath, '', $path);
$path = trim($path, '/');

// Get request data
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Route requests
try {
    switch ($method) {
        case 'GET':
            if (empty($path)) {
                // GET /api/problem - Get random or filtered problems
                $difficulty = $_GET['difficulty'] ?? null;
                $base = $_GET['base'] ?? null;
                $studentId = $_GET['student_id'] ?? null;

                if ($studentId) {
                    // Get next recommended problem for student
                    $problem = $problemModel->getNextForStudent($studentId);
                    if ($problem) {
                        sendSuccess($problem);
                    } else {
                        sendError('No problems available', 404);
                    }
                } elseif ($difficulty) {
                    // Get random problem by difficulty
                    $problem = $problemModel->getRandomByDifficulty($difficulty);
                    if ($problem) {
                        sendSuccess($problem);
                    } else {
                        sendError('No problems found for difficulty ' . $difficulty, 404);
                    }
                } else {
                    // Search problems
                    $filters = [];
                    if (isset($_GET['difficulty'])) $filters['difficulty'] = $_GET['difficulty'];
                    if (isset($_GET['base'])) $filters['base'] = $_GET['base'];
                    if (isset($_GET['type'])) $filters['problem_type'] = $_GET['type'];

                    $problems = $problemModel->search($filters);
                    sendSuccess(['problems' => $problems, 'count' => count($problems)]);
                }
            } else {
                // GET /api/problem/{id} - Get specific problem
                $problem = $problemModel->getById($path);

                if ($problem) {
                    // Don't send correct answer to client initially
                    $clientProblem = $problem;
                    unset($clientProblem['correct_answer']);

                    sendSuccess($clientProblem);
                } else {
                    sendError('Problem not found', 404);
                }
            }
            break;

        case 'POST':
            if ($path === 'create') {
                // POST /api/problem/create - Create new problem
                $id = $problemModel->create($input);
                $problem = $problemModel->getById($id);
                sendSuccess($problem, 201);
            } elseif ($path === 'random') {
                // POST /api/problem/random - Generate random problem
                $difficulty = $input['difficulty'] ?? 1;
                $problemData = $calculator->generateProblem($difficulty);
                sendSuccess($problemData);
            } elseif ($path === 'hint') {
                // POST /api/problem/hint - Get hint for problem
                $problemId = $input['problem_id'] ?? null;
                if (!$problemId) {
                    sendError('Missing problem_id', 400);
                    break;
                }

                $problem = $problemModel->getById($problemId);
                if (!$problem) {
                    sendError('Problem not found', 404);
                    break;
                }

                sendSuccess([
                    'hint' => $problem['hint_text'],
                    'problem_id' => $problemId
                ]);
            } elseif ($path === 'steps') {
                // POST /api/problem/steps - Get step-by-step solution
                $problemId = $input['problem_id'] ?? null;
                if (!$problemId) {
                    sendError('Missing problem_id', 400);
                    break;
                }

                $problem = $problemModel->getById($problemId);
                if (!$problem) {
                    sendError('Problem not found', 404);
                    break;
                }

                $steps = $calculator->generateSteps($problem['base'], $problem['correct_answer']);

                sendSuccess([
                    'steps' => $steps,
                    'problem_id' => $problemId,
                    'total_candles' => $problem['correct_answer']
                ]);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;

        case 'PUT':
            if (!empty($path)) {
                // PUT /api/problem/{id} - Update problem
                $updated = $problemModel->update($path, $input);
                if ($updated > 0) {
                    $problem = $problemModel->getById($path);
                    sendSuccess($problem);
                } else {
                    sendError('Problem not found or no changes made', 404);
                }
            } else {
                sendError('Problem ID required', 400);
            }
            break;

        case 'DELETE':
            if (!empty($path)) {
                // DELETE /api/problem/{id} - Deactivate problem
                $deactivated = $problemModel->deactivate($path);
                if ($deactivated > 0) {
                    sendSuccess(['message' => 'Problem deactivated', 'id' => $path]);
                } else {
                    sendError('Problem not found', 404);
                }
            } else {
                sendError('Problem ID required', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }
} catch (InvalidArgumentException $e) {
    sendError($e->getMessage(), 400);
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    sendError('Internal server error', 500);
}
