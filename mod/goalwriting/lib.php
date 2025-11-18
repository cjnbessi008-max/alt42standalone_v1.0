<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for module goalwriting
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns whether the module supports a feature or not
 *
 * @param string $feature FEATURE_xx constant
 * @return mixed True if supported, false if not, null if unknown
 */
function goalwriting_supports($feature) {
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
 * Saves a new instance of the goalwriting into the database
 *
 * @param stdClass $goalwriting
 * @param mod_goalwriting_mod_form $mform
 * @return int The id of the newly inserted goalwriting record
 */
function goalwriting_add_instance($goalwriting, $mform = null) {
    global $DB;

    $goalwriting->timecreated = time();
    $goalwriting->timemodified = time();

    $goalwriting->id = $DB->insert_record('goalwriting', $goalwriting);

    return $goalwriting->id;
}

/**
 * Updates an instance of the goalwriting in the database
 *
 * @param stdClass $goalwriting
 * @param mod_goalwriting_mod_form $mform
 * @return boolean Success/Fail
 */
function goalwriting_update_instance($goalwriting, $mform = null) {
    global $DB;

    $goalwriting->timemodified = time();
    $goalwriting->id = $goalwriting->instance;

    return $DB->update_record('goalwriting', $goalwriting);
}

/**
 * Removes an instance of the goalwriting from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function goalwriting_delete_instance($id) {
    global $DB;

    if (!$goalwriting = $DB->get_record('goalwriting', array('id' => $id))) {
        return false;
    }

    // Delete all submissions
    $DB->delete_records('goalwriting_submissions', array('goalwritingid' => $id));

    // Delete the instance
    $DB->delete_records('goalwriting', array('id' => $id));

    return true;
}

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function goalwriting_get_coursemodule_info($coursemodule) {
    global $DB;

    $dbparams = array('id' => $coursemodule->instance);
    $fields = 'id, name, intro, introformat';
    if (!$goalwriting = $DB->get_record('goalwriting', $dbparams, $fields)) {
        return false;
    }

    $result = new cached_cm_info();
    $result->name = $goalwriting->name;

    if ($coursemodule->showdescription) {
        $result->content = format_module_intro('goalwriting', $goalwriting, $coursemodule->id, false);
    }

    return $result;
}

/**
 * Get or create a submission for a user
 *
 * @param int $goalwritingid
 * @param int $userid
 * @return stdClass submission record
 */
function goalwriting_get_user_submission($goalwritingid, $userid) {
    global $DB;

    $submission = $DB->get_record('goalwriting_submissions',
        array('goalwritingid' => $goalwritingid, 'userid' => $userid));

    if (!$submission) {
        $submission = new stdClass();
        $submission->goalwritingid = $goalwritingid;
        $submission->userid = $userid;
        $submission->goaltext = '';
        $submission->goalformat = FORMAT_HTML;
        $submission->wordcount = 0;
        $submission->status = 'draft';
        $submission->timecreated = time();
        $submission->timemodified = time();
        $submission->id = $DB->insert_record('goalwriting_submissions', $submission);
    }

    return $submission;
}

/**
 * Count words in text
 *
 * @param string $text
 * @return int number of words
 */
function goalwriting_count_words($text) {
    $text = strip_tags($text);
    $text = preg_replace('/\s+/', ' ', $text);
    $words = explode(' ', trim($text));
    return count(array_filter($words));
}

/**
 * Save submission
 *
 * @param stdClass $submission
 * @return bool success
 */
function goalwriting_save_submission($submission) {
    global $DB;

    $submission->wordcount = goalwriting_count_words($submission->goaltext);
    $submission->timemodified = time();

    if (isset($submission->id) && $submission->id > 0) {
        return $DB->update_record('goalwriting_submissions', $submission);
    } else {
        $submission->timecreated = time();
        $submission->id = $DB->insert_record('goalwriting_submissions', $submission);
        return $submission->id > 0;
    }
}

/**
 * Get all submissions for a goalwriting activity
 *
 * @param int $goalwritingid
 * @return array of submission records
 */
function goalwriting_get_all_submissions($goalwritingid) {
    global $DB;

    $sql = "SELECT s.*, u.firstname, u.lastname, u.email
            FROM {goalwriting_submissions} s
            JOIN {user} u ON s.userid = u.id
            WHERE s.goalwritingid = :goalwritingid
            ORDER BY s.timemodified DESC";

    return $DB->get_records_sql($sql, array('goalwritingid' => $goalwritingid));
}

/**
 * Update grade for a submission
 *
 * @param stdClass $goalwriting
 * @param int $userid
 * @param int $grade
 * @return bool
 */
function goalwriting_update_grades($goalwriting, $userid = 0, $grade = null) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    if ($grade === null) {
        if ($userid) {
            $submission = $DB->get_record('goalwriting_submissions',
                array('goalwritingid' => $goalwriting->id, 'userid' => $userid));
            if ($submission && $submission->grade !== null) {
                $grades = new stdClass();
                $grades->userid = $userid;
                $grades->rawgrade = $submission->grade;
                return grade_update('mod/goalwriting', $goalwriting->course, 'mod',
                    'goalwriting', $goalwriting->id, 0, $grades);
            }
        }
        return true;
    }

    $grades = new stdClass();
    $grades->userid = $userid;
    $grades->rawgrade = $grade;

    return grade_update('mod/goalwriting', $goalwriting->course, 'mod',
        'goalwriting', $goalwriting->id, 0, $grades);
}
