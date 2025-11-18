<?php
/**
 * Library of interface functions and constants for mod_coreconditions
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Supported features
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function coreconditions_supports($feature) {
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
 * Saves a new instance of the coreconditions into the database
 *
 * @param stdClass $coreconditions An object from the form
 * @param mod_coreconditions_mod_form $mform The form
 * @return int The id of the newly inserted coreconditions record
 */
function coreconditions_add_instance(stdClass $coreconditions, mod_coreconditions_mod_form $mform = null) {
    global $DB;

    $coreconditions->timecreated = time();
    $coreconditions->timemodified = time();

    $coreconditions->id = $DB->insert_record('coreconditions', $coreconditions);

    coreconditions_grade_item_update($coreconditions);

    return $coreconditions->id;
}

/**
 * Updates an instance of the coreconditions in the database
 *
 * @param stdClass $coreconditions An object from the form
 * @param mod_coreconditions_mod_form $mform The form
 * @return boolean Success/Fail
 */
function coreconditions_update_instance(stdClass $coreconditions, mod_coreconditions_mod_form $mform = null) {
    global $DB;

    $coreconditions->timemodified = time();
    $coreconditions->id = $coreconditions->instance;

    $result = $DB->update_record('coreconditions', $coreconditions);

    coreconditions_grade_item_update($coreconditions);

    return $result;
}

/**
 * Removes an instance of the coreconditions from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function coreconditions_delete_instance($id) {
    global $DB;

    if (!$coreconditions = $DB->get_record('coreconditions', array('id' => $id))) {
        return false;
    }

    // Delete all dependent records
    $DB->delete_records('coreconditions_attempts', array('problem_id' => $id));
    $DB->delete_records('coreconditions_conditions', array('problem_id' => $id));
    $DB->delete_records('coreconditions_problems', array('coreconditions_id' => $id));
    $DB->delete_records('coreconditions', array('id' => $id));

    coreconditions_grade_item_delete($coreconditions);

    return true;
}

/**
 * Create/update grade item for given coreconditions
 *
 * @param stdClass $coreconditions object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok
 */
function coreconditions_grade_item_update($coreconditions, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = array('itemname' => $coreconditions->name);

    if (isset($coreconditions->grade) && $coreconditions->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax']  = $coreconditions->grade;
        $params['grademin']  = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/coreconditions', $coreconditions->course, 'mod', 'coreconditions',
                        $coreconditions->id, 0, $grades, $params);
}

/**
 * Delete grade item for given coreconditions
 *
 * @param stdClass $coreconditions object
 * @return int
 */
function coreconditions_grade_item_delete($coreconditions) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/coreconditions', $coreconditions->course, 'mod', 'coreconditions',
                        $coreconditions->id, 0, null, array('deleted' => 1));
}

/**
 * Update grades in gradebook
 *
 * @param stdClass $coreconditions
 * @param int $userid specific user only, 0 means all
 * @param bool $nullifnone
 */
function coreconditions_update_grades($coreconditions, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($grades = coreconditions_get_user_grades($coreconditions, $userid)) {
        coreconditions_grade_item_update($coreconditions, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        coreconditions_grade_item_update($coreconditions, $grade);
    } else {
        coreconditions_grade_item_update($coreconditions);
    }
}

/**
 * Return grade for given user
 *
 * @param stdClass $coreconditions
 * @param int $userid
 * @return array
 */
function coreconditions_get_user_grades($coreconditions, $userid = 0) {
    global $DB;

    $sql = "SELECT a.userid, AVG(a.partial_score) as rawgrade
            FROM {coreconditions_problems} p
            JOIN {coreconditions_attempts} a ON a.problem_id = p.id
            WHERE p.coreconditions_id = :coreconditionsid";

    $params = array('coreconditionsid' => $coreconditions->id);

    if ($userid) {
        $sql .= " AND a.userid = :userid";
        $params['userid'] = $userid;
    }

    $sql .= " GROUP BY a.userid";

    return $DB->get_records_sql($sql, $params);
}
