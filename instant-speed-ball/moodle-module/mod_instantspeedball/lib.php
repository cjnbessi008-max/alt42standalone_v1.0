<?php
/**
 * Instant Speed Ball - Moodle Activity Module
 * Library functions
 *
 * @package    mod_instantspeedball
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param object $instance An object from the form in mod_form.php
 * @return int The id of the newly inserted instantspeedball record
 */
function instantspeedball_add_instance($instance) {
    global $DB;

    $instance->timecreated = time();
    $instance->timemodified = time();

    return $DB->insert_record('instantspeedball', $instance);
}

/**
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will update an existing instance with new data.
 *
 * @param object $instance An object from the form in mod_form.php
 * @return boolean Success/Fail
 */
function instantspeedball_update_instance($instance) {
    global $DB;

    $instance->timemodified = time();
    $instance->id = $instance->instance;

    return $DB->update_record('instantspeedball', $instance);
}

/**
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function instantspeedball_delete_instance($id) {
    global $DB;

    if (!$instantspeedball = $DB->get_record('instantspeedball', array('id' => $id))) {
        return false;
    }

    // Delete any dependent records here
    $DB->delete_records('instantspeedball', array('id' => $instantspeedball->id));

    return true;
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 * Used for user activity reports.
 *
 * @param object $course
 * @param object $user
 * @param object $mod
 * @param object $instantspeedball
 * @return object|null
 */
function instantspeedball_user_outline($course, $user, $mod, $instantspeedball) {
    global $DB;

    // Get student attempts
    $sql = "SELECT COUNT(*) as attempts,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM {isb_student_attempts}
            WHERE student_id = :userid";

    $result = $DB->get_record_sql($sql, array('userid' => $user->id));

    if ($result && $result->attempts > 0) {
        $info = new stdClass();
        $info->info = get_string('attempts', 'mod_instantspeedball') . ': ' . $result->attempts .
                      ' (' . get_string('correct', 'mod_instantspeedball') . ': ' . $result->correct . ')';
        return $info;
    }

    return null;
}

/**
 * Returns all activity in instantspeedball since a given time
 *
 * @param array $activities sequentially indexed array of objects
 * @param int $index
 * @param int $timestart
 * @param int $courseid
 * @param int $cmid
 * @param int $userid defaults to 0
 * @param int $groupid defaults to 0
 * @return void
 */
function instantspeedball_get_recent_mod_activity(&$activities, &$index, $timestart, $courseid, $cmid, $userid=0, $groupid=0) {
    // No implementation needed for basic version
}

/**
 * Supported features
 *
 * @uses FEATURE_GROUPS
 * @uses FEATURE_GROUPINGS
 * @uses FEATURE_MOD_INTRO
 * @uses FEATURE_COMPLETION_TRACKS_VIEWS
 * @uses FEATURE_GRADE_HAS_GRADE
 * @uses FEATURE_GRADE_OUTCOMES
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, null if doesn't know
 */
function instantspeedball_supports($feature) {
    switch($feature) {
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return false;
        case FEATURE_GRADE_OUTCOMES:
            return false;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;

        default:
            return null;
    }
}
