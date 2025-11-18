<?php
/**
 * Number Memory Pulse - Configuration
 * Moodle 3.7 Integration
 * PHP 7.1.9 / MySQL 5.7
 */

defined('MOODLE_INTERNAL') || die();

// Database configuration (uses Moodle's database)
global $CFG, $DB;

// Module constants
define('NMP_VERSION', '1.0.0');
define('NMP_TABLE_PROBLEMS', 'nmp_problems');
define('NMP_TABLE_ATTEMPTS', 'nmp_user_attempts');
define('NMP_TABLE_PROGRESS', 'nmp_user_progress');
define('NMP_TABLE_LEADERBOARD', 'nmp_leaderboard');
define('NMP_TABLE_SETTINGS', 'nmp_settings');

// Game settings
define('NMP_DEFAULT_PATTERN_LENGTH', 3);
define('NMP_DEFAULT_DISPLAY_DURATION', 1500); // milliseconds
define('NMP_DEFAULT_DIFFICULTY', 1);
define('NMP_MAX_LEADERBOARD_SIZE', 100);

// Difficulty levels
define('NMP_DIFFICULTY_EASY', 1);
define('NMP_DIFFICULTY_MEDIUM', 2);
define('NMP_DIFFICULTY_HARD', 3);
define('NMP_DIFFICULTY_EXPERT', 4);
define('NMP_DIFFICULTY_MASTER', 5);

// Points configuration
$NMP_POINTS_CONFIG = array(
    1 => 10,  // Easy
    2 => 15,  // Medium
    3 => 20,  // Hard
    4 => 30,  // Expert
    5 => 50   // Master
);

// Display duration by difficulty
$NMP_DURATION_CONFIG = array(
    1 => 1500, // Easy: 1.5s per number
    2 => 1200, // Medium: 1.2s per number
    3 => 1000, // Hard: 1s per number
    4 => 800,  // Expert: 0.8s per number
    5 => 600   // Master: 0.6s per number
);

/**
 * Get database connection
 * @return object Moodle database object
 */
function nmp_get_db() {
    global $DB;
    return $DB;
}

/**
 * Get current user ID
 * @return int User ID
 */
function nmp_get_current_user_id() {
    global $USER;
    return $USER->id;
}

/**
 * Get current course ID
 * @return int Course ID
 */
function nmp_get_current_course_id() {
    global $COURSE;
    return $COURSE->id;
}

/**
 * Check if user is logged in
 * @return bool
 */
function nmp_require_login() {
    global $USER;
    require_login();
    return isloggedin() && !isguestuser();
}

/**
 * Get module setting
 * @param int $courseid Course ID
 * @param string $name Setting name
 * @param mixed $default Default value
 * @return mixed Setting value
 */
function nmp_get_setting($courseid, $name, $default = null) {
    $db = nmp_get_db();
    $setting = $db->get_record(NMP_TABLE_SETTINGS, array(
        'course_id' => $courseid,
        'setting_name' => $name
    ));

    if (!$setting) {
        return $default;
    }

    // Type conversion based on setting_type
    switch ($setting->setting_type) {
        case 'int':
            return (int)$setting->setting_value;
        case 'boolean':
            return $setting->setting_value === 'true' || $setting->setting_value === '1';
        case 'json':
            return json_decode($setting->setting_value, true);
        default:
            return $setting->setting_value;
    }
}

/**
 * Set module setting
 * @param int $courseid Course ID
 * @param string $name Setting name
 * @param mixed $value Setting value
 * @param string $type Setting type
 * @return bool Success
 */
function nmp_set_setting($courseid, $name, $value, $type = 'string') {
    $db = nmp_get_db();
    $now = time();

    // Convert value based on type
    if ($type === 'json') {
        $value = json_encode($value);
    } elseif ($type === 'boolean') {
        $value = $value ? 'true' : 'false';
    } else {
        $value = (string)$value;
    }

    $existing = $db->get_record(NMP_TABLE_SETTINGS, array(
        'course_id' => $courseid,
        'setting_name' => $name
    ));

    if ($existing) {
        $existing->setting_value = $value;
        $existing->setting_type = $type;
        $existing->updated_at = $now;
        return $db->update_record(NMP_TABLE_SETTINGS, $existing);
    } else {
        $record = new stdClass();
        $record->course_id = $courseid;
        $record->setting_name = $name;
        $record->setting_value = $value;
        $record->setting_type = $type;
        $record->created_at = $now;
        $record->updated_at = $now;
        return $db->insert_record(NMP_TABLE_SETTINGS, $record);
    }
}

/**
 * Log error
 * @param string $message Error message
 * @param array $context Additional context
 */
function nmp_log_error($message, $context = array()) {
    error_log('NMP Error: ' . $message . ' | Context: ' . json_encode($context));
}

/**
 * Log info
 * @param string $message Info message
 * @param array $context Additional context
 */
function nmp_log_info($message, $context = array()) {
    if (debugging('', DEBUG_DEVELOPER)) {
        error_log('NMP Info: ' . $message . ' | Context: ' . json_encode($context));
    }
}

/**
 * Send JSON response
 * @param mixed $data Response data
 * @param int $status HTTP status code
 */
function nmp_json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 * @param string $message Error message
 * @param int $status HTTP status code
 */
function nmp_error_response($message, $status = 400) {
    nmp_json_response(array(
        'success' => false,
        'error' => $message
    ), $status);
}

/**
 * Send success response
 * @param mixed $data Response data
 */
function nmp_success_response($data) {
    nmp_json_response(array(
        'success' => true,
        'data' => $data
    ), 200);
}

/**
 * Validate required parameters
 * @param array $params Parameters to validate
 * @param array $required Required parameter names
 * @return bool|string True if valid, error message otherwise
 */
function nmp_validate_params($params, $required) {
    foreach ($required as $field) {
        if (!isset($params[$field]) || $params[$field] === '') {
            return "Missing required parameter: $field";
        }
    }
    return true;
}

/**
 * Sanitize input
 * @param string $input Input string
 * @return string Sanitized string
 */
function nmp_sanitize_input($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}
