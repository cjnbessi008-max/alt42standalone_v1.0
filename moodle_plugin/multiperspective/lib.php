<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for Multi-Perspective Practice module
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * List of features supported in Multi-Perspective Practice module
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function multiperspective_supports($feature) {
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
        case FEATURE_COMPLETION_HAS_RULES:
            return true;
        case FEATURE_GRADE_OUTCOMES:
            return true;
        case FEATURE_GROUPINGS:
            return true;
        case FEATURE_GROUPS:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the multiperspective into the database
 *
 * @param stdClass $multiperspective An object from the form in mod_form.php
 * @param mod_multiperspective_mod_form $mform
 * @return int The id of the newly inserted multiperspective record
 */
function multiperspective_add_instance(stdClass $multiperspective, mod_multiperspective_mod_form $mform = null) {
    global $DB;

    $multiperspective->timecreated = time();
    $multiperspective->timemodified = time();

    $multiperspective->id = $DB->insert_record('multiperspective', $multiperspective);

    multiperspective_grade_item_update($multiperspective);

    return $multiperspective->id;
}

/**
 * Updates an instance of the multiperspective in the database
 *
 * @param stdClass $multiperspective An object from the form in mod_form.php
 * @param mod_multiperspective_mod_form $mform
 * @return boolean Success/Fail
 */
function multiperspective_update_instance(stdClass $multiperspective, mod_multiperspective_mod_form $mform = null) {
    global $DB;

    $multiperspective->timemodified = time();
    $multiperspective->id = $multiperspective->instance;

    $result = $DB->update_record('multiperspective', $multiperspective);

    multiperspective_grade_item_update($multiperspective);

    return $result;
}

/**
 * Removes an instance of the multiperspective from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function multiperspective_delete_instance($id) {
    global $DB;

    if (!$multiperspective = $DB->get_record('multiperspective', array('id' => $id))) {
        return false;
    }

    // Delete all related problems and their perspectives
    $problems = $DB->get_records('multiperspective_problems', array('multiperspectiveid' => $id));
    foreach ($problems as $problem) {
        $DB->delete_records('multiperspective_persp', array('problemid' => $problem->id));
        $DB->delete_records('multiperspective_attempts', array('problemid' => $problem->id));
        $DB->delete_records('multiperspective_views', array('problemid' => $problem->id));
    }
    $DB->delete_records('multiperspective_problems', array('multiperspectiveid' => $id));

    // Delete attempts related to this activity
    $DB->delete_records('multiperspective_attempts', array('multiperspectiveid' => $id));

    // Delete the instance
    $DB->delete_records('multiperspective', array('id' => $id));

    multiperspective_grade_item_delete($multiperspective);

    return true;
}

/**
 * Return a small object with summary information about what a user has done
 * with a given particular instance of this module
 *
 * @param stdClass $course The course record
 * @param stdClass $user The user record
 * @param cm_info|stdClass $mod The course module info object or record
 * @param stdClass $multiperspective The multiperspective instance record
 * @return stdClass|null
 */
function multiperspective_user_outline($course, $user, $mod, $multiperspective) {
    global $DB;

    $attempts = $DB->count_records('multiperspective_attempts', array(
        'multiperspectiveid' => $multiperspective->id,
        'userid' => $user->id
    ));

    if ($attempts) {
        $result = new stdClass();
        $result->info = get_string('attempts', 'mod_multiperspective') . ': ' . $attempts;

        $lastrecord = $DB->get_record_sql(
            'SELECT MAX(timecreated) as lasttime FROM {multiperspective_attempts}
             WHERE multiperspectiveid = ? AND userid = ?',
            array($multiperspective->id, $user->id)
        );

        if ($lastrecord) {
            $result->time = $lastrecord->lasttime;
        }

        return $result;
    }

    return null;
}

/**
 * Prints a detailed representation of what a user has done with a given particular instance of this module
 *
 * @param stdClass $course the current course record
 * @param stdClass $user the record of the user we are generating report for
 * @param cm_info $mod course module info
 * @param stdClass $multiperspective the module instance record
 * @return void
 */
function multiperspective_user_complete($course, $user, $mod, $multiperspective) {
    global $DB, $OUTPUT;

    $attempts = $DB->get_records('multiperspective_attempts', array(
        'multiperspectiveid' => $multiperspective->id,
        'userid' => $user->id
    ), 'timecreated DESC');

    if ($attempts) {
        echo $OUTPUT->heading(get_string('attempts', 'mod_multiperspective') . ': ' . count($attempts), 3);

        foreach ($attempts as $attempt) {
            $problem = $DB->get_record('multiperspective_problems', array('id' => $attempt->problemid));
            echo '<p>';
            echo '<strong>' . $problem->title . '</strong><br>';
            echo get_string('score', 'mod_multiperspective') . ': ' . round($attempt->score, 2) . '<br>';
            echo get_string('timespent', 'mod_multiperspective') . ': ' . format_time($attempt->time_spent) . '<br>';
            echo userdate($attempt->timecreated);
            echo '</p>';
        }
    } else {
        echo '<p>' . get_string('noattempts', 'mod_multiperspective') . '</p>';
    }
}

/**
 * Create grade item for given multiperspective instance
 *
 * @param stdClass $multiperspective instance with extra cmidnumber and modname property
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function multiperspective_grade_item_update($multiperspective, $grades = null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($multiperspective->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax'] = $multiperspective->grade;
    $item['grademin'] = 0;

    if ($grades === 'reset') {
        $item['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/multiperspective', $multiperspective->course, 'mod', 'multiperspective',
                        $multiperspective->id, 0, $grades, $item);
}

/**
 * Delete grade item for given multiperspective instance
 *
 * @param stdClass $multiperspective instance
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, etc.
 */
function multiperspective_grade_item_delete($multiperspective) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/multiperspective', $multiperspective->course, 'mod', 'multiperspective',
                        $multiperspective->id, 0, null, array('deleted' => 1));
}

