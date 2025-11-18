<?php
// This file is part of Moodle - http://moodle.org/
//
// Alt42 Module - Library functions

defined('MOODLE_INTERNAL') || die();

/**
 * Supported features
 */
function alt42_supports($feature) {
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
 * Add alt42 instance
 */
function alt42_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    return $DB->insert_record('alt42', $data);
}

/**
 * Update alt42 instance
 */
function alt42_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('alt42', $data);
}

/**
 * Delete alt42 instance
 */
function alt42_delete_instance($id) {
    global $DB;

    if (!$alt42 = $DB->get_record('alt42', array('id' => $id))) {
        return false;
    }

    $DB->delete_records('alt42', array('id' => $alt42->id));

    return true;
}
