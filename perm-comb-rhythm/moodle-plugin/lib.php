<?php
/**
 * Library of interface functions and constants for module permcombrhythm
 *
 * @package    mod_permcombrhythm
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 */
function permcombrhythm_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the permcombrhythm into the database
 */
function permcombrhythm_add_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();

    return $DB->insert_record('permcombrhythm', $data);
}

/**
 * Updates an instance of the permcombrhythm in the database
 */
function permcombrhythm_update_instance($data) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    return $DB->update_record('permcombrhythm', $data);
}

/**
 * Removes an instance of the permcombrhythm from the database
 */
function permcombrhythm_delete_instance($id) {
    global $DB;

    if (!$permcombrhythm = $DB->get_record('permcombrhythm', array('id' => $id))) {
        return false;
    }

    // Delete attempts
    $DB->delete_records('permcombrhythm_attempts', array('permcombrhythmid' => $permcombrhythm->id));

    // Delete instance
    $DB->delete_records('permcombrhythm', array('id' => $permcombrhythm->id));

    return true;
}

/**
 * Generate a new problem based on settings
 */
function permcombrhythm_generate_problem($permcombrhythmid) {
    global $DB;

    $activity = $DB->get_record('permcombrhythm', array('id' => $permcombrhythmid), '*', MUST_EXIST);

    $problemtype = $activity->problemtype;
    if ($problemtype == 'mixed') {
        $problemtype = (rand(0, 1) == 0) ? 'permutation' : 'combination';
    }

    // Generate problem parameters based on difficulty
    $difficulty = $activity->difficulty;
    $n = rand(3 + $difficulty, 6 + $difficulty); // Total items
    $r = rand(2, min($n, 3 + floor($difficulty / 2))); // Selected items

    // Calculate correct answer
    if ($problemtype == 'permutation') {
        $answer = permcombrhythm_calculate_permutation($n, $r);
    } else {
        $answer = permcombrhythm_calculate_combination($n, $r);
    }

    return array(
        'type' => $problemtype,
        'n' => $n,
        'r' => $r,
        'answer' => $answer,
        'difficulty' => $difficulty
    );
}

/**
 * Calculate permutation P(n,r) = n!/(n-r)!
 */
function permcombrhythm_calculate_permutation($n, $r) {
    $result = 1;
    for ($i = 0; $i < $r; $i++) {
        $result *= ($n - $i);
    }
    return $result;
}

/**
 * Calculate combination C(n,r) = n!/(r!(n-r)!)
 */
function permcombrhythm_calculate_combination($n, $r) {
    $perm = permcombrhythm_calculate_permutation($n, $r);
    $r_factorial = 1;
    for ($i = 1; $i <= $r; $i++) {
        $r_factorial *= $i;
    }
    return $perm / $r_factorial;
}

/**
 * Save student attempt
 */
function permcombrhythm_save_attempt($permcombrhythmid, $userid, $problemdata, $useranswer, $timespent) {
    global $DB;

    $attempt = new stdClass();
    $attempt->permcombrhythmid = $permcombrhythmid;
    $attempt->userid = $userid;
    $attempt->problemdata = json_encode($problemdata);
    $attempt->useranswer = $useranswer;
    $attempt->iscorrect = ($useranswer == $problemdata['answer']) ? 1 : 0;
    $attempt->timespent = $timespent;
    $attempt->timecreated = time();

    return $DB->insert_record('permcombrhythm_attempts', $attempt);
}
