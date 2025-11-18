<?php
/**
 * Library of interface functions and constants for module problemexplain
 *
 * @package    mod_problemexplain
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * List of features supported in Problem Explanation module
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function problemexplain_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return false;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_COMPLETION_TRACKS_VIEWS:
            return true;
        case FEATURE_GROUPS:
            return false;
        case FEATURE_GROUPINGS:
            return false;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the problemexplain into the database
 *
 * @param stdClass $problemexplain An object from the form in mod_form.php
 * @param mod_problemexplain_mod_form $mform The form instance
 * @return int The id of the newly inserted problemexplain record
 */
function problemexplain_add_instance($problemexplain, $mform = null) {
    global $DB;

    $problemexplain->timecreated = time();
    $problemexplain->timemodified = time();

    // You may have to add extra stuff in here.
    $problemexplain->id = $DB->insert_record('problemexplain', $problemexplain);

    problemexplain_grade_item_update($problemexplain);

    return $problemexplain->id;
}

/**
 * Updates an instance of the problemexplain in the database
 *
 * @param stdClass $problemexplain An object from the form in mod_form.php
 * @param mod_problemexplain_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function problemexplain_update_instance($problemexplain, $mform = null) {
    global $DB;

    $problemexplain->timemodified = time();
    $problemexplain->id = $problemexplain->instance;

    $result = $DB->update_record('problemexplain', $problemexplain);

    problemexplain_grade_item_update($problemexplain);

    return $result;
}

/**
 * Removes an instance of the problemexplain from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function problemexplain_delete_instance($id) {
    global $DB;

    if (!$problemexplain = $DB->get_record('problemexplain', array('id' => $id))) {
        return false;
    }

    // Delete all related records.
    $DB->delete_records('problemexplain_submissions', array('problemexplain_id' => $problemexplain->id));
    $DB->delete_records('problemexplain', array('id' => $problemexplain->id));

    problemexplain_grade_item_delete($problemexplain);

    return true;
}

/**
 * Create/update grade item for given problem explanation activity
 *
 * @param stdClass $problemexplain object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function problemexplain_grade_item_update($problemexplain, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($problemexplain->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax'] = $problemexplain->grade;
    $item['grademin'] = 0;

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/problemexplain', $problemexplain->course, 'mod', 'problemexplain',
            $problemexplain->id, 0, $grades, $item);
}

/**
 * Delete grade item for given problem explanation activity
 *
 * @param stdClass $problemexplain object
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, GRADE_UPDATE_MULTIPLE or GRADE_UPDATE_ITEM_LOCKED
 */
function problemexplain_grade_item_delete($problemexplain) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/problemexplain', $problemexplain->course, 'mod', 'problemexplain',
            $problemexplain->id, 0, null, array('deleted' => 1));
}

/**
 * Update grades in central gradebook
 *
 * @param stdClass $problemexplain
 * @param int $userid specific user only, 0 means all
 * @param bool $nullifnone
 */
function problemexplain_update_grades($problemexplain, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($userid != 0) {
        $grade = problemexplain_get_user_grade($problemexplain, $userid);
        problemexplain_grade_item_update($problemexplain, $grade);
    } else {
        $grades = problemexplain_get_user_grades($problemexplain);
        problemexplain_grade_item_update($problemexplain, $grades);
    }
}

/**
 * Get user's grade for a problem explanation activity
 *
 * @param stdClass $problemexplain
 * @param int $userid
 * @return stdClass|null
 */
function problemexplain_get_user_grade($problemexplain, $userid) {
    global $DB;

    $sql = "SELECT g.*, s.userid
            FROM {problemexplain_submissions} s
            JOIN {problemexplain_grades} g ON g.submission_id = s.id
            WHERE s.problemexplain_id = :problemexplainid
            AND s.userid = :userid";

    $grade = $DB->get_record_sql($sql, array(
        'problemexplainid' => $problemexplain->id,
        'userid' => $userid
    ));

    if ($grade) {
        $grade->rawgrade = $grade->grade;
        return $grade;
    }

    return null;
}

