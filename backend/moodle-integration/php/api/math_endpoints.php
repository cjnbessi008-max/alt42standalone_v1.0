<?php
/**
 * Math API Endpoints for Moodle Integration
 * Bridges Moodle LMS with FastAPI backend
 */

require_once('../config/database.php');
require_once('../lib/api_client.php');

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Main router
 */
function handle_request() {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path_parts = explode('/', trim($path, '/'));
    $endpoint = end($path_parts);

    try {
        switch ($endpoint) {
            case 'calculate':
                if ($method === 'POST') {
                    handle_calculate_derivatives();
                } else {
                    send_error('Method not allowed', 405);
                }
                break;

            case 'graph':
                if ($method === 'POST') {
                    handle_generate_graph();
                } else {
                    send_error('Method not allowed', 405);
                }
                break;

            case 'question':
                if ($method === 'POST') {
                    handle_moodle_question();
                } else {
                    send_error('Method not allowed', 405);
                }
                break;

            case 'save-progress':
                if ($method === 'POST') {
                    handle_save_progress();
                } else {
                    send_error('Method not allowed', 405);
                }
                break;

            case 'get-progress':
                if ($method === 'GET') {
                    handle_get_progress();
                } else {
                    send_error('Method not allowed', 405);
                }
                break;

            default:
                send_error('Endpoint not found', 404);
        }
    } catch (Exception $e) {
        send_error($e->getMessage(), 500);
    }
}

/**
 * Handle derivative calculation request
 */
function handle_calculate_derivatives() {
    $input = get_json_input();

    if (!isset($input['function'])) {
        send_error('Function is required', 400);
        return;
    }

    $api_client = new APIClient();
    $response = $api_client->post('/api/derivatives', array(
        'function' => $input['function'],
        'max_order' => $input['max_order'] ?? 4,
    ));

    send_success($response);
}

/**
 * Handle graph generation request
 */
function handle_generate_graph() {
    $input = get_json_input();

    if (!isset($input['function'])) {
        send_error('Function is required', 400);
        return;
    }

    $api_client = new APIClient();
    $response = $api_client->post('/api/graph', array(
        'function' => $input['function'],
        'max_order' => $input['max_order'] ?? 4,
        'domain_min' => $input['domain_min'] ?? -10,
        'domain_max' => $input['domain_max'] ?? 10,
        'num_points' => $input['num_points'] ?? 500,
        'color_scheme' => $input['color_scheme'] ?? 'professional',
        'visible_orders' => $input['visible_orders'] ?? null,
    ));

    send_success($response);
}

/**
 * Handle Moodle question request
 */
function handle_moodle_question() {
    $input = get_json_input();

    if (!isset($input['question_id']) || !isset($input['user_id']) || !isset($input['function'])) {
        send_error('question_id, user_id, and function are required', 400);
        return;
    }

    // Get question from database
    $db = get_db_connection();
    $question_id = (int)$input['question_id'];
    $user_id = (int)$input['user_id'];

    // Fetch question details
    $stmt = $db->prepare("
        SELECT * FROM mdl_derivative_functions
        WHERE id = ?
    ");
    $stmt->bind_param('i', $question_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $question = $result->fetch_assoc();

    if (!$question) {
        send_error('Question not found', 404);
        return;
    }

    // Call backend API
    $api_client = new APIClient();
    $response = $api_client->post('/api/moodle/question', array(
        'question_id' => $question_id,
        'user_id' => $user_id,
        'function' => $input['function'],
        'required_orders' => $input['required_orders'] ?? [0, 1, 2],
    ));

    // Save activity log
    log_user_activity($db, $user_id, $question_id, 'view_graph');

    close_db_connection($db);
    send_success($response);
}

/**
 * Handle save progress request
 */
function handle_save_progress() {
    $input = get_json_input();

    if (!isset($input['user_id']) || !isset($input['function_id'])) {
        send_error('user_id and function_id are required', 400);
        return;
    }

    $db = get_db_connection();

    $stmt = $db->prepare("
        INSERT INTO mdl_student_derivative_work
        (user_id, function_id, derivative_order, student_answer, is_correct, time_spent_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $user_id = (int)$input['user_id'];
    $function_id = (int)$input['function_id'];
    $derivative_order = (int)($input['derivative_order'] ?? 1);
    $student_answer = $input['student_answer'] ?? '';
    $is_correct = (int)($input['is_correct'] ?? 0);
    $time_spent = (int)($input['time_spent_seconds'] ?? 0);

    $stmt->bind_param('iiisii',
        $user_id,
        $function_id,
        $derivative_order,
        $student_answer,
        $is_correct,
        $time_spent
    );

    $success = $stmt->execute();

    if ($success) {
        send_success(array(
            'saved' => true,
            'id' => $db->insert_id,
        ));
    } else {
        send_error('Failed to save progress', 500);
    }

    close_db_connection($db);
}

/**
 * Handle get progress request
 */
function handle_get_progress() {
    if (!isset($_GET['user_id'])) {
        send_error('user_id is required', 400);
        return;
    }

    $user_id = (int)$_GET['user_id'];
    $db = get_db_connection();

    $stmt = $db->prepare("
        SELECT
            w.*,
            f.function_expression
        FROM mdl_student_derivative_work w
        JOIN mdl_derivative_functions f ON w.function_id = f.id
        WHERE w.user_id = ?
        ORDER BY w.submitted_at DESC
        LIMIT 50
    ");

    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $work = array();
    while ($row = $result->fetch_assoc()) {
        $work[] = $row;
    }

    close_db_connection($db);
    send_success(array('work' => $work));
}

/**
 * Log user activity
 */
function log_user_activity($db, $user_id, $question_id, $activity_type) {
    $stmt = $db->prepare("
        INSERT INTO mdl_derivative_activity_log
        (user_id, question_id, activity_type, created_at)
        VALUES (?, ?, ?, NOW())
    ");
    $stmt->bind_param('iis', $user_id, $question_id, $activity_type);
    $stmt->execute();
}

/**
 * Utility functions
 */
function get_json_input() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? array();
}

function send_success($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function send_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(array('error' => $message));
    exit();
}

// Execute router
handle_request();
