<?php
/**
 * Library of interface functions and constants for module cognitiveload
 *
 * @package    mod_cognitiveload
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Supported features
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function cognitiveload_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return false;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the cognitiveload into the database
 *
 * @param stdClass $data An object from the form in mod_form.php
 * @param mod_cognitiveload_mod_form $mform The form instance
 * @return int The id of the newly inserted cognitiveload record
 */
function cognitiveload_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $id = $DB->insert_record('cognitiveload', $data);

    return $id;
}

/**
 * Updates an instance of the cognitiveload in the database
 *
 * @param stdClass $data An object from the form in mod_form.php
 * @param mod_cognitiveload_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function cognitiveload_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('cognitiveload', $data);
}

/**
 * Removes an instance of the cognitiveload from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function cognitiveload_delete_instance($id) {
    global $DB;

    if (!$cogload = $DB->get_record('cognitiveload', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('cognitiveload', array('id' => $cogload->id));

    return true;
}

/**
 * Hook to analyze questions when they are created or modified
 *
 * @param object $question The question object
 */
function cognitiveload_analyze_question($question) {
    require_once(__DIR__ . '/classes/api_client.php');

    $api_client = new \mod_cognitiveload\api_client();
    $result = $api_client->analyze_question($question);

    return $result;
}

/**
 * Get cognitive load score for a question
 *
 * @param int $questionid The question ID
 * @return object|null The cognitive load data or null
 */
function cognitiveload_get_score($questionid) {
    global $DB;

    return $DB->get_record('cogload_cache', array('questionid' => $questionid));
}

/**
 * Batch analyze questions
 *
 * @param array $questions Array of question objects
 * @return array Analysis results
 */
function cognitiveload_batch_analyze($questions) {
    require_once(__DIR__ . '/classes/api_client.php');

    $api_client = new \mod_cognitiveload\api_client();
    return $api_client->batch_analyze($questions);
}
