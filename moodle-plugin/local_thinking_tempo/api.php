<?php
/**
 * REST API endpoint for thinking tempo tracking
 *
 * @package    local_thinking_tempo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../../config.php');
require_once(__DIR__ . '/lib.php');

// CORS headers for cross-domain requests if needed
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Require login
require_login();

$action = required_param('action', PARAM_ALPHA);

try {
    switch ($action) {
        case 'start_session':
            handle_start_session();
            break;

        case 'track_event':
            handle_track_event();
            break;

        case 'close_session':
            handle_close_session();
            break;

        case 'get_session':
            handle_get_session();
            break;

        case 'get_tempo_map':
            handle_get_tempo_map();
            break;

        case 'get_profile':
            handle_get_profile();
            break;

        case 'get_patterns':
            handle_get_patterns();
            break;

        default:
            throw new moodle_exception('invalidaction', 'local_thinking_tempo');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Handle start session request
 */
function handle_start_session() {
    global $USER;

    $quizid = required_param('quizid', PARAM_INT);
    $questionid = required_param('questionid', PARAM_INT);
    $attemptid = required_param('attemptid', PARAM_INT);

    $sessionid = local_thinking_tempo_start_session($USER->id, $quizid, $questionid, $attemptid);

    echo json_encode([
        'success' => true,
        'sessionid' => $sessionid,
        'timestamp' => round(microtime(true) * 1000000)
    ]);
}

/**
 * Handle track event request
 */
function handle_track_event() {
    $sessionid = required_param('sessionid', PARAM_INT);
    $eventjson = required_param('event', PARAM_RAW);

    $event = json_decode($eventjson, true);
    if (!$event) {
        throw new moodle_exception('invalidevent', 'local_thinking_tempo');
    }

    // Check sampling rate
    $samplingrate = local_thinking_tempo_get_config('event_sampling_rate', null);
    if ($samplingrate < 1.0 && (mt_rand() / mt_getrandmax()) > $samplingrate) {
        // Skip this event based on sampling
        echo json_encode(['success' => true, 'sampled' => true]);
        return;
    }

    $eventid = local_thinking_tempo_track_event($sessionid, $event);

    echo json_encode([
        'success' => true,
        'eventid' => $eventid,
        'sampled' => false
    ]);
}

/**
 * Handle close session request
 */
function handle_close_session() {
    $sessionid = required_param('sessionid', PARAM_INT);
    $finalanswer = optional_param('finalanswer', null, PARAM_RAW);
    $iscorrect = optional_param('iscorrect', null, PARAM_BOOL);

    $success = local_thinking_tempo_close_session($sessionid, $finalanswer, $iscorrect);

    echo json_encode([
        'success' => $success
    ]);
}

/**
 * Handle get session request
 */
function handle_get_session() {
    $sessionid = required_param('sessionid', PARAM_INT);

    $session = local_thinking_tempo_get_session_summary($sessionid);

    echo json_encode([
        'success' => true,
        'session' => $session
    ]);
}

/**
 * Handle get tempo map request
 */
function handle_get_tempo_map() {
    $sessionid = required_param('sessionid', PARAM_INT);

    $mapdata = local_thinking_tempo_get_map_data($sessionid);

    echo json_encode([
        'success' => true,
        'data' => $mapdata
    ]);
}

/**
 * Handle get profile request
 */
function handle_get_profile() {
    global $USER;

    $userid = optional_param('userid', $USER->id, PARAM_INT);
    $quizid = optional_param('quizid', null, PARAM_INT);

    // Check permission
    if ($userid != $USER->id && !has_capability('local/thinking_tempo:viewallprofiles', context_system::instance())) {
        throw new moodle_exception('nopermission', 'local_thinking_tempo');
    }

    $profile = local_thinking_tempo_get_user_profile($userid, $quizid);

    echo json_encode([
        'success' => true,
        'profile' => $profile
    ]);
}

/**
 * Handle get patterns request
 */
function handle_get_patterns() {
    $sessionid = required_param('sessionid', PARAM_INT);

    $patterns = local_thinking_tempo_get_detected_patterns($sessionid);

    echo json_encode([
        'success' => true,
        'patterns' => $patterns
    ]);
}
