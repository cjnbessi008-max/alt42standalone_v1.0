<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for module slopeheatmap
 *
 * @package    mod_slopeheatmap
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
function slopeheatmap_supports($feature) {
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
 * Add slopeheatmap instance
 *
 * @param stdClass $data
 * @param mod_slopeheatmap_mod_form $mform
 * @return int The id of the newly inserted slopeheatmap record
 */
function slopeheatmap_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $data->id = $DB->insert_record('slopeheatmap', $data);

    return $data->id;
}

/**
 * Update slopeheatmap instance
 *
 * @param stdClass $data
 * @param mod_slopeheatmap_mod_form $mform
 * @return bool true
 */
function slopeheatmap_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('slopeheatmap', $data);
}

/**
 * Delete slopeheatmap instance
 *
 * @param int $id
 * @return bool true
 */
function slopeheatmap_delete_instance($id) {
    global $DB;

    if (!$slopeheatmap = $DB->get_record('slopeheatmap', array('id' => $id))) {
        return false;
    }

    // Delete related records
    $DB->delete_records('slopeheatmap_sessions', array('slopeheatmap_id' => $id));
    $DB->delete_records('slopeheatmap_problems', array('slopeheatmap_id' => $id));

    // Delete main record
    $DB->delete_records('slopeheatmap', array('id' => $id));

    return true;
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 *
 * @param stdClass $course
 * @param stdClass $user
 * @param cm_info $mod
 * @param stdClass $slopeheatmap
 * @return stdClass|null
 */
function slopeheatmap_user_outline($course, $user, $mod, $slopeheatmap) {
    global $DB;

    $sessions = $DB->get_records('slopeheatmap_sessions',
        array('slopeheatmap_id' => $slopeheatmap->id, 'user_id' => $user->id),
        'session_start DESC', '*', 0, 1);

    if ($sessions) {
        $session = reset($sessions);
        $result = new stdClass();
        $result->info = get_string('lastsession', 'slopeheatmap', userdate($session->session_start));
        $result->time = $session->session_start;
        return $result;
    }

    return null;
}

/**
 * Update grades in central gradebook
 *
 * @param stdClass $slopeheatmap
 * @param int $userid specific user only, 0 means all
 * @param bool $nullifnone
 */
function slopeheatmap_update_grades($slopeheatmap, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($userid) {
        $grade = slopeheatmap_get_user_grade($slopeheatmap, $userid);
        slopeheatmap_grade_item_update($slopeheatmap, $grade);
    } else {
        slopeheatmap_grade_item_update($slopeheatmap);
    }
}

/**
 * Create grade item for given slopeheatmap
 *
 * @param stdClass $slopeheatmap
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function slopeheatmap_grade_item_update($slopeheatmap, $grades = null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $params = array('itemname' => $slopeheatmap->name);

    if ($slopeheatmap->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax']  = $slopeheatmap->grade;
        $params['grademin']  = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/slopeheatmap', $slopeheatmap->course, 'mod', 'slopeheatmap',
                        $slopeheatmap->id, 0, $grades, $params);
}

/**
 * Get user grade
 *
 * @param stdClass $slopeheatmap
 * @param int $userid
 * @return object|bool
 */
function slopeheatmap_get_user_grade($slopeheatmap, $userid) {
    global $DB;

    $sql = "SELECT AVG(score) as rawgrade
            FROM {slopeheatmap_sessions}
            WHERE slopeheatmap_id = :slopeheatmapid AND user_id = :userid AND completed = 1";

    $grade = $DB->get_record_sql($sql, array('slopeheatmapid' => $slopeheatmap->id, 'userid' => $userid));

    if ($grade) {
        $grade->userid = $userid;
        return $grade;
    }

    return false;
}
