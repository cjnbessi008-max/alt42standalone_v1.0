<?php
/**
 * Library of interface functions and constants for module shapeguide
 * Moodle 3.7 compatible
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Supported features
 */
function shapeguide_supports($feature) {
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

/**
 * Saves a new instance of the shapeguide into the database
 */
function shapeguide_add_instance($shapeguide, $mform = null) {
    global $DB;

    $shapeguide->timecreated = time();
    $shapeguide->timemodified = time();

    // Set defaults if not provided
    if (!isset($shapeguide->autoparallel)) {
        $shapeguide->autoparallel = 1;
    }
    if (!isset($shapeguide->autoperpendicular)) {
        $shapeguide->autoperpendicular = 1;
    }
    if (!isset($shapeguide->showlabels)) {
        $shapeguide->showlabels = 1;
    }
    if (!isset($shapeguide->parallelcolor)) {
        $shapeguide->parallelcolor = '#4ECDC4';
    }
    if (!isset($shapeguide->perpendicularcolor)) {
        $shapeguide->perpendicularcolor = '#FF6B6B';
    }

    $shapeguide->id = $DB->insert_record('shapeguide', $shapeguide);

    return $shapeguide->id;
}

/**
 * Updates an instance of the shapeguide in the database
 */
function shapeguide_update_instance($shapeguide, $mform = null) {
    global $DB;

    $shapeguide->timemodified = time();
    $shapeguide->id = $shapeguide->instance;

    $result = $DB->update_record('shapeguide', $shapeguide);

    return $result;
}

/**
 * Removes an instance of the shapeguide from the database
 */
function shapeguide_delete_instance($id) {
    global $DB;

    if (!$shapeguide = $DB->get_record('shapeguide', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('shapeguide', array('id' => $shapeguide->id));

    return true;
}

/**
 * Returns the information on whether the module supports a feature
 */
function shapeguide_get_coursemodule_info($coursemodule) {
    global $DB;

    $dbparams = array('id' => $coursemodule->instance);
    $shapeguide = $DB->get_record('shapeguide', $dbparams, 'id, name, intro, introformat');

    if (!$shapeguide) {
        return false;
    }

    $info = new cached_cm_info();
    $info->name = $shapeguide->name;

    if ($coursemodule->showdescription) {
        $info->content = format_module_intro('shapeguide', $shapeguide, $coursemodule->id, false);
    }

    return $info;
}
