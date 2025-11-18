<?php
/**
 * REST API for Contrapositive Flip
 *
 * @package    local_contrapositive
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../../config.php');  // Moodle config
require_once('../moodle_plugin/lib.php');
require_once('../moodle_plugin/contrapositive_generator.php');

// CORS headers for mobile app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Require login for API access
require_login();

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Initialize response
$response = [
    'success' => false,
    'data' => null,
    'error' => null,
];

try {
    switch ($action) {
        case 'get_question':
            handle_get_question();
            break;

        case 'generate':
            handle_generate();
            break;

        case 'record_attempt':
            handle_record_attempt();
            break;

        case 'update_attempt':
            handle_update_attempt();
            break;

        case 'get_analytics':
            handle_get_analytics();
            break;

        case 'get_examples':
            handle_get_examples();
            break;

        default:
            throw new Exception('Invalid action: ' . $action);
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
    http_response_code(400);
}

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit;

/**
 * Get a question by ID
 */
function handle_get_question() {
    global $response;

    $questionid = required_param('id', PARAM_INT);

    $question = local_contrapositive_get_question($questionid);

    if (!$question) {
        throw new Exception('Question not found');
    }

    $response['success'] = true;
    $response['data'] = $question;
}

/**
 * Generate a new contrapositive question
 */
function handle_generate() {
    global $response;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $required = ['original_antecedent', 'original_consequent'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }

    // Create question data
    $data = new stdClass();
    $data->moodle_question_id = $input['moodle_question_id'] ?? 0;
    $data->course_id = $input['course_id'] ?? 0;
    $data->original_antecedent = $input['original_antecedent'];
    $data->original_consequent = $input['original_consequent'];
    $data->language = $input['language'] ?? 'ko';
    $data->difficulty_level = $input['difficulty_level'] ?? 1;

    // Build original statement
    if ($data->language === 'ko') {
        $data->original_statement = "만약 {$data->original_antecedent}이면, {$data->original_consequent}이다";
    } else {
        $data->original_statement = "If {$data->original_antecedent}, then {$data->original_consequent}";
    }

    // Create question
    $questionid = local_contrapositive_create_question($data);

    if (!$questionid) {
        throw new Exception('Failed to create question');
    }

    // Fetch the created question
    $question = local_contrapositive_get_question($questionid);

    $response['success'] = true;
    $response['data'] = $question;
}

/**
 * Record a new attempt
 */
function handle_record_attempt() {
    global $response, $USER;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['question_id'])) {
        throw new Exception('Invalid input: question_id required');
    }

    $data = new stdClass();
    $data->question_id = $input['question_id'];
    $data->user_id = $USER->id;
    $data->flip_count = $input['flip_count'] ?? 0;
    $data->time_spent = $input['time_spent'] ?? 0;
    $data->understood = $input['understood'] ?? null;
    $data->user_answer = $input['user_answer'] ?? '';

    $attemptid = local_contrapositive_record_attempt($data);

    if (!$attemptid) {
        throw new Exception('Failed to record attempt');
    }

    $response['success'] = true;
    $response['data'] = ['attempt_id' => $attemptid];
}

/**
 * Update an existing attempt
 */
function handle_update_attempt() {
    global $response;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['attempt_id'])) {
        throw new Exception('Invalid input: attempt_id required');
    }

    $attemptid = $input['attempt_id'];

    $data = new stdClass();
    if (isset($input['flip_count'])) {
        $data->flip_count = $input['flip_count'];
    }
    if (isset($input['time_spent'])) {
        $data->time_spent = $input['time_spent'];
    }
    if (isset($input['understood'])) {
        $data->understood = $input['understood'];
    }
    if (isset($input['user_answer'])) {
        $data->user_answer = $input['user_answer'];
    }

    $success = local_contrapositive_update_attempt($attemptid, $data);

    if (!$success) {
        throw new Exception('Failed to update attempt');
    }

    $response['success'] = true;
    $response['data'] = ['updated' => true];
}

/**
 * Get analytics for a question
 */
function handle_get_analytics() {
    global $response;

    $questionid = required_param('question_id', PARAM_INT);
    $days = optional_param('days', 30, PARAM_INT);

    $analytics = local_contrapositive_get_analytics($questionid, $days);

    $response['success'] = true;
    $response['data'] = $analytics;
}

/**
 * Get example questions
 */
function handle_get_examples() {
    global $response;

    $language = optional_param('language', 'ko', PARAM_ALPHA);

    $generator = new contrapositive_generator();
    $examples = $generator->get_examples($language);

    $response['success'] = true;
    $response['data'] = $examples;
}
