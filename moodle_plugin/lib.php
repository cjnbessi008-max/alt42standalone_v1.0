<?php
// Library functions for Dot Collector module

defined('MOODLE_INTERNAL') || die();

/**
 * List of features supported in Dot Collector module
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function dotcollector_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        default:
            return null;
    }
}

/**
 * Add dotcollector instance
 * @param stdClass $data
 * @param mod_dotcollector_mod_form $mform
 * @return int new dotcollector instance id
 */
function dotcollector_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    return $DB->insert_record('dotcollector', $data);
}

/**
 * Update dotcollector instance
 * @param stdClass $data
 * @param mod_dotcollector_mod_form $mform
 * @return bool true
 */
function dotcollector_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('dotcollector', $data);
}

/**
 * Delete dotcollector instance
 * @param int $id
 * @return bool true
 */
function dotcollector_delete_instance($id) {
    global $DB;

    if (!$dotcollector = $DB->get_record('dotcollector', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('dotcollector', array('id' => $dotcollector->id));

    return true;
}

/**
 * Get external database connection for Dot Collector data
 * @return mysqli database connection
 */
function dotcollector_get_external_db() {
    global $CFG;

    // External database configuration
    // Should be set in Moodle config or plugin settings
    $dbhost = get_config('mod_dotcollector', 'dbhost') ?: 'localhost';
    $dbname = get_config('mod_dotcollector', 'dbname') ?: 'dotcollector';
    $dbuser = get_config('mod_dotcollector', 'dbuser') ?: 'root';
    $dbpass = get_config('mod_dotcollector', 'dbpass') ?: '';

    $conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname);

    if ($conn->connect_error) {
        debugging("Dot Collector DB connection failed: " . $conn->connect_error, DEBUG_DEVELOPER);
        return false;
    }

    $conn->set_charset('utf8mb4');
    return $conn;
}

/**
 * Create session for user
 * @param int $userid Moodle user ID
 * @param int $courseid Moodle course ID
 * @return string session token
 */
function dotcollector_create_session($userid, $courseid) {
    $db = dotcollector_get_external_db();
    if (!$db) {
        return false;
    }

    $token = bin2hex(random_bytes(32));
    $stmt = $db->prepare("INSERT INTO sessions (moodle_user_id, moodle_course_id, session_token) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $userid, $courseid, $token);
    $stmt->execute();
    $stmt->close();
    $db->close();

    return $token;
}

/**
 * Get questions for current session
 * @param int $quizid Optional quiz ID filter
 * @return array questions
 */
function dotcollector_get_questions($quizid = null) {
    $db = dotcollector_get_external_db();
    if (!$db) {
        return array();
    }

    if ($quizid) {
        $stmt = $db->prepare("SELECT * FROM questions WHERE moodle_quiz_id = ? ORDER BY difficulty_level");
        $stmt->bind_param("i", $quizid);
    } else {
        $stmt = $db->prepare("SELECT * FROM questions ORDER BY difficulty_level LIMIT 10");
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $questions = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $db->close();

    return $questions;
}
