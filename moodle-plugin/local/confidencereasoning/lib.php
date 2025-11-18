<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Save confidence reasoning data for a question attempt
 *
 * @param int $questionattemptid Question attempt ID
 * @param int $userid User ID
 * @param int $quizid Quiz ID
 * @param int $questionid Question ID
 * @param int $confidencelevel Confidence level (1-5)
 * @param string $reasoning Reasoning text
 * @param string $reasoningcategory Reasoning category
 * @return bool|int Record ID on success, false on failure
 */
function local_confidencereasoning_save($questionattemptid, $userid, $quizid, $questionid,
                                         $confidencelevel, $reasoning = '', $reasoningcategory = '') {
    global $DB;

    // Validate confidence level
    if ($confidencelevel < 1 || $confidencelevel > 5) {
        return false;
    }

    $record = new stdClass();
    $record->questionattemptid = $questionattemptid;
    $record->userid = $userid;
    $record->quizid = $quizid;
    $record->questionid = $questionid;
    $record->confidencelevel = $confidencelevel;
    $record->reasoning = $reasoning;
    $record->reasoningcategory = $reasoningcategory;
    $record->timecreated = time();
    $record->timemodified = time();

    try {
        // Check if record already exists
        $existing = $DB->get_record('local_confidence_reasoning',
            array('questionattemptid' => $questionattemptid));

        if ($existing) {
            // Update existing record
            $record->id = $existing->id;
            $record->timecreated = $existing->timecreated;
            $DB->update_record('local_confidence_reasoning', $record);
            return $record->id;
        } else {
            // Insert new record
            return $DB->insert_record('local_confidence_reasoning', $record);
        }
    } catch (Exception $e) {
        debugging('Error saving confidence reasoning: ' . $e->getMessage(), DEBUG_DEVELOPER);
        return false;
    }
}

/**
 * Get confidence reasoning data for a question attempt
 *
 * @param int $questionattemptid Question attempt ID
 * @return object|false Record object or false
 */
function local_confidencereasoning_get($questionattemptid) {
    global $DB;
    return $DB->get_record('local_confidence_reasoning',
        array('questionattemptid' => $questionattemptid));
}

/**
 * Get all confidence reasoning data for a quiz attempt
 *
 * @param int $quizid Quiz ID
 * @param int $userid User ID
 * @return array Array of records
 */
function local_confidencereasoning_get_by_quiz($quizid, $userid) {
    global $DB;
    return $DB->get_records('local_confidence_reasoning',
        array('quizid' => $quizid, 'userid' => $userid));
}

/**
 * Calculate and update confidence statistics for a user and quiz
 *
 * @param int $userid User ID
 * @param int $quizid Quiz ID
 * @return bool Success status
 */
function local_confidencereasoning_update_stats($userid, $quizid) {
    global $DB;

    // Get all confidence records for this user and quiz
    $records = $DB->get_records('local_confidence_reasoning',
        array('userid' => $userid, 'quizid' => $quizid));

    if (empty($records)) {
        return false;
    }

    $totalattempts = count($records);
    $totalconfidence = 0;
    $correctwithhighconfidence = 0;
    $incorrectwithhighconfidence = 0;

    foreach ($records as $record) {
        $totalconfidence += $record->confidencelevel;

        // Get question attempt to check if answer was correct
        $qa = $DB->get_record('question_attempts', array('id' => $record->questionattemptid));
        if ($qa) {
            $iscorrect = $qa->responsesummary && $qa->rightanswer &&
                         (strpos($qa->responsesummary, 'Correct') !== false ||
                          $qa->responsesummary == $qa->rightanswer);

            if ($record->confidencelevel >= 4) {
                if ($iscorrect) {
                    $correctwithhighconfidence++;
                } else {
                    $incorrectwithhighconfidence++;
                }
            }
        }
    }

    $avgconfidence = $totalconfidence / $totalattempts;

    // Update or insert stats record
    $stats = $DB->get_record('local_confidence_stats',
        array('userid' => $userid, 'quizid' => $quizid));

    $statsrecord = new stdClass();
    $statsrecord->userid = $userid;
    $statsrecord->quizid = $quizid;
    $statsrecord->avgconfidence = round($avgconfidence, 2);
    $statsrecord->totalattempts = $totalattempts;
    $statsrecord->correctwithhighconfidence = $correctwithhighconfidence;
    $statsrecord->incorrectwithhighconfidence = $incorrectwithhighconfidence;
    $statsrecord->timemodified = time();

    try {
        if ($stats) {
            $statsrecord->id = $stats->id;
            $statsrecord->timecreated = $stats->timecreated;
            $DB->update_record('local_confidence_stats', $statsrecord);
        } else {
            $statsrecord->timecreated = time();
            $DB->insert_record('local_confidence_stats', $statsrecord);
        }
        return true;
    } catch (Exception $e) {
        debugging('Error updating confidence stats: ' . $e->getMessage(), DEBUG_DEVELOPER);
        return false;
    }
}

/**
 * Get confidence statistics for a user and quiz
 *
 * @param int $userid User ID
 * @param int $quizid Quiz ID
 * @return object|false Stats object or false
 */
function local_confidencereasoning_get_stats($userid, $quizid) {
    global $DB;
    return $DB->get_record('local_confidence_stats',
        array('userid' => $userid, 'quizid' => $quizid));
}

/**
 * Add confidence reasoning UI to quiz pages
 *
 * @return void
 */
function local_confidencereasoning_before_footer() {
    global $PAGE;

    // Only add to quiz pages
    if ($PAGE->pagetype === 'mod-quiz-attempt' || $PAGE->pagetype === 'mod-quiz-review') {
        $PAGE->requires->js_call_amd('local_confidencereasoning/confidence_ui', 'init');
    }
}
