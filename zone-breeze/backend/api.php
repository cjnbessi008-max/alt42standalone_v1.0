<?php
/**
 * Zone Breeze - API Endpoints
 *
 * RESTful API for Zone Breeze application
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in production
ini_set('log_errors', 1);

// Include dependencies
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/moodle_config.php';
require_once __DIR__ . '/inequality_solver.php';

// Set response headers
header('Content-Type: application/json; charset=utf-8');

// CORS handling
if (ENABLE_CORS) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Send JSON response
 *
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response
 *
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message,
        'timestamp' => time()
    ], $statusCode);
}

/**
 * Get request input
 *
 * @return array Decoded JSON input
 */
function getInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON input', 400);
    }

    return $data ?? [];
}

/**
 * Validate required fields
 *
 * @param array $data Input data
 * @param array $required Required field names
 */
function validateRequired($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            sendError("Missing required field: $field", 400);
        }
    }
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? $_GET['action'] ?? '';

try {
    switch ($path) {
        // Get problem from Moodle
        case '/get_problem':
        case 'get_problem':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }

            $input = getInput();
            validateRequired($input, ['activity_id']);

            $activityId = (int)$input['activity_id'];
            $userId = $input['user_id'] ?? null;

            // Fetch problem from database
            $sql = "SELECT * FROM problems WHERE moodle_activity_id = ? AND is_active = 1 LIMIT 1";
            $problem = fetchOne($sql, [$activityId]);

            if (!$problem) {
                sendError('Problem not found', 404);
            }

            // Decode JSON fields
            $problem['inequalities'] = json_decode($problem['inequalities'], true);
            $problem['visualization_bounds'] = json_decode($problem['visualization_bounds'], true);

            // Log visualization session
            if ($userId) {
                $sessionSql = "INSERT INTO visualization_sessions
                              (problem_id, moodle_user_id, device_type)
                              VALUES (?, ?, ?)";
                executeQuery($sessionSql, [
                    $problem['id'],
                    $userId,
                    $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
                ]);
            }

            sendResponse([
                'success' => true,
                'problem' => $problem
            ]);
            break;

        // Solve inequalities
        case '/solve':
        case 'solve':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }

            $input = getInput();
            validateRequired($input, ['inequalities']);

            $inequalities = $input['inequalities'];
            $bounds = $input['bounds'] ?? null;

            if (!is_array($inequalities) || empty($inequalities)) {
                sendError('Inequalities must be a non-empty array', 400);
            }

            // Check cache first
            $cacheKey = hash('sha256', json_encode(['ineq' => $inequalities, 'bounds' => $bounds]));
            $cacheSql = "SELECT solution_vertices, solution_regions, hit_count
                        FROM inequality_cache
                        WHERE inequalities_hash = ?";
            $cached = fetchOne($cacheSql, [$cacheKey]);

            if ($cached) {
                // Update cache hit count
                executeQuery("UPDATE inequality_cache SET hit_count = hit_count + 1 WHERE inequalities_hash = ?", [$cacheKey]);

                sendResponse([
                    'success' => true,
                    'solution' => [
                        'vertices' => json_decode($cached['solution_vertices'], true),
                        'regions' => json_decode($cached['solution_regions'], true)
                    ],
                    'cached' => true
                ]);
            }

            // Solve inequalities
            $startTime = microtime(true);
            $solver = new InequalitySolver($inequalities, $bounds);
            $solution = $solver->solve();
            $computationTime = (microtime(true) - $startTime) * 1000; // ms

            // Cache the result
            $cacheSql = "INSERT INTO inequality_cache
                        (inequalities_hash, inequalities, solution_vertices, solution_regions, computation_time_ms)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        solution_vertices = VALUES(solution_vertices),
                        solution_regions = VALUES(solution_regions),
                        computation_time_ms = VALUES(computation_time_ms),
                        hit_count = hit_count + 1";

            executeQuery($cacheSql, [
                $cacheKey,
                json_encode($inequalities),
                json_encode($solution['vertices']),
                json_encode($solution),
                round($computationTime)
            ]);

            sendResponse([
                'success' => true,
                'solution' => $solution,
                'cached' => false,
                'computation_time_ms' => round($computationTime, 2)
            ]);
            break;

        // Submit solution
        case '/submit':
        case 'submit':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }

            $input = getInput();
            validateRequired($input, ['problem_id', 'user_id']);

            $problemId = (int)$input['problem_id'];
            $userId = (int)$input['user_id'];
            $timeSpent = (int)($input['time_spent_seconds'] ?? 0);
            $solutionData = $input['solution_data'] ?? null;

            // Get problem
            $problem = fetchOne("SELECT * FROM problems WHERE id = ?", [$problemId]);
            if (!$problem) {
                sendError('Problem not found', 404);
            }

            // Calculate grade (simplified)
            $grade = 100; // Default full credit for viewing

            // Insert solution
            $sql = "INSERT INTO student_solutions
                   (problem_id, moodle_user_id, solution_data, time_spent_seconds, grade, is_correct)
                   VALUES (?, ?, ?, ?, ?, ?)";

            executeQuery($sql, [
                $problemId,
                $userId,
                json_encode($solutionData),
                $timeSpent,
                $grade,
                true
            ]);

            $submissionId = getLastInsertId();

            sendResponse([
                'success' => true,
                'submission_id' => $submissionId,
                'grade' => $grade,
                'feedback' => '문제를 완료했습니다!'
            ]);
            break;

        // Get templates
        case '/templates':
        case 'templates':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }

            $category = $_GET['category'] ?? null;
            $difficulty = $_GET['difficulty'] ?? null;

            $sql = "SELECT * FROM problem_templates WHERE is_public = 1";
            $params = [];

            if ($category) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }

            if ($difficulty) {
                $sql .= " AND difficulty_level = ?";
                $params[] = $difficulty;
            }

            $sql .= " ORDER BY usage_count DESC, template_name ASC";

            $templates = fetchAll($sql, $params);

            // Decode JSON fields
            foreach ($templates as &$template) {
                $template['template_inequalities'] = json_decode($template['template_inequalities'], true);
                $template['suggested_bounds'] = json_decode($template['suggested_bounds'], true);
            }

            sendResponse([
                'success' => true,
                'templates' => $templates
            ]);
            break;

        // Get student analytics
        case '/analytics':
        case 'analytics':
            if ($method !== 'GET') {
                sendError('Method not allowed', 405);
            }

            $userId = $_GET['user_id'] ?? null;
            $problemId = $_GET['problem_id'] ?? null;

            if ($userId) {
                // Get student performance
                $sql = "SELECT * FROM student_performance WHERE moodle_user_id = ?";
                $data = fetchOne($sql, [$userId]);

                sendResponse([
                    'success' => true,
                    'analytics' => $data
                ]);
            } elseif ($problemId) {
                // Get problem statistics
                $sql = "SELECT * FROM problem_statistics WHERE id = ?";
                $data = fetchOne($sql, [$problemId]);

                sendResponse([
                    'success' => true,
                    'statistics' => $data
                ]);
            } else {
                sendError('user_id or problem_id required', 400);
            }
            break;

        // Track interaction
        case '/track':
        case 'track':
            if ($method !== 'POST') {
                sendError('Method not allowed', 405);
            }

            $input = getInput();
            validateRequired($input, ['session_id', 'event_type']);

            $sessionId = (int)$input['session_id'];
            $eventType = $input['event_type'];
            $eventData = $input['event_data'] ?? null;

            // Update session tracking
            $column = match($eventType) {
                'zoom' => 'zoom_events',
                'hover' => 'hover_events',
                'click' => 'click_events',
                default => null
            };

            if ($column) {
                executeQuery("UPDATE visualization_sessions SET $column = $column + 1 WHERE id = ?", [$sessionId]);
            }

            sendResponse([
                'success' => true,
                'tracked' => true
            ]);
            break;

        // Health check
        case '/health':
        case 'health':
            sendResponse([
                'success' => true,
                'status' => 'healthy',
                'version' => '1.0.0',
                'timestamp' => time()
            ]);
            break;

        default:
            sendError('Endpoint not found: ' . $path, 404);
    }

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Database error occurred', 500);

} catch (Exception $e) {
    error_log('Error: ' . $e->getMessage());
    sendError($e->getMessage(), 500);
}
