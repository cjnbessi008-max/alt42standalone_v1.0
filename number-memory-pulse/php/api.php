<?php
/**
 * Number Memory Pulse - API Endpoints
 * Handles all AJAX requests from the game
 */

require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/game-functions.php');

// Ensure user is logged in
if (!nmp_require_login()) {
    nmp_error_response('Authentication required', 401);
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Handle CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($method === 'OPTIONS') {
    exit(0);
}

try {
    switch ($action) {
        case 'get_problem':
            handle_get_problem();
            break;

        case 'submit_answer':
            handle_submit_answer();
            break;

        case 'get_progress':
            handle_get_progress();
            break;

        case 'get_leaderboard':
            handle_get_leaderboard();
            break;

        case 'get_stats':
            handle_get_stats();
            break;

        case 'update_settings':
            handle_update_settings();
            break;

        default:
            nmp_error_response('Invalid action', 400);
    }
} catch (Exception $e) {
    nmp_log_error('API Error: ' . $e->getMessage(), array(
        'action' => $action,
        'trace' => $e->getTraceAsString()
    ));
    nmp_error_response('Internal server error: ' . $e->getMessage(), 500);
}

/**
 * Get a problem for the user
 * GET /api.php?action=get_problem&difficulty=1
 */
function handle_get_problem() {
    $difficulty = isset($_GET['difficulty']) ? (int)$_GET['difficulty'] : null;
    $courseid = nmp_get_current_course_id();
    $userid = nmp_get_current_user_id();

    // If no difficulty specified, determine from user's current level
    if ($difficulty === null) {
        $progress = nmp_get_user_progress($userid, $courseid);
        $difficulty = $progress ? min($progress->current_level, 5) : 1;
    }

    // Get a random problem at the specified difficulty
    $problem = nmp_get_random_problem($courseid, $difficulty);

    if (!$problem) {
        nmp_error_response('No problems available at this difficulty level', 404);
    }

    // Don't send the actual pattern to the client - just metadata
    $response = array(
        'problem_id' => $problem->id,
        'name' => $problem->name,
        'description' => $problem->description,
        'difficulty_level' => $problem->difficulty_level,
        'pattern_length' => $problem->pattern_length,
        'display_duration' => $problem->display_duration,
        'points' => $problem->points,
        'max_attempts' => $problem->max_attempts,
        'time_limit' => $problem->time_limit
    );

    nmp_success_response($response);
}

/**
 * Get the pattern for a specific problem
 * GET /api.php?action=get_pattern&problem_id=123
 */
function handle_get_pattern() {
    $problemid = isset($_GET['problem_id']) ? (int)$_GET['problem_id'] : 0;

    if (!$problemid) {
        nmp_error_response('Problem ID is required', 400);
    }

    $db = nmp_get_db();
    $problem = $db->get_record(NMP_TABLE_PROBLEMS, array('id' => $problemid));

    if (!$problem) {
        nmp_error_response('Problem not found', 404);
    }

    // Return the pattern as an array of individual digits
    $pattern = str_split($problem->pattern);

    nmp_success_response(array(
        'pattern' => $pattern,
        'display_duration' => $problem->display_duration
    ));
}

/**
 * Submit an answer
 * POST /api.php?action=submit_answer
 * Body: { problem_id, user_answer, time_spent }
 */
function handle_submit_answer() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        nmp_error_response('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $validation = nmp_validate_params($input, array('problem_id', 'user_answer', 'time_spent'));
    if ($validation !== true) {
        nmp_error_response($validation, 400);
    }

    $problemid = (int)$input['problem_id'];
    $useranswer = nmp_sanitize_input($input['user_answer']);
    $timespent = (int)$input['time_spent'];
    $userid = nmp_get_current_user_id();

    // Get the problem
    $db = nmp_get_db();
    $problem = $db->get_record(NMP_TABLE_PROBLEMS, array('id' => $problemid));

    if (!$problem) {
        nmp_error_response('Problem not found', 404);
    }

    // Check if answer is correct
    $iscorrect = ($useranswer === $problem->pattern);

    // Count previous attempts for this problem
    $attemptcount = $db->count_records(NMP_TABLE_ATTEMPTS, array(
        'user_id' => $userid,
        'problem_id' => $problemid
    ));

    // Check max attempts limit
    if ($problem->max_attempts !== null && $attemptcount >= $problem->max_attempts) {
        nmp_error_response('Maximum attempts exceeded', 400);
    }

    // Calculate points earned
    $pointsearned = $iscorrect ? $problem->points : 0;

    // Bonus points for speed (if answered in less than half the time limit)
    if ($iscorrect && $problem->time_limit !== null && $timespent < ($problem->time_limit / 2)) {
        $pointsearned = (int)($pointsearned * 1.5);
    }

    // Record the attempt
    $attempt = new stdClass();
    $attempt->user_id = $userid;
    $attempt->problem_id = $problemid;
    $attempt->user_answer = $useranswer;
    $attempt->is_correct = $iscorrect ? 1 : 0;
    $attempt->attempt_number = $attemptcount + 1;
    $attempt->time_spent = $timespent;
    $attempt->points_earned = $pointsearned;
    $attempt->attempted_at = time();

    $attemptid = $db->insert_record(NMP_TABLE_ATTEMPTS, $attempt);

    // Get updated progress (trigger will have updated it)
    $courseid = $problem->course_id;
    $progress = nmp_get_user_progress($userid, $courseid);

    // Update leaderboard if score is significant
    if ($progress && $progress->total_score > 0) {
        nmp_update_leaderboard($courseid);
    }

    // Prepare response
    $response = array(
        'attempt_id' => $attemptid,
        'is_correct' => $iscorrect,
        'correct_pattern' => $problem->pattern,
        'points_earned' => $pointsearned,
        'current_score' => $progress ? $progress->total_score : 0,
        'current_level' => $progress ? $progress->current_level : 1,
        'current_streak' => $progress ? $progress->current_streak : 0,
        'best_streak' => $progress ? $progress->best_streak : 0,
        'accuracy' => $progress ? nmp_calculate_accuracy($progress) : 0
    );

    nmp_success_response($response);
}

/**
 * Get user progress
 * GET /api.php?action=get_progress
 */
function handle_get_progress() {
    $userid = nmp_get_current_user_id();
    $courseid = nmp_get_current_course_id();

    $progress = nmp_get_user_progress($userid, $courseid);

    if (!$progress) {
        // Initialize progress for new user
        $progress = nmp_init_user_progress($userid, $courseid);
    }

    $response = array(
        'current_level' => $progress->current_level,
        'total_score' => $progress->total_score,
        'total_attempts' => $progress->total_attempts,
        'correct_attempts' => $progress->correct_attempts,
        'accuracy' => nmp_calculate_accuracy($progress),
        'current_streak' => $progress->current_streak,
        'best_streak' => $progress->best_streak,
        'total_time_spent' => $progress->total_time_spent,
        'avg_time_per_attempt' => $progress->total_attempts > 0 ?
            round($progress->total_time_spent / $progress->total_attempts, 2) : 0,
        'last_played_at' => $progress->last_played_at
    );

    nmp_success_response($response);
}

/**
 * Get leaderboard
 * GET /api.php?action=get_leaderboard&limit=10
 */
function handle_get_leaderboard() {
    $courseid = nmp_get_current_course_id();
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $limit = min($limit, NMP_MAX_LEADERBOARD_SIZE);

    $leaderboard = nmp_get_leaderboard($courseid, $limit);

    nmp_success_response($leaderboard);
}

/**
 * Get detailed statistics
 * GET /api.php?action=get_stats
 */
function handle_get_stats() {
    $userid = nmp_get_current_user_id();
    $courseid = nmp_get_current_course_id();

    $stats = nmp_get_user_stats($userid, $courseid);

    nmp_success_response($stats);
}

/**
 * Update game settings (admin only)
 * POST /api.php?action=update_settings
 */
function handle_update_settings() {
    global $USER;

    // Check if user has permission (teacher/admin)
    $context = context_course::instance(nmp_get_current_course_id());
    if (!has_capability('moodle/course:update', $context, $USER->id)) {
        nmp_error_response('Permission denied', 403);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        nmp_error_response('Method not allowed', 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $courseid = nmp_get_current_course_id();

    foreach ($input as $key => $value) {
        $type = is_bool($value) ? 'boolean' : (is_numeric($value) ? 'int' : 'string');
        nmp_set_setting($courseid, $key, $value, $type);
    }

    nmp_success_response(array('message' => 'Settings updated successfully'));
}