/**
 * Get all users' grades for a problem explanation activity
 *
 * @param stdClass $problemexplain
 * @return array
 */
function problemexplain_get_user_grades($problemexplain) {
    global $DB;

    $sql = "SELECT g.*, s.userid
            FROM {problemexplain_submissions} s
            JOIN {problemexplain_grades} g ON g.submission_id = s.id
            WHERE s.problemexplain_id = :problemexplainid";

    $grades = $DB->get_records_sql($sql, array('problemexplainid' => $problemexplain->id));

    $return = array();
    foreach ($grades as $grade) {
        $grade->rawgrade = $grade->grade;
        $return[$grade->userid] = $grade;
    }

    return $return;
}

/**
 * Returns the user outline of a user's interaction with the problem explanation activity
 *
 * @param stdClass $course
 * @param stdClass $user
 * @param stdClass $mod
 * @param stdClass $problemexplain
 * @return stdClass|null
 */
function problemexplain_user_outline($course, $user, $mod, $problemexplain) {
    global $DB;

    $submission = $DB->get_record('problemexplain_submissions', array(
        'problemexplain_id' => $problemexplain->id,
        'userid' => $user->id
    ));

    if ($submission) {
        $result = new stdClass();
        $result->info = get_string('submitted', 'problemexplain');
        $result->time = $submission->timesubmitted;
        return $result;
    }

    return null;
}

/**
 * Print a detailed representation of what a user has done with the problem explanation activity
 *
 * @param stdClass $course
 * @param stdClass $user
 * @param stdClass $mod
 * @param stdClass $problemexplain
 */
function problemexplain_user_complete($course, $user, $mod, $problemexplain) {
    global $DB, $OUTPUT;

    $submission = $DB->get_record('problemexplain_submissions', array(
        'problemexplain_id' => $problemexplain->id,
        'userid' => $user->id
    ));

    if ($submission) {
        echo $OUTPUT->box_start();
        echo get_string('status') . ': ' . $submission->status . '<br>';
        echo get_string('timesubmitted', 'problemexplain') . ': ' . userdate($submission->timesubmitted) . '<br>';

        $steps = $DB->count_records('problemexplain_steps', array('submission_id' => $submission->id));
        echo get_string('numberofsteps', 'problemexplain') . ': ' . $steps . '<br>';

        $grade = $DB->get_record('problemexplain_grades', array('submission_id' => $submission->id));
        if ($grade) {
            echo get_string('grade') . ': ' . $grade->grade . ' / ' . $problemexplain->grade . '<br>';
        }

        echo $OUTPUT->box_end();
    } else {
        echo get_string('nosubmission', 'problemexplain');
    }
}

/**
 * This function extends the navigation menu for the site
 *
 * @param navigation_node $navigation The navigation node to extend
 * @param stdClass $course The course to extend
 * @param stdClass $module The module to extend
 * @param cm_info $cm
 */
function problemexplain_extend_navigation($navigation, $course, $module, $cm) {
    global $USER, $DB;

    $problemexplain = $DB->get_record('problemexplain', array('id' => $cm->instance));

    // Add student-specific links
    if (has_capability('mod/problemexplain:submit', context_module::instance($cm->id))) {
        $navigation->add(
            get_string('myexplanation', 'problemexplain'),
            new moodle_url('/mod/problemexplain/view.php', array('id' => $cm->id)),
            navigation_node::TYPE_SETTING
        );

        if ($problemexplain->enable_peer_review) {
            $navigation->add(
                get_string('peerreview', 'problemexplain'),
                new moodle_url('/mod/problemexplain/peer_review.php', array('id' => $cm->id)),
                navigation_node::TYPE_SETTING
            );
        }
    }

    // Add teacher-specific links
    if (has_capability('mod/problemexplain:grade', context_module::instance($cm->id))) {
        $navigation->add(
            get_string('allsubmissions', 'problemexplain'),
            new moodle_url('/mod/problemexplain/submissions.php', array('id' => $cm->id)),
            navigation_node::TYPE_SETTING
        );
    }
}
