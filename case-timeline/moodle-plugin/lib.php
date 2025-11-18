<?php
/**
 * Library of interface functions and constants for module casetimeline
 *
 * @package    mod_casetimeline
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Supported features
 */
function casetimeline_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the casetimeline into the database
 *
 * @param stdClass $casetimeline An object from the form
 * @param mod_casetimeline_mod_form $mform The form
 * @return int The id of the newly inserted casetimeline record
 */
function casetimeline_add_instance(stdClass $casetimeline, mod_casetimeline_mod_form $mform = null) {
    global $DB;

    $casetimeline->timecreated = time();
    $casetimeline->timemodified = time();

    $casetimeline->id = $DB->insert_record('casetimeline', $casetimeline);

    casetimeline_grade_item_update($casetimeline);

    return $casetimeline->id;
}

/**
 * Updates an instance of the casetimeline in the database
 *
 * @param stdClass $casetimeline An object from the form
 * @param mod_casetimeline_mod_form $mform The form
 * @return boolean Success/Fail
 */
function casetimeline_update_instance(stdClass $casetimeline, mod_casetimeline_mod_form $mform = null) {
    global $DB;

    $casetimeline->timemodified = time();
    $casetimeline->id = $casetimeline->instance;

    $result = $DB->update_record('casetimeline', $casetimeline);

    casetimeline_grade_item_update($casetimeline);

    return $result;
}

/**
 * Removes an instance of the casetimeline from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function casetimeline_delete_instance($id) {
    global $DB;

    if (!$casetimeline = $DB->get_record('casetimeline', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('casetimeline', array('id' => $casetimeline->id));

    casetimeline_grade_item_delete($casetimeline);

    return true;
}

/**
 * Create/update grade item
 *
 * @param stdClass $casetimeline
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function casetimeline_grade_item_update($casetimeline, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($casetimeline->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;

    if ($casetimeline->grade > 0) {
        $item['gradetype'] = GRADE_TYPE_VALUE;
        $item['grademax']  = $casetimeline->grade;
        $item['grademin']  = 0;
    } else {
        $item['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/casetimeline', $casetimeline->course, 'mod', 'casetimeline',
                        $casetimeline->id, 0, $grades, $item);
}

/**
 * Delete grade item
 *
 * @param stdClass $casetimeline
 * @return int
 */
function casetimeline_grade_item_delete($casetimeline) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/casetimeline', $casetimeline->course, 'mod', 'casetimeline',
                        $casetimeline->id, 0, null, array('deleted' => 1));
}

/**
 * Update activity grades
 *
 * @param stdClass $casetimeline
 * @param int $userid specific user only, 0 means all
 * @param boolean $nullifnone return null if grade does not exist
 * @return void
 */
function casetimeline_update_grades($casetimeline, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($casetimeline->grade == 0) {
        casetimeline_grade_item_update($casetimeline);
    } else if ($grades = casetimeline_get_user_grades($casetimeline, $userid)) {
        casetimeline_grade_item_update($casetimeline, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        casetimeline_grade_item_update($casetimeline, $grade);
    } else {
        casetimeline_grade_item_update($casetimeline);
    }
}

/**
 * Get user grades
 *
 * @param stdClass $casetimeline
 * @param int $userid
 * @return array
 */
function casetimeline_get_user_grades($casetimeline, $userid = 0) {
    global $DB;

    // This would connect to the Case Timeline database
    // For now, return empty array
    // TODO: Implement connection to ct_user_progress table

    return array();
}

/**
 * Return a small object with summary information about what a user has done
 *
 * @param stdClass $course
 * @param stdClass $user
 * @param stdClass $mod
 * @param stdClass $casetimeline
 * @return stdClass|null
 */
function casetimeline_user_outline($course, $user, $mod, $casetimeline) {
    global $DB;

    // TODO: Implement connection to ct_user_progress table

    return null;
}

/**
 * Print a detailed representation of what a user has done
 *
 * @param stdClass $course
 * @param stdClass $user
 * @param stdClass $mod
 * @param stdClass $casetimeline
 * @return void
 */
function casetimeline_user_complete($course, $user, $mod, $casetimeline) {
    // TODO: Implement detailed user progress display
    return true;
}