/**
 * Update multiperspective grades in the gradebook
 *
 * @param stdClass $multiperspective instance
 * @param int $userid Update grade of specific user only, 0 means all participants
 * @param bool $nullifnone If true and the user has no grade then a grade item with rawgrade == null will be inserted
 */
function multiperspective_update_grades($multiperspective, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($userid != 0) {
        $grade = multiperspective_get_user_grade($multiperspective, $userid);
        if ($grade || $nullifnone) {
            multiperspective_grade_item_update($multiperspective, $grade);
        }
    } else {
        $sql = "SELECT userid, MAX(score) as finalgrade
                FROM {multiperspective_attempts}
                WHERE multiperspectiveid = ?
                GROUP BY userid";

        $grades = $DB->get_records_sql($sql, array($multiperspective->id));

        if ($grades) {
            multiperspective_grade_item_update($multiperspective, $grades);
        } else {
            multiperspective_grade_item_update($multiperspective);
        }
    }
}

/**
 * Get user grade for a multiperspective instance
 *
 * @param stdClass $multiperspective The multiperspective instance
 * @param int $userid The user ID
 * @return stdClass|false The grade object or false
 */
function multiperspective_get_user_grade($multiperspective, $userid) {
    global $DB;

    $sql = "SELECT userid, MAX(score) as rawgrade
            FROM {multiperspective_attempts}
            WHERE multiperspectiveid = ? AND userid = ?
            GROUP BY userid";

    return $DB->get_record_sql($sql, array($multiperspective->id, $userid));
}

/**
 * Return the list of view actions
 *
 * @return array
 */
function multiperspective_get_view_actions() {
    return array('view', 'view all');
}

/**
 * Return the list of post actions
 *
 * @return array
 */
function multiperspective_get_post_actions() {
    return array('submit', 'update');
}

/**
 * Extend navigation
 *
 * @param navigation_node $multiperspectivenode
 * @param stdClass $course
 * @param stdClass $multiperspective
 * @param cm_info $cm
 */
function multiperspective_extend_navigation($multiperspectivenode, $course, $multiperspective, $cm) {
    global $PAGE;

    if (has_capability('mod/multiperspective:manage', $PAGE->cm->context)) {
        $url = new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $cm->id));
        $multiperspectivenode->add(get_string('manage', 'mod_multiperspective'), $url,
            navigation_node::TYPE_SETTING, null, null, new pix_icon('i/settings', ''));
    }

    if (has_capability('mod/multiperspective:viewreports', $PAGE->cm->context)) {
        $url = new moodle_url('/mod/multiperspective/reports.php', array('id' => $cm->id));
        $multiperspectivenode->add(get_string('reports', 'mod_multiperspective'), $url,
            navigation_node::TYPE_SETTING, null, null, new pix_icon('i/report', ''));
    }
}

/**
 * Extend settings navigation
 *
 * @param settings_navigation $settings
 * @param navigation_node $multiperspectivenode
 */
function multiperspective_extend_settings_navigation($settings, $multiperspectivenode) {
    global $PAGE;

    if (has_capability('mod/multiperspective:manage', $PAGE->cm->context)) {
        $url = new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $PAGE->cm->id));
        $multiperspectivenode->add(get_string('addproblem', 'mod_multiperspective'), $url);
    }
}
