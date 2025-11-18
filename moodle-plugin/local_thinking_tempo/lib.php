<?php
/**
 * Library functions for local_thinking_tempo
 *
 * @package    local_thinking_tempo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Initialize thinking tempo tracker on quiz pages
 *
 * @return void
 */
function local_thinking_tempo_before_footer() {
    global $PAGE, $CFG, $USER;

    // Only load on quiz attempt pages
    if ($PAGE->pagetype !== 'mod-quiz-attempt') {
        return;
    }

    // Check if tracking is enabled for this quiz
    $quizid = optional_param('id', 0, PARAM_INT);
    if (!$quizid) {
        return;
    }

    // Inject JavaScript tracker
    $PAGE->requires->js_call_amd('local_thinking_tempo/tracker', 'init', [
        'quizid' => $quizid,
        'userid' => $USER->id,
        'attemptid' => optional_param('attempt', 0, PARAM_INT),
        'apiurl' => $CFG->wwwroot . '/local/thinking_tempo/api.php'
    ]);
}

/**
 * Get tempo configuration value
 *
 * @param string $key Configuration key
 * @param int|null $quizid Quiz ID (null for global config)
 * @return mixed Configuration value
 */
function local_thinking_tempo_get_config($key, $quizid = null) {
    global $DB;

    $params = ['config_key' => $key];
    if ($quizid !== null) {
        $params['quiz_id'] = $quizid;
    }

    $config = $DB->get_record('mdl_thinking_tempo_config', $params, 'config_value, config_type');

    if (!$config) {
        // Try global config
        $config = $DB->get_record('mdl_thinking_tempo_config',
            ['config_key' => $key, 'quiz_id' => null],
            'config_value, config_type');
    }

    if (!$config) {
        return null;
    }

    // Convert based on type
    switch ($config->config_type) {
        case 'int':
            return (int)$config->config_value;
        case 'float':
            return (float)$config->config_value;
        case 'boolean':
            return $config->config_value === 'true';
        case 'json':
            return json_decode($config->config_value, true);
        default:
            return $config->config_value;
    }
}

/**
 * Start a new thinking tempo session
 *
 * @param int $userid User ID
 * @param int $quizid Quiz ID
 * @param int $questionid Question ID
 * @param int $attemptid Attempt ID
 * @return int Session ID
 */
function local_thinking_tempo_start_session($userid, $quizid, $questionid, $attemptid) {
    global $DB;

    $session = new stdClass();
    $session->userid = $userid;
    $session->quiz_id = $quizid;
    $session->question_id = $questionid;
    $session->attempt_id = $attemptid;
    $session->session_start = round(microtime(true) * 1000000); // Microseconds
    $session->is_completed = 0;
    $session->created_at = time();

    $sessionid = $DB->insert_record('mdl_thinking_tempo_sessions', $session);
    return $sessionid;
}

/**
 * Track an event
 *
 * @param int $sessionid Session ID
 * @param array $event Event data
 * @return int Event ID
 */
function local_thinking_tempo_track_event($sessionid, $event) {
    global $DB;

    // Get session start time
    $session = $DB->get_record('mdl_thinking_tempo_sessions', ['id' => $sessionid], 'session_start');
    if (!$session) {
        throw new moodle_exception('invalidsession', 'local_thinking_tempo');
    }

    $record = new stdClass();
    $record->session_id = $sessionid;
    $record->event_type = $event['type'];
    $record->event_timestamp = round(microtime(true) * 1000000); // Microseconds
    $record->elapsed_time = $record->event_timestamp - $session->session_start;

    // Optional fields
    if (isset($event['data'])) {
        $record->event_data = json_encode($event['data']);
    }
    if (isset($event['elementId'])) {
        $record->element_id = $event['elementId'];
    }
    if (isset($event['elementType'])) {
        $record->element_type = $event['elementType'];
    }
    if (isset($event['x'])) {
        $record->x_position = $event['x'];
    }
    if (isset($event['y'])) {
        $record->y_position = $event['y'];
    }
    if (isset($event['keyCode'])) {
        $record->key_code = $event['keyCode'];
    }
    if (isset($event['keyChar'])) {
        $record->key_char = $event['keyChar'];
    }
    if (isset($event['inputValue'])) {
        $record->input_value = $event['inputValue'];
    }

    $eventid = $DB->insert_record('mdl_thinking_tempo_events', $record);
    return $eventid;
}

