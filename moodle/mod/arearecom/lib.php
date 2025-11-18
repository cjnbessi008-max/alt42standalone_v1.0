<?php
/**
 * Library of interface functions and constants for module Area Recombination
 *
 * @package    mod_arearecom
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function arearecom_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
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
 * Saves a new instance of the arearecom into the database
 *
 * @param stdClass $arearecom An object from the form in mod_form.php
 * @param mod_arearecom_mod_form $mform The form instance
 * @return int The id of the newly inserted arearecom record
 */
function arearecom_add_instance(stdClass $arearecom, mod_arearecom_mod_form $mform = null) {
    global $DB;

    $arearecom->timecreated = time();
    $arearecom->timemodified = time();

    // Set default values
    if (!isset($arearecom->difficulty_level)) {
        $arearecom->difficulty_level = 0;
    }
    if (!isset($arearecom->max_attempts)) {
        $arearecom->max_attempts = 5;
    }
    if (!isset($arearecom->enable_hints)) {
        $arearecom->enable_hints = 1;
    }
    if (!isset($arearecom->enable_sound)) {
        $arearecom->enable_sound = 1;
    }

    $arearecom->id = $DB->insert_record('arearecom', $arearecom);

    arearecom_grade_item_update($arearecom);

    return $arearecom->id;
}

/**
 * Updates an instance of the arearecom in the database
 *
 * @param stdClass $arearecom An object from the form in mod_form.php
 * @param mod_arearecom_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function arearecom_update_instance(stdClass $arearecom, mod_arearecom_mod_form $mform = null) {
    global $DB;

    $arearecom->timemodified = time();
    $arearecom->id = $arearecom->instance;

    $result = $DB->update_record('arearecom', $arearecom);

    arearecom_grade_item_update($arearecom);

    return $result;
}

/**
 * Removes an instance of the arearecom from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function arearecom_delete_instance($id) {
    global $DB;

    if (!$arearecom = $DB->get_record('arearecom', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('arearecom', array('id' => $arearecom->id));

    arearecom_grade_item_delete($arearecom);

    return true;
}

/**
 * Returns a small object with summary information about what a
 * user has done with a given particular instance of this module
 *
 * @param stdClass $course The course record
 * @param stdClass $user The user record
 * @param cm_info|stdClass $mod The course module info object or record
 * @param stdClass $arearecom The arearecom instance record
 * @return stdClass|null
 */
function arearecom_user_outline($course, $user, $mod, $arearecom) {
    $return = new stdClass();
    $return->time = 0;
    $return->info = '';
    return $return;
}

/**
 * Prints a detailed representation of what a user has done with
 * a given particular instance of this module, for user activity reports.
 *
 * @param stdClass $course the current course record
 * @param stdClass $user the record of the user we are generating report for
 * @param cm_info $mod course module info
 * @param stdClass $arearecom the module instance record
 * @return void, is supposed to echo directly
 */
function arearecom_user_complete($course, $user, $mod, $arearecom) {
}

/**
 * Given a course and a time, this module should find recent activity
 * that has occurred in arearecom activities and print it out.
 *
 * @param stdClass $course The course record
 * @param bool $viewfullnames Should we display full names
 * @param int $timestart Print activity since this timestamp
 * @return boolean True if anything was printed, otherwise false
 */
function arearecom_print_recent_activity($course, $viewfullnames, $timestart) {
    return false;
}

/**
 * Function to be run periodically according to the moodle cron
 *
 * @return boolean
 */
function arearecom_cron () {
    return true;
}

/**
 * Returns all other caps used in the module
 *
 * @return array
 */
function arearecom_get_extra_capabilities() {
    return array();
}

/**
 * Create/update grade item for given arearecom instance
 *
 * @param stdClass $arearecom Instance object with extra cmidnumber property
 * @param mixed $grades Optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function arearecom_grade_item_update($arearecom, $grades = null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($arearecom->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax'] = 100;
    $item['grademin'] = 0;

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/arearecom', $arearecom->course, 'mod', 'arearecom',
                        $arearecom->id, 0, $grades, $item);
}

/**
 * Delete grade item for given arearecom instance
 *
 * @param stdClass $arearecom Instance object
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, GRADE_UPDATE_MULTIPLE or GRADE_UPDATE_ITEM_LOCKED
 */
function arearecom_grade_item_delete($arearecom) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/arearecom', $arearecom->course, 'mod', 'arearecom',
                        $arearecom->id, 0, null, array('deleted' => 1));
}

/**
 * Update arearecom grades in the gradebook
 *
 * @param stdClass $arearecom Instance object with extra cmidnumber property
 * @param int $userid Update grade of specific user only, 0 means all participants
 * @param boolean $nullifnone If true and the user has no grade then a grade item with rawgrade == null will be inserted
 */
function arearecom_update_grades($arearecom, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($grades = arearecom_get_user_grades($arearecom, $userid)) {
        arearecom_grade_item_update($arearecom, $grades);
    } else if ($userid && $nullifnone) {
        $grade = new stdClass();
        $grade->userid = $userid;
        $grade->rawgrade = null;
        arearecom_grade_item_update($arearecom, $grade);
    } else {
        arearecom_grade_item_update($arearecom);
    }
}

/**
 * Return grade for given user or all users.
 *
 * @param stdClass $arearecom Instance object
 * @param int $userid Optional user id, 0 means all users
 * @return array Array of grades
 */
function arearecom_get_user_grades($arearecom, $userid = 0) {
    // This should query the area_recombination database for user grades
    // For now, return empty array
    return array();
}

/**
 * This function is used by the reset_course_userdata function in moodlelib.
 *
 * @param $data the data submitted from the reset course.
 * @return array status array
 */
function arearecom_reset_userdata($data) {
    return array();
}

/**
 * Serves the files from the arearecom file areas
 *
 * @param stdClass $course the course object
 * @param stdClass $cm the course module object
 * @param stdClass $context the arearecom's context
 * @param string $filearea the name of the file area
 * @param array $args extra arguments (itemid, path)
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 */
function arearecom_pluginfile($course, $cm, $context, $filearea, array $args, $forcedownload, array $options = array()) {
    global $DB, $CFG;

    if ($context->contextlevel != CONTEXT_MODULE) {
        send_file_not_found();
    }

    require_login($course, true, $cm);

    send_file_not_found();
}
