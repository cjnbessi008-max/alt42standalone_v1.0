<?php
/**
 * Problems API Endpoint
 * GET    /problems - Get all problems (with filters)
 * GET    /problems/{id} - Get problem by ID
 * POST   /problems/{id}/submit - Submit answer for problem
 * GET    /problems/{id}/hint - Get hint for problem
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/FractionProblem.php';
require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../services/LearningPatternAnalyzer.php';
require_once __DIR__ . '/../services/RecommendationEngine.php';

$database = new Database();
$db = $database->getConnection();

$problem = new FractionProblem($db);
$attempt = new StudentAttempt($db);
$analyzer = new LearningPatternAnalyzer($db);
$recommender = new RecommendationEngine($db);

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse request
$uri_parts = explode('/', trim($request_uri, '/'));

try {
    switch ($method) {
        case 'GET':
            if (isset($uri_parts[2]) && is_numeric($uri_parts[2])) {
                $problem_id = $uri_parts[2];

                // Check for sub-resources
                if (isset($uri_parts[3]) && $uri_parts[3] === 'hint') {
                    // GET /problems/{id}/hint?pattern=visual
                    $pattern = $_GET['pattern'] ?? 'analytical';
                    $hint = $problem->getHint($problem_id, $pattern);

                    if ($hint) {
                        sendResponse(true, [
                            'hint' => $hint,
                            'pattern' => $pattern
                        ], 'Hint retrieved successfully');
                    } else {
                        sendError('Problem not found', 404);
                    }
                } else {
                    // GET /problems/{id}
                    $data = $problem->getById($problem_id);

                    if (!$data) {
                        sendError('Problem not found', 404);
                    }

                    // Get statistics
                    $stats = $problem->getStatistics($problem_id);
                    $data['statistics'] = $stats;

                    sendResponse(true, $data, 'Problem retrieved successfully');
                }
            } else {
                // GET /problems - Get all problems with filters
                $filters = [];

                if (isset($_GET['difficulty'])) {
                    $filters['difficulty'] = intval($_GET['difficulty']);
                }

                if (isset($_GET['problem_type'])) {
                    $filters['problem_type'] = $_GET['problem_type'];
                }

                if (isset($_GET['pattern'])) {
                    $filters['pattern'] = $_GET['pattern'];
                }

                $stmt = $problem->getAll($filters);
                $problems_arr = $stmt->fetchAll();

                sendResponse(true, [
                    'problems' => $problems_arr,
                    'count' => count($problems_arr),
                    'filters' => $filters
                ], 'Problems retrieved successfully');
            }
            break;

        case 'POST':
            if (isset($uri_parts[2]) && is_numeric($uri_parts[2]) && isset($uri_parts[3]) && $uri_parts[3] === 'submit') {
                // POST /problems/{id}/submit - Submit answer
                $problem_id = $uri_parts[2];
                $data = json_decode(file_get_contents("php://input"), true);

                validateRequired($data, ['student_id', 'answer_numerator', 'answer_denominator', 'time_spent_seconds']);

                $student_id = sanitizeInput($data['student_id']);
                $answer_num = sanitizeInput($data['answer_numerator']);
                $answer_den = sanitizeInput($data['answer_denominator']);

                // Check if answer is correct
                $is_correct = $problem->checkAnswer($problem_id, $answer_num, $answer_den);

                // Record attempt
                $attempt->student_id = $student_id;
                $attempt->problem_id = $problem_id;
                $attempt->answer_numerator = $answer_num;
                $attempt->answer_denominator = $answer_den;
                $attempt->is_correct = $is_correct;
                $attempt->time_spent_seconds = sanitizeInput($data['time_spent_seconds']);
                $attempt->hint_requested = $data['hint_requested'] ?? false;
                $attempt->hint_type_used = sanitizeInput($data['hint_type_used'] ?? 'none');
                $attempt->visual_tool_clicks = intval($data['visual_tool_clicks'] ?? 0);
                $attempt->step_by_step_views = intval($data['step_by_step_views'] ?? 0);
                $attempt->interactive_manipulations = intval($data['interactive_manipulations'] ?? 0);

                if ($attempt->create()) {
                    // Update learning pattern
                    $updated_pattern = $analyzer->analyzePattern($student_id);

                    // Mark recommendation as completed
                    $recommender->markAsCompleted($student_id, $problem_id);

                    // Get correct answer for feedback
                    $problem_data = $problem->getById($problem_id);

                    sendResponse(true, [
                        'is_correct' => $is_correct,
                        'attempt_id' => $attempt->id,
                        'correct_answer' => [
                            'numerator' => $problem_data['answer_numerator'],
                            'denominator' => $problem_data['answer_denominator']
                        ],
                        'updated_pattern' => $updated_pattern
                    ], $is_correct ? 'Correct answer!' : 'Incorrect answer. Try again!');
                } else {
                    sendError('Failed to record attempt', 500);
                }
            } else {
                sendError('Invalid endpoint', 400);
            }
            break;

        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
