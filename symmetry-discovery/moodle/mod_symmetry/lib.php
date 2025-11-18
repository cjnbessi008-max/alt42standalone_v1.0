<?php
/**
 * Library of interface functions and constants
 *
 * @package    mod_symmetry
 * @copyright  2025 Symmetry Discovery
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function symmetry_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the symmetry into the database
 *
 * @param stdClass $symmetry An object from the form
 * @param mod_symmetry_mod_form $mform The form
 * @return int The id of the newly inserted symmetry record
 */
function symmetry_add_instance(stdClass $symmetry, mod_symmetry_mod_form $mform = null) {
    global $DB;

    $symmetry->timecreated = time();
    $symmetry->timemodified = time();

    $symmetry->id = $DB->insert_record('symmetry', $symmetry);

    symmetry_grade_item_update($symmetry);

    return $symmetry->id;
}

/**
 * Updates an instance of the symmetry in the database
 *
 * @param stdClass $symmetry An object from the form
 * @param mod_symmetry_mod_form $mform The form
 * @return boolean Success/Fail
 */
function symmetry_update_instance(stdClass $symmetry, mod_symmetry_mod_form $mform = null) {
    global $DB;

    $symmetry->timemodified = time();
    $symmetry->id = $symmetry->instance;

    $result = $DB->update_record('symmetry', $symmetry);

    symmetry_grade_item_update($symmetry);

    return $result;
}

/**
 * Removes an instance of the symmetry from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function symmetry_delete_instance($id) {
    global $DB;

    if (!$symmetry = $DB->get_record('symmetry', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('symmetry', array('id' => $symmetry->id));

    symmetry_grade_item_delete($symmetry);

    return true;
}

/**
 * Create/update grade item
 *
 * @param stdClass $symmetry object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function symmetry_grade_item_update($symmetry, $grades=null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($symmetry->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax']  = 100;
    $item['grademin']  = 0;

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/symmetry', $symmetry->course, 'mod', 'symmetry',
            $symmetry->id, 0, $grades, $item);
}

/**
 * Delete grade item
 *
 * @param stdClass $symmetry
 * @return int
 */
function symmetry_grade_item_delete($symmetry) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/symmetry', $symmetry->course, 'mod', 'symmetry',
            $symmetry->id, 0, null, array('deleted' => 1));
}

/**
 * Update activity grades
 *
 * @param stdClass $symmetry
 * @param int $userid specific user only, 0 means all
 * @param bool $nullifnone
 */
function symmetry_update_grades($symmetry, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($grades = symmetry_get_user_grades($symmetry, $userid)) {
        symmetry_grade_item_update($symmetry, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid   = $userid;
        $grade->rawgrade = null;
        symmetry_grade_item_update($symmetry, $grade);
    } else {
        symmetry_grade_item_update($symmetry);
    }
}

/**
 * Get user grades
 *
 * @param stdClass $symmetry
 * @param int $userid
 * @return array
 */
function symmetry_get_user_grades($symmetry, $userid = 0) {
    global $DB;

    $grades = array();

    // TODO: Implement actual grade retrieval from symmetry_discovery database
    // This is a placeholder that should be connected to your sym_scores table

    return $grades;
}