/**
 * Close a thinking tempo session
 *
 * @param int $sessionid Session ID
 * @param string|null $finalanswer Final answer
 * @param bool|null $iscorrect Is correct answer
 * @return bool Success
 */
function local_thinking_tempo_close_session($sessionid, $finalanswer = null, $iscorrect = null) {
    global $DB;

    $session = $DB->get_record('mdl_thinking_tempo_sessions', ['id' => $sessionid]);
    if (!$session) {
        return false;
    }

    $update = new stdClass();
    $update->id = $sessionid;
    $update->session_end = round(microtime(true) * 1000000);
    $update->total_duration = $update->session_end - $session->session_start;
    $update->is_completed = 1;

    if ($finalanswer !== null) {
        $update->final_answer = $finalanswer;
    }
    if ($iscorrect !== null) {
        $update->is_correct = $iscorrect ? 1 : 0;
    }

    $DB->update_record('mdl_thinking_tempo_sessions', $update);

    // Trigger async analysis
    local_thinking_tempo_queue_analysis($sessionid);

    return true;
}

/**
 * Queue session for tempo analysis
 *
 * @param int $sessionid Session ID
 * @return void
 */
function local_thinking_tempo_queue_analysis($sessionid) {
    global $CFG;

    // In a production system, this would queue a background job
    // For now, we'll call the Python analysis engine via CLI
    if (file_exists($CFG->dirroot . '/local/thinking_tempo/analysis/trigger.php')) {
        // Queue for analysis (could use Moodle's task API)
        $task = new \local_thinking_tempo\task\analyze_session();
        $task->set_custom_data(['sessionid' => $sessionid]);
        \core\task\manager::queue_adhoc_task($task);
    }
}

/**
 * Get session summary
 *
 * @param int $sessionid Session ID
 * @return object|null Session summary
 */
function local_thinking_tempo_get_session_summary($sessionid) {
    global $DB;

    $sql = "SELECT * FROM {v_thinking_tempo_session_summary} WHERE session_id = ?";
    return $DB->get_record_sql($sql, [$sessionid]);
}

/**
 * Get user thinking profile
 *
 * @param int $userid User ID
 * @param int|null $quizid Quiz ID
 * @return object|null Thinking profile
 */
function local_thinking_tempo_get_user_profile($userid, $quizid = null) {
    global $DB;

    $params = ['userid' => $userid];
    if ($quizid !== null) {
        $params['quiz_id'] = $quizid;
    } else {
        $params['quiz_id'] = null; // Overall profile
    }

    return $DB->get_record('mdl_thinking_tempo_profiles', $params);
}

/**
 * Get tempo map data for visualization
 *
 * @param int $sessionid Session ID
 * @return array Tempo map data
 */
function local_thinking_tempo_get_map_data($sessionid) {
    global $DB;

    $sql = "SELECT * FROM {mdl_thinking_tempo_map_data}
            WHERE session_id = ?
            ORDER BY bucket_start ASC";

    $records = $DB->get_records_sql($sql, [$sessionid]);
    return array_values($records);
}

/**
 * Get detected patterns for a session
 *
 * @param int $sessionid Session ID
 * @return array Detected patterns
 */
function local_thinking_tempo_get_detected_patterns($sessionid) {
    global $DB;

    $sql = "SELECT dp.*, p.pattern_name, p.pattern_type, p.description
            FROM {mdl_thinking_tempo_detected_patterns} dp
            JOIN {mdl_thinking_tempo_patterns} p ON dp.pattern_id = p.id
            WHERE dp.session_id = ?
            ORDER BY dp.confidence_score DESC";

    $records = $DB->get_records_sql($sql, [$sessionid]);
    return array_values($records);
}
