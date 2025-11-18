<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for module altsolutions
 *
 * @package    mod_altsolutions
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
function altsolutions_supports($feature) {
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
 * Saves a new instance of the altsolutions into the database
 *
 * @param stdClass $altsolutions An object from the form in mod_form.php
 * @param mod_altsolutions_mod_form $mform The form instance
 * @return int The id of the newly inserted altsolutions record
 */
function altsolutions_add_instance(stdClass $altsolutions, mod_altsolutions_mod_form $mform = null) {
    global $DB;

    $altsolutions->timecreated = time();
    $altsolutions->timemodified = time();

    $altsolutions->id = $DB->insert_record('altsolutions', $altsolutions);

    return $altsolutions->id;
}

/**
 * Updates an instance of the altsolutions in the database
 *
 * @param stdClass $altsolutions An object from the form in mod_form.php
 * @param mod_altsolutions_mod_form $mform The form instance
 * @return boolean Success/Fail
 */
function altsolutions_update_instance(stdClass $altsolutions, mod_altsolutions_mod_form $mform = null) {
    global $DB;

    $altsolutions->timemodified = time();
    $altsolutions->id = $altsolutions->instance;

    return $DB->update_record('altsolutions', $altsolutions);
}

/**
 * Removes an instance of the altsolutions from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function altsolutions_delete_instance($id) {
    global $DB;

    if (!$altsolutions = $DB->get_record('altsolutions', array('id' => $id))) {
        return false;
    }

    // Delete all related records
    $DB->delete_records('altsolutions_steps', array('altsolutionsid' => $id));

    // Get all attempts for this activity
    $attempts = $DB->get_records('altsolutions_attempts', array('altsolutionsid' => $id));
    foreach ($attempts as $attempt) {
        $DB->delete_records('altsolutions_alternatives', array('attemptid' => $attempt->id));
    }
    $DB->delete_records('altsolutions_attempts', array('altsolutionsid' => $id));

    $DB->delete_records('altsolutions_reflections', array('altsolutionsid' => $id));
    $DB->delete_records('altsolutions', array('id' => $id));

    return true;
}

/**
 * Returns a small object with summary information about what a
 * user has done with a given particular instance of this module
 *
 * @param stdClass $course The course record
 * @param stdClass $user The user record
 * @param cm_info|stdClass $mod The course module info object or record
 * @param stdClass $altsolutions The altsolutions instance record
 * @return stdClass|null
 */
function altsolutions_user_outline($course, $user, $mod, $altsolutions) {
    global $DB;

    $result = new stdClass();

    $attempts = $DB->count_records('altsolutions_attempts', array(
        'altsolutionsid' => $altsolutions->id,
        'userid' => $user->id
    ));

    if ($attempts > 0) {
        $result->info = get_string('steps', 'altsolutions') . ': ' . $attempts;
        $latest = $DB->get_field('altsolutions_attempts', 'MAX(timemodified)', array(
            'altsolutionsid' => $altsolutions->id,
            'userid' => $user->id
        ));
        $result->time = $latest;
        return $result;
    }

    return null;
}

/**
 * Get user's progress for an altsolutions activity
 *
 * @param int $altsolutionsid The altsolutions instance id
 * @param int $userid The user id
 * @return stdClass Progress information
 */
function altsolutions_get_user_progress($altsolutionsid, $userid) {
    global $DB;

    $progress = new stdClass();
    $progress->totalsteps = $DB->count_records('altsolutions_steps', array('altsolutionsid' => $altsolutionsid));

    $sql = "SELECT COUNT(DISTINCT stepid)
            FROM {altsolutions_attempts}
            WHERE altsolutionsid = ? AND userid = ?";
    $progress->completedsteps = $DB->count_records_sql($sql, array($altsolutionsid, $userid));

    $progress->percentage = $progress->totalsteps > 0 ?
        round(($progress->completedsteps / $progress->totalsteps) * 100) : 0;

    $progress->hasreflection = $DB->record_exists('altsolutions_reflections', array(
        'altsolutionsid' => $altsolutionsid,
        'userid' => $userid
    ));

    return $progress;
}

/**
 * Get all steps for an altsolutions activity
 *
 * @param int $altsolutionsid The altsolutions instance id
 * @return array Array of step records
 */
function altsolutions_get_steps($altsolutionsid) {
    global $DB;

    return $DB->get_records('altsolutions_steps',
        array('altsolutionsid' => $altsolutionsid),
        'stepnumber ASC');
}

/**
 * Get user's attempt for a specific step
 *
 * @param int $stepid The step id
 * @param int $userid The user id
 * @return stdClass|false The attempt record or false
 */
function altsolutions_get_user_step_attempt($stepid, $userid) {
    global $DB;

    return $DB->get_record('altsolutions_attempts', array(
        'stepid' => $stepid,
        'userid' => $userid
    ));
}

/**
 * Get all alternatives for an attempt
 *
 * @param int $attemptid The attempt id
 * @return array Array of alternative records
 */
function altsolutions_get_alternatives($attemptid) {
    global $DB;

    return $DB->get_records('altsolutions_alternatives',
        array('attemptid' => $attemptid),
        'alternativenumber ASC');
}

/**
 * Save step attempt
 *
 * @param stdClass $data The form data
 * @return int The attempt id
 */
function altsolutions_save_step_attempt($data) {
    global $DB, $USER;

    $time = time();

    // Check if attempt already exists
    $attempt = $DB->get_record('altsolutions_attempts', array(
        'altsolutionsid' => $data->altsolutionsid,
        'userid' => $USER->id,
        'stepid' => $data->stepid
    ));

    if ($attempt) {
        // Update existing attempt
        $attempt->approach = $data->approach;
        $attempt->solution = $data->solution;
        $attempt->confidence = $data->confidence;
        $attempt->timespent = isset($data->timespent) ? $data->timespent : 0;
        $attempt->timemodified = $time;
        $DB->update_record('altsolutions_attempts', $attempt);
        $attemptid = $attempt->id;
    } else {
        // Insert new attempt
        $attempt = new stdClass();
        $attempt->altsolutionsid = $data->altsolutionsid;
        $attempt->userid = $USER->id;
        $attempt->stepid = $data->stepid;
        $attempt->approach = $data->approach;
        $attempt->solution = $data->solution;
        $attempt->confidence = isset($data->confidence) ? $data->confidence : 3;
        $attempt->timespent = isset($data->timespent) ? $data->timespent : 0;
        $attempt->timecreated = $time;
        $attempt->timemodified = $time;
        $attemptid = $DB->insert_record('altsolutions_attempts', $attempt);
    }

    // Delete old alternatives
    $DB->delete_records('altsolutions_alternatives', array('attemptid' => $attemptid));

    // Insert alternatives
    if (isset($data->alternatives) && is_array($data->alternatives)) {
        foreach ($data->alternatives as $num => $alternative) {
            if (!empty($alternative['description'])) {
                $alt = new stdClass();
                $alt->attemptid = $attemptid;
                $alt->alternativenumber = $num + 1;
                $alt->description = $alternative['description'];
                $alt->reasoning = isset($alternative['reasoning']) ? $alternative['reasoning'] : '';
                $alt->selected = ($data->approach == $num) ? 1 : 0;
                $alt->timecreated = $time;
                $DB->insert_record('altsolutions_alternatives', $alt);
            }
        }
    }

    return $attemptid;
}

/**
 * Save reflection
 *
 * @param stdClass $data The form data
 * @return bool Success
 */
function altsolutions_save_reflection($data) {
    global $DB, $USER;

    $reflection = $DB->get_record('altsolutions_reflections', array(
        'altsolutionsid' => $data->altsolutionsid,
        'userid' => $USER->id
    ));

    if ($reflection) {
        $reflection->mosteffective = $data->mosteffective;
        $reflection->learned = $data->learned;
        $reflection->wouldchange = $data->wouldchange;
        return $DB->update_record('altsolutions_reflections', $reflection);
    } else {
        $reflection = new stdClass();
        $reflection->altsolutionsid = $data->altsolutionsid;
        $reflection->userid = $USER->id;
        $reflection->mosteffective = $data->mosteffective;
        $reflection->learned = $data->learned;
        $reflection->wouldchange = $data->wouldchange;
        $reflection->timecreated = time();
        return $DB->insert_record('altsolutions_reflections', $reflection);
    }
}
