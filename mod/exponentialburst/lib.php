<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library of interface functions and constants for mod_exponentialburst
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Return if the plugin supports $feature.
 *
 * @param string $feature Constant representing the feature.
 * @return mixed True if module supports feature, null otherwise.
 */
function exponentialburst_supports($feature) {
    switch ($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_GRADE_HAS_GRADE:
            return false;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the exponentialburst into the database
 *
 * @param object $exponentialburst An object from the form in mod_form.php
 * @return int The id of the newly inserted exponentialburst record
 */
function exponentialburst_add_instance($exponentialburst) {
    global $DB;

    $exponentialburst->timecreated = time();
    $exponentialburst->timemodified = time();

    $exponentialburst->id = $DB->insert_record('exponentialburst', $exponentialburst);

    return $exponentialburst->id;
}

/**
 * Updates an instance of the exponentialburst in the database
 *
 * @param object $exponentialburst An object from the form in mod_form.php
 * @return boolean Success/Fail
 */
function exponentialburst_update_instance($exponentialburst) {
    global $DB;

    $exponentialburst->timemodified = time();
    $exponentialburst->id = $exponentialburst->instance;

    return $DB->update_record('exponentialburst', $exponentialburst);
}

/**
 * Removes an instance of the exponentialburst from the database
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function exponentialburst_delete_instance($id) {
    global $DB;

    if (!$exponentialburst = $DB->get_record('exponentialburst', array('id' => $id))) {
        return false;
    }

    // Delete any dependent records
    $DB->delete_records('exponentialburst_attempts', array('exponentialburstid' => $exponentialburst->id));
    $DB->delete_records('exponentialburst_progress', array('exponentialburstid' => $exponentialburst->id));

    $DB->delete_records('exponentialburst', array('id' => $exponentialburst->id));

    return true;
}

/**
 * Get a question from the question bank for this activity
 *
 * @param int $activityid The activity instance ID
 * @param int $difficulty The difficulty level
 * @return object Question data
 */
function exponentialburst_get_question($activityid, $difficulty = 1) {
    global $DB;

    // For now, generate a simple exponential question
    // In production, this would fetch from Moodle's question bank
    $base = rand(2, 5);
    $exponent = rand(1, min(5, $difficulty + 2));

    $question = new stdClass();
    $question->id = rand(1000, 9999); // Temporary ID
    $question->questiontext = "What is {$base}^{$exponent}?";
    $question->base = $base;
    $question->exponent = $exponent;
    $question->correctanswer = pow($base, $exponent);

    return $question;
}

/**
 * Check if an answer is correct
 *
 * @param object $question The question object
 * @param mixed $answer The student's answer
 * @return boolean True if correct
 */
function exponentialburst_check_answer($question, $answer) {
    return abs($answer - $question->correctanswer) < 0.001;
}

/**
 * Get or create progress record for a user
 *
 * @param int $exponentialburstid The activity instance ID
 * @param int $userid The user ID
 * @return object Progress record
 */
function exponentialburst_get_progress($exponentialburstid, $userid) {
    global $DB;

    $progress = $DB->get_record('exponentialburst_progress',
        array('exponentialburstid' => $exponentialburstid, 'userid' => $userid));

    if (!$progress) {
        $progress = new stdClass();
        $progress->exponentialburstid = $exponentialburstid;
        $progress->userid = $userid;
        $progress->currentlevel = 1;
        $progress->totalbursts = 0;
        $progress->bestscore = 0;
        $progress->totaltime = 0;
        $progress->timecreated = time();
        $progress->timemodified = time();
        $progress->id = $DB->insert_record('exponentialburst_progress', $progress);
    }

    return $progress;
}

/**
 * Update progress after an attempt
 *
 * @param int $progressid The progress record ID
 * @param boolean $iscorrect Whether the answer was correct
 * @param int $timespent Time spent on this attempt
 * @return boolean Success
 */
function exponentialburst_update_progress($progressid, $iscorrect, $timespent) {
    global $DB;

    $progress = $DB->get_record('exponentialburst_progress', array('id' => $progressid));

    if ($progress) {
        if ($iscorrect) {
            $progress->totalbursts++;
            $progress->bestscore = max($progress->bestscore, $progress->totalbursts);
        }
        $progress->totaltime += $timespent;
        $progress->timemodified = time();

        return $DB->update_record('exponentialburst_progress', $progress);
    }

    return false;
}

/**
 * Record an attempt
 *
 * @param object $attempt The attempt data
 * @return int The attempt ID
 */
function exponentialburst_record_attempt($attempt) {
    global $DB;

    $attempt->timecreated = time();
    return $DB->insert_record('exponentialburst_attempts', $attempt);
}
