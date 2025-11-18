<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return true | null True if the feature is supported, null otherwise.
 */
function lineseq_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
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
 * Saves a new instance of the 3dlineseq into the database.
 *
 * @param stdClass $data An object from the form
 * @param mod_3dlineseq_mod_form $mform The form
 * @return int The id of the newly inserted record
 */
function lineseq_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    // Ensure sequencedata is JSON encoded
    if (isset($data->sequencedata) && !is_string($data->sequencedata)) {
        $data->sequencedata = json_encode($data->sequencedata);
    }

    $id = $DB->insert_record('3dlineseq', $data);

    return $id;
}

/**
 * Updates an instance of the 3dlineseq in the database.
 *
 * @param stdClass $data An object from the form
 * @param mod_3dlineseq_mod_form $mform The form
 * @return bool True if successful, false otherwise.
 */
function lineseq_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    // Ensure sequencedata is JSON encoded
    if (isset($data->sequencedata) && !is_string($data->sequencedata)) {
        $data->sequencedata = json_encode($data->sequencedata);
    }

    return $DB->update_record('3dlineseq', $data);
}

/**
 * Removes an instance of the 3dlineseq from the database.
 *
 * @param int $id Id of the module instance.
 * @return bool True if successful, false on failure.
 */
function lineseq_delete_instance($id) {
    global $DB;

    $exists = $DB->get_record('3dlineseq', array('id' => $id));
    if (!$exists) {
        return false;
    }

    // Delete all attempts
    $DB->delete_records('3dlineseq_attempts', array('3dlineseqid' => $id));

    // Delete the instance
    $DB->delete_records('3dlineseq', array('id' => $id));

    return true;
}

/**
 * Returns the lists of all browsable file areas within the given module context.
 *
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @return array of [(string)filearea] => (string)description
 */
function lineseq_get_file_areas($course, $cm, $context) {
    return array();
}

/**
 * File browsing support for 3dlineseq module.
 *
 * @param file_browser $browser
 * @param array $areas
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @param string $filearea
 * @param int $itemid
 * @param string $filepath
 * @param string $filename
 * @return file_info Instance or null if not found
 */
function lineseq_get_file_info($browser, $areas, $course, $cm, $context, $filearea, $itemid, $filepath, $filename) {
    return null;
}

/**
 * Serves the files from the 3dlineseq file areas.
 *
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @param string $filearea
 * @param array $args
 * @param bool $forcedownload
 * @param array $options
 * @return bool False if file not found, does not return anything if found
 */
function lineseq_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options=array()) {
    return false;
}

/**
 * Get sequence data for display
 *
 * @param int $id The 3dlineseq instance id
 * @return array Sequence data
 */
function lineseq_get_sequence_data($id) {
    global $DB;

    $record = $DB->get_record('3dlineseq', array('id' => $id), '*', MUST_EXIST);

    $data = array(
        'name' => $record->name,
        'type' => $record->sequencetype,
        'style' => $record->visualstyle,
        'values' => json_decode($record->sequencedata, true)
    );

    return $data;
}

/**
 * Save user attempt
 *
 * @param int $lineseqid The 3dlineseq instance id
 * @param int $userid The user id
 * @param array $answer The answer data
 * @param float $score The score
 * @return int The attempt id
 */
function lineseq_save_attempt($lineseqid, $userid, $answer, $score = null) {
    global $DB;

    // Get the next attempt number
    $attempts = $DB->count_records('3dlineseq_attempts', array(
        '3dlineseqid' => $lineseqid,
        'userid' => $userid
    ));

    $attempt = new stdClass();
    $attempt->{'3dlineseqid'} = $lineseqid;
    $attempt->userid = $userid;
    $attempt->attempt = $attempts + 1;
    $attempt->answer = json_encode($answer);
    $attempt->score = $score;
    $attempt->completed = ($score !== null) ? 1 : 0;
    $attempt->timecreated = time();
    $attempt->timemodified = time();

    return $DB->insert_record('3dlineseq_attempts', $attempt);
}

/**
 * Get user attempts
 *
 * @param int $lineseqid The 3dlineseq instance id
 * @param int $userid The user id
 * @return array Array of attempts
 */
function lineseq_get_user_attempts($lineseqid, $userid) {
    global $DB;

    return $DB->get_records('3dlineseq_attempts', array(
        '3dlineseqid' => $lineseqid,
        'userid' => $userid
    ), 'attempt ASC');
}
