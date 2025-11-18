<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Library of interface functions
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return true | null True if the feature is supported, null otherwise.
 */
function minitrial_supports($feature) {
    switch ($feature) {
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
 * Saves a new instance of the minitrial into the database.
 *
 * @param stdClass $minitrial An object from the form in mod_form.php
 * @param mod_minitrial_mod_form $mform The form instance itself (if needed)
 * @return int The id of the newly inserted minitrial record
 */
function minitrial_add_instance(stdClass $minitrial, mod_minitrial_mod_form $mform = null) {
    global $DB;

    $minitrial->timecreated = time();
    $minitrial->timemodified = time();

    // Set default values if not provided
    if (!isset($minitrial->game_type)) {
        $minitrial->game_type = 'dice';
    }
    if (!isset($minitrial->trials_required)) {
        $minitrial->trials_required = 10;
    }
    if (!isset($minitrial->grade)) {
        $minitrial->grade = 100;
    }

    $minitrial->id = $DB->insert_record('minitrial', $minitrial);

    minitrial_grade_item_update($minitrial);

    return $minitrial->id;
}

/**
 * Updates an instance of the minitrial in the database.
 *
 * @param stdClass $minitrial An object from the form in mod_form.php
 * @param mod_minitrial_mod_form $mform The form instance itself (if needed)
 * @return bool True if successful, false otherwise
 */
function minitrial_update_instance(stdClass $minitrial, mod_minitrial_mod_form $mform = null) {
    global $DB;

    $minitrial->timemodified = time();
    $minitrial->id = $minitrial->instance;

    $result = $DB->update_record('minitrial', $minitrial);

    minitrial_grade_item_update($minitrial);

    return $result;
}

/**
 * Removes an instance of the minitrial from the database.
 *
 * @param int $id Id of the module instance
 * @return bool True if successful, false otherwise
 */
function minitrial_delete_instance($id) {
    global $DB;

    if (!$minitrial = $DB->get_record('minitrial', array('id' => $id))) {
        return false;
    }

    // Delete all related attempts
    $DB->delete_records('minitrial_attempts', array('minitrial' => $minitrial->id));

    // Delete all progress records
    $DB->delete_records('minitrial_progress', array('minitrial' => $minitrial->id));

    // Delete the instance
    $DB->delete_records('minitrial', array('id' => $minitrial->id));

    minitrial_grade_item_delete($minitrial);

    return true;
}

/**
 * Create/update grade item for given minitrial
 *
 * @param stdClass $minitrial object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function minitrial_grade_item_update($minitrial, $grades = null) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    $params = array('itemname' => $minitrial->name);
    if (isset($minitrial->cmidnumber)) {
        $params['idnumber'] = $minitrial->cmidnumber;
    }

    if ($minitrial->grade > 0) {
        $params['gradetype'] = GRADE_TYPE_VALUE;
        $params['grademax'] = $minitrial->grade;
        $params['grademin'] = 0;
    } else {
        $params['gradetype'] = GRADE_TYPE_NONE;
    }

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/minitrial', $minitrial->course, 'mod', 'minitrial',
                        $minitrial->id, 0, $grades, $params);
}

/**
 * Delete grade item for given minitrial
 *
 * @param stdClass $minitrial object
 * @return int 0 if ok, error code otherwise
 */
function minitrial_grade_item_delete($minitrial) {
    global $CFG;
    require_once($CFG->libdir . '/gradelib.php');

    return grade_update('mod/minitrial', $minitrial->course, 'mod', 'minitrial',
                        $minitrial->id, 0, null, array('deleted' => 1));
}

/**
 * Update grades in gradebook
 *
 * @param stdClass $minitrial object
 * @param int $userid specific user only, 0 means all
 * @param bool $nullifnone return null if grade does not exist
 * @return void
 */
function minitrial_update_grades($minitrial, $userid = 0, $nullifnone = true) {
    global $CFG, $DB;
    require_once($CFG->libdir . '/gradelib.php');

    if ($userid != 0) {
        if ($progress = $DB->get_record('minitrial_progress',
                array('minitrial' => $minitrial->id, 'userid' => $userid))) {
            $grade = new stdClass();
            $grade->userid = $userid;
            $grade->rawgrade = $progress->grade;
            $grade->dategraded = $progress->timemodified;
            minitrial_grade_item_update($minitrial, $grade);
        } else if ($nullifnone) {
            $grade = new stdClass();
            $grade->userid = $userid;
            $grade->rawgrade = null;
            minitrial_grade_item_update($minitrial, $grade);
        }
    } else {
        $grades = $DB->get_records_sql('
            SELECT userid, grade as rawgrade, timemodified as dategraded
            FROM {minitrial_progress}
            WHERE minitrial = ?
        ', array($minitrial->id));

        if ($grades) {
            minitrial_grade_item_update($minitrial, $grades);
        } else {
            minitrial_grade_item_update($minitrial);
        }
    }
}

/**
 * Calculate grade based on completion
 *
 * @param int $minitrialid
 * @param int $userid
 * @return float grade
 */
function minitrial_calculate_grade($minitrialid, $userid) {
    global $DB;

    $minitrial = $DB->get_record('minitrial', array('id' => $minitrialid), '*', MUST_EXIST);
    $progress = $DB->get_record('minitrial_progress',
        array('minitrial' => $minitrialid, 'userid' => $userid));

    if (!$progress) {
        return 0;
    }

    // Grade based on completion percentage
    $completion_percentage = min(1, $progress->trials_completed / $minitrial->trials_required);
    return $minitrial->grade * $completion_percentage;
}

/**
 * Return a list of page types
 *
 * @param string $pagetype current page type
 * @param stdClass $parentcontext Block's parent context
 * @param stdClass $currentcontext Current context of block
 * @return array array of page types
 */
function minitrial_page_type_list($pagetype, $parentcontext, $currentcontext) {
    $module_pagetype = array('mod-minitrial-*' => get_string('page-mod-minitrial-x', 'minitrial'));
    return $module_pagetype;
}
