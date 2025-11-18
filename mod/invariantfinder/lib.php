<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Library of interface functions and constants for module invariantfinder
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 *
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function invariantfinder_supports($feature) {
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
 * Saves a new instance of the invariantfinder into the database
 *
 * @param stdClass $invariantfinder An object from the form in mod_form.php
 * @param mod_invariantfinder_mod_form $mform The form instance
 * @return int The id of the newly inserted invariantfinder record
 */
function invariantfinder_add_instance(stdClass $invariantfinder, mod_invariantfinder_mod_form $mform = null) {
    global $DB;

    $invariantfinder->timecreated = time();
    $invariantfinder->timemodified = time();

    $invariantfinder->id = $DB->insert_record('invariantfinder', $invariantfinder);

    invariantfinder_grade_item_update($invariantfinder);

    return $invariantfinder->id;
}

/**
 * Updates an instance of the invariantfinder in the database
 *
 * @param stdClass $invariantfinder An object from the form in mod_form.php
 * @param mod_invariantfinder_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function invariantfinder_update_instance(stdClass $invariantfinder, mod_invariantfinder_mod_form $mform = null) {
    global $DB;

    $invariantfinder->timemodified = time();
    $invariantfinder->id = $invariantfinder->instance;

    $result = $DB->update_record('invariantfinder', $invariantfinder);

    invariantfinder_grade_item_update($invariantfinder);

    return $result;
}

/**
 * Removes an instance of the invariantfinder from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function invariantfinder_delete_instance($id) {
    global $DB;

    if (!$invariantfinder = $DB->get_record('invariantfinder', array('id' => $id))) {
        return false;
    }

    // Delete any dependent records
    $DB->delete_records('invariantfinder_attempts', array('invariantfinder' => $invariantfinder->id));

    // Delete interactions through attempts
    $attempts = $DB->get_records('invariantfinder_attempts', array('invariantfinder' => $invariantfinder->id));
    foreach ($attempts as $attempt) {
        $DB->delete_records('invariantfinder_interactions', array('attempt_id' => $attempt->id));
    }

    $DB->delete_records('invariantfinder', array('id' => $invariantfinder->id));

    invariantfinder_grade_item_delete($invariantfinder);

    return true;
}

/**
 * Create/update grade item for given invariantfinder
 *
 * @param stdClass $invariantfinder object with extra cmidnumber
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return int 0 if ok, error code otherwise
 */
function invariantfinder_grade_item_update($invariantfinder, $grades = null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $params = array('itemname' => $invariantfinder->name);
    $params['gradetype'] = GRADE_TYPE_VALUE;
    $params['grademax']  = 100;
    $params['grademin']  = 0;

    if ($grades === 'reset') {
        $params['reset'] = true;
        $grades = null;
    }

    return grade_update('mod/invariantfinder', $invariantfinder->course, 'mod', 'invariantfinder',
                        $invariantfinder->id, 0, $grades, $params);
}

/**
 * Delete grade item for given invariantfinder
 *
 * @param stdClass $invariantfinder object
 * @return int Returns GRADE_UPDATE_OK, GRADE_UPDATE_FAILED, GRADE_UPDATE_MULTIPLE or GRADE_UPDATE_ITEM_LOCKED
 */
function invariantfinder_grade_item_delete($invariantfinder) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    return grade_update('mod/invariantfinder', $invariantfinder->course, 'mod', 'invariantfinder',
                        $invariantfinder->id, 0, null, array('deleted' => 1));
}

/**
 * Return a list of page types
 *
 * @param string $pagetype current page type
 * @param stdClass $parentcontext Block's parent context
 * @param stdClass $currentcontext Current context of block
 */
function invariantfinder_page_type_list($pagetype, $parentcontext, $currentcontext) {
    $module_pagetype = array('mod-invariantfinder-*' => get_string('page-mod-invariantfinder-x', 'invariantfinder'));
    return $module_pagetype;
}

/**
 * Get user's attempt for the activity
 *
 * @param int $invariantfinderid
 * @param int $userid
 * @return stdClass|false The attempt record or false
 */
function invariantfinder_get_user_attempt($invariantfinderid, $userid) {
    global $DB;

    return $DB->get_record('invariantfinder_attempts',
        array('invariantfinder' => $invariantfinderid, 'userid' => $userid),
        '*', IGNORE_MULTIPLE);
}

/**
 * Save user's attempt
 *
 * @param stdClass $attemptdata
 * @return int The attempt id
 */
function invariantfinder_save_attempt($attemptdata) {
    global $DB;

    $attemptdata->timemodified = time();

    if (isset($attemptdata->id) && $attemptdata->id > 0) {
        $DB->update_record('invariantfinder_attempts', $attemptdata);
        return $attemptdata->id;
    } else {
        $attemptdata->timecreated = time();
        return $DB->insert_record('invariantfinder_attempts', $attemptdata);
    }
}

/**
 * Log an interaction
 *
 * @param int $attemptid
 * @param string $actiontype
 * @param mixed $actiondata
 */
function invariantfinder_log_interaction($attemptid, $actiontype, $actiondata) {
    global $DB;

    $interaction = new stdClass();
    $interaction->attempt_id = $attemptid;
    $interaction->action_type = $actiontype;
    $interaction->action_data = json_encode($actiondata);
    $interaction->timestamp = time();

    $DB->insert_record('invariantfinder_interactions', $interaction);
}
