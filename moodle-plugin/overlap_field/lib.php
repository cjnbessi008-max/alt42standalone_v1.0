<?php
/**
 * Library of interface functions and constants for module overlap_field
 *
 * @package    mod_overlap_field
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return true | null True if the feature is supported, null otherwise.
 */
function overlap_field_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the overlap_field into the database
 *
 * @param stdClass $overlap_field An object from the form in mod_form.php
 * @param mod_overlap_field_mod_form $mform The form instance
 * @return int The id of the newly inserted overlap_field record
 */
function overlap_field_add_instance(stdClass $overlap_field, mod_overlap_field_mod_form $mform = null) {
    global $DB;

    $overlap_field->timecreated = time();
    $overlap_field->timemodified = $overlap_field->timecreated;

    // Process inequalities if provided as text
    if (isset($overlap_field->inequalities_text)) {
        $inequalities = array_filter(array_map('trim', explode("\n", $overlap_field->inequalities_text)));
        $overlap_field->inequalities = json_encode($inequalities);
    }

    $overlap_field->id = $DB->insert_record('overlap_field', $overlap_field);

    return $overlap_field->id;
}

/**
 * Updates an instance of the overlap_field in the database
 *
 * @param stdClass $overlap_field An object from the form in mod_form.php
 * @param mod_overlap_field_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function overlap_field_update_instance(stdClass $overlap_field, mod_overlap_field_mod_form $mform = null) {
    global $DB;

    $overlap_field->timemodified = time();
    $overlap_field->id = $overlap_field->instance;

    // Process inequalities if provided as text
    if (isset($overlap_field->inequalities_text)) {
        $inequalities = array_filter(array_map('trim', explode("\n", $overlap_field->inequalities_text)));
        $overlap_field->inequalities = json_encode($inequalities);
    }

    return $DB->update_record('overlap_field', $overlap_field);
}

/**
 * Removes an instance of the overlap_field from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function overlap_field_delete_instance($id) {
    global $DB;

    if (!$overlap_field = $DB->get_record('overlap_field', array('id' => $id))) {
        return false;
    }

    // Delete all attempts
    $DB->delete_records('overlap_field_attempts', array('overlap_field_id' => $overlap_field->id));

    // Delete the instance
    $DB->delete_records('overlap_field', array('id' => $overlap_field->id));

    return true;
}

/**
 * Returns the information on whether the module supports a feature
 *
 * @see plugin_supports() in lib/moodlelib.php
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function overlap_field_get_view_actions() {
    return array('view', 'view all');
}

function overlap_field_get_post_actions() {
    return array('submit');
}

/**
 * Get the data for the webapp
 *
 * @param int $id The overlap_field instance ID
 * @return stdClass The data object
 */
function overlap_field_get_problem_data($id) {
    global $DB;

    $overlap_field = $DB->get_record('overlap_field', array('id' => $id), '*', MUST_EXIST);

    $data = new stdClass();
    $data->name = $overlap_field->name;
    $data->intro = $overlap_field->intro;
    $data->inequalities = json_decode($overlap_field->inequalities);
    $data->config = json_decode($overlap_field->visualization_config);

    return $data;
}

/**
 * Save a student's attempt
 *
 * @param int $overlap_field_id The overlap_field instance ID
 * @param int $userid The user ID
 * @param stdClass $answer_data The answer data
 * @return int The attempt ID
 */
function overlap_field_save_attempt($overlap_field_id, $userid, $answer_data) {
    global $DB;

    // Get current attempt number
    $attempts = $DB->count_records('overlap_field_attempts', array(
        'overlap_field_id' => $overlap_field_id,
        'userid' => $userid
    ));

    $attempt = new stdClass();
    $attempt->overlap_field_id = $overlap_field_id;
    $attempt->userid = $userid;
    $attempt->attempt_number = $attempts + 1;
    $attempt->user_answer = json_encode($answer_data);
    $attempt->is_correct = $answer_data->is_correct ?? 0;
    $attempt->score = $answer_data->score ?? null;
    $attempt->timecreated = time();
    $attempt->timecompleted = isset($answer_data->completed) ? time() : null;

    return $DB->insert_record('overlap_field_attempts', $attempt);
}
