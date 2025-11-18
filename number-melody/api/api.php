<?php
/**
 * Number Melody - Main API Endpoint
 * Handles requests from the frontend
 */

require_once 'config.php';
require_once 'moodle_integration.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = isset($_GET['action']) ? sanitize_input($_GET['action']) : '';
$moodle = new MoodleIntegration();

switch ($action) {
    case 'get_problem':
        get_problem();
        break;

    case 'submit_answer':
        submit_answer();
        break;

    case 'get_progress':
        get_progress();
        break;

    case 'save_interaction':
        save_interaction();
        break;

    default:
        json_response(array('error' => 'Invalid action'), 400);
}

/**
 * Get a problem/question
 */
function get_problem() {
    global $pdo;

    $problem_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($problem_id > 0) {
        // Get specific problem
        $stmt = $pdo->prepare("SELECT * FROM problems WHERE id = ?");
        $stmt->execute([$problem_id]);
        $problem = $stmt->fetch();
    } else {
        // Get random problem
        $stmt = $pdo->prepare("SELECT * FROM problems ORDER BY RAND() LIMIT 1");
        $stmt->execute();
        $problem = $stmt->fetch();
    }

    if ($problem) {
        // Parse number sequence if stored as JSON
        if (isset($problem['number_sequence'])) {
            $problem['number_sequence'] = json_decode($problem['number_sequence'], true);
        }

        json_response(array('success' => true, 'problem' => $problem));
    } else {
        // Return a default problem if none exists
        $default_problem = array(
            'id' => 0,
            'title' => 'Number Melody Demo',
            'description' => 'Touch the numbers in sequence to create a melody',
            'number_sequence' => array(1, 2, 3, 4, 5, 6, 7, 8, 9),
            'correct_answer' => '123456789',
            'difficulty' => 1
        );

        json_response(array('success' => true, 'problem' => $default_problem));
    }
}

/**
 * Submit an answer
 */
function submit_answer() {
    global $pdo, $moodle;

    $input = json_decode(file_get_contents('php://input'), true);

    $problem_id = isset($input['problem_id']) ? (int)$input['problem_id'] : 0;
    $user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $answer = isset($input['answer']) ? sanitize_input($input['answer']) : '';
    $time_spent = isset($input['time_spent']) ? (int)$input['time_spent'] : 0;

    if (!$problem_id || !$user_id || empty($answer)) {
        json_response(array('error' => 'Missing required fields'), 400);
    }

    // Get problem to check answer
    $stmt = $pdo->prepare("SELECT * FROM problems WHERE id = ?");
    $stmt->execute([$problem_id]);
    $problem = $stmt->fetch();

    if (!$problem) {
        json_response(array('error' => 'Problem not found'), 404);
    }

    // Check if answer is correct
    $is_correct = ($answer === $problem['correct_answer']);

    // Save attempt
    $stmt = $pdo->prepare("
        INSERT INTO student_attempts
        (problem_id, user_id, answer, is_correct, time_spent, attempted_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$problem_id, $user_id, $answer, $is_correct ? 1 : 0, $time_spent]);

    // Submit to Moodle if question_id is linked
    if (isset($problem['moodle_question_id']) && $problem['moodle_question_id'] > 0) {
        $moodle->submit_answer($problem['moodle_question_id'], $user_id, $answer, $is_correct);
    }

    json_response(array(
        'success' => true,
        'is_correct' => $is_correct,
        'message' => $is_correct ? 'Correct! Well done!' : 'Try again!'
    ));
}

/**
 * Get student progress
 */
function get_progress() {
    global $pdo;

    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

    if (!$user_id) {
        json_response(array('error' => 'User ID required'), 400);
    }

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total_attempts,
            SUM(is_correct) as correct_attempts,
            AVG(time_spent) as avg_time,
            MAX(attempted_at) as last_attempt
        FROM student_attempts
        WHERE user_id = ?
    ");
    $stmt->execute([$user_id]);
    $progress = $stmt->fetch();

    $accuracy = $progress['total_attempts'] > 0
        ? round(($progress['correct_attempts'] / $progress['total_attempts']) * 100, 2)
        : 0;

    json_response(array(
        'success' => true,
        'progress' => array(
            'total_attempts' => (int)$progress['total_attempts'],
            'correct_attempts' => (int)$progress['correct_attempts'],
            'accuracy' => $accuracy,
            'avg_time' => round($progress['avg_time'], 2),
            'last_attempt' => $progress['last_attempt']
        )
    ));
}

/**
 * Save user interaction (for analytics)
 */
function save_interaction() {
    global $pdo;

    $input = json_decode(file_get_contents('php://input'), true);

    $user_id = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $problem_id = isset($input['problem_id']) ? (int)$input['problem_id'] : 0;
    $interaction_type = isset($input['type']) ? sanitize_input($input['type']) : 'tap';
    $interaction_data = isset($input['data']) ? json_encode($input['data']) : '{}';

    $stmt = $pdo->prepare("
        INSERT INTO interactions
        (user_id, problem_id, interaction_type, interaction_data, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$user_id, $problem_id, $interaction_type, $interaction_data]);

    json_response(array('success' => true));
}
