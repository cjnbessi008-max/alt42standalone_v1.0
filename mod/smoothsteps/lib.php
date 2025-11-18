<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

/**
 * Given an object containing all the necessary data,
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param object $smoothsteps An object from the form in mod_form.php
 * @return int The id of the newly inserted smoothsteps record
 */
function smoothsteps_add_instance($smoothsteps) {
    global $DB;

    $smoothsteps->timecreated = time();
    $smoothsteps->timemodified = time();

    return $DB->insert_record('smoothsteps', $smoothsteps);
}

/**
 * Given an object containing all the necessary data,
 * will update an existing instance with new data.
 *
 * @param object $smoothsteps An object from the form in mod_form.php
 * @return boolean Success/Fail
 */
function smoothsteps_update_instance($smoothsteps) {
    global $DB;

    $smoothsteps->timemodified = time();
    $smoothsteps->id = $smoothsteps->instance;

    return $DB->update_record('smoothsteps', $smoothsteps);
}

/**
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function smoothsteps_delete_instance($id) {
    global $DB;

    if (!$smoothsteps = $DB->get_record('smoothsteps', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('smoothsteps', array('id' => $smoothsteps->id));

    return true;
}

/**
 * Return a small object with summary information about what a
 * user has done with a given particular instance of this module
 * Used for user activity reports.
 *
 * @param object $course
 * @param object $user
 * @param object $mod
 * @param object $smoothsteps
 * @return object|null
 */
function smoothsteps_user_outline($course, $user, $mod, $smoothsteps) {
    return null;
}

/**
 * Returns all activity in course with smoothsteps since a given time
 *
 * @param array $activities sequentially indexed array of objects
 * @param int $index
 * @param int $timestart
 * @param int $courseid
 * @param int $cmid
 * @param int $userid defaults to 0
 * @param int $groupid defaults to 0
 * @return void adds items into $activities
 */
function smoothsteps_get_recent_mod_activity(&$activities, &$index, $timestart, $courseid, $cmid, $userid=0, $groupid=0) {
    return;
}

/**
 * Given a course_module object, this function returns any
 * "extra" information that may be needed when printing
 * this activity in a course listing.
 *
 * @param object $coursemodule
 * @return cached_cm_info info
 */
function smoothsteps_get_coursemodule_info($coursemodule) {
    global $DB;

    if (!$smoothsteps = $DB->get_record('smoothsteps', array('id' => $coursemodule->instance),
            'id, name, intro, introformat')) {
        return null;
    }

    $info = new cached_cm_info();
    $info->name = $smoothsteps->name;

    if ($coursemodule->showdescription) {
        // Convert intro to html. Do not filter cached version, filters run at display time.
        $info->content = format_module_intro('smoothsteps', $smoothsteps, $coursemodule->id, false);
    }

    return $info;
}

/**
 * This function is used by the reset_course_userdata function in moodlelib.
 *
 * @param object $data the data submitted from the reset course.
 * @return array status array
 */
function smoothsteps_reset_userdata($data) {
    return array();
}

/**
 * Serves the smoothsteps files.
 *
 * @param object $course
 * @param object $cm
 * @param object $context
 * @param string $filearea
 * @param array $args
 * @param bool $forcedownload
 * @return bool false if file not found, does not return if found - just send the file
 */
function smoothsteps_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload) {
    return false;
}

/**
 * Indicates API features that the smoothsteps supports.
 *
 * @uses FEATURE_IDNUMBER
 * @uses FEATURE_GROUPS
 * @uses FEATURE_GROUPINGS
 * @uses FEATURE_MOD_INTRO
 * @uses FEATURE_COMPLETION_TRACKS_VIEWS
 * @uses FEATURE_GRADE_HAS_GRADE
 * @uses FEATURE_GRADE_OUTCOMES
 * @param string $feature
 * @return mixed True if module supports feature, false if not, null if doesn't know
 */
function smoothsteps_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}
