<?php
/**
 * External API for Blossom Sequence module
 *
 * @package    mod_blossomsequence
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_blossomsequence;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;

/**
 * External API class for Blossom Sequence
 */
class external extends external_api {

    /**
     * Returns description of method parameters for submit_answer
     *
     * @return external_function_parameters
     */
    public static function submit_answer_parameters() {
        return new external_function_parameters(
            array(
                'blossomsequenceid' => new external_value(PARAM_INT, 'The blossom sequence instance id'),
                'useranswer' => new external_value(PARAM_FLOAT, 'The user\'s answer'),
                'correctanswer' => new external_value(PARAM_FLOAT, 'The correct answer'),
                'score' => new external_value(PARAM_FLOAT, 'The score (0-100)')
            )
        );
    }

    /**
     * Submit an answer
     *
     * @param int $blossomsequenceid The blossom sequence instance id
     * @param float $useranswer The user's answer
     * @param float $correctanswer The correct answer
     * @param float $score The score
     * @return array Result data
     */
    public static function submit_answer($blossomsequenceid, $useranswer, $correctanswer, $score) {
        global $DB, $USER;

        // Parameter validation
        $params = self::validate_parameters(self::submit_answer_parameters(), array(
            'blossomsequenceid' => $blossomsequenceid,
            'useranswer' => $useranswer,
            'correctanswer' => $correctanswer,
            'score' => $score
        ));

        // Context validation
        $blossomsequence = $DB->get_record('blossomsequence', array('id' => $params['blossomsequenceid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('blossomsequence', $blossomsequence->id, $blossomsequence->course, false, MUST_EXIST);
        $context = \context_module::instance($cm->id);
        self::validate_context($context);

        // Capability check
        require_capability('mod/blossomsequence:submit', $context);

        // Get the next attempt number
        $attempts = $DB->get_records('blossomsequence_attempts',
            array('blossomsequenceid' => $params['blossomsequenceid'], 'userid' => $USER->id),
            'attempt DESC',
            '*',
            0,
            1
        );

        $attemptnum = 1;
        if (!empty($attempts)) {
            $lastAttempt = reset($attempts);
            $attemptnum = $lastAttempt->attempt + 1;
        }

        // Create the attempt record
        $attempt = new \stdClass();
        $attempt->blossomsequenceid = $params['blossomsequenceid'];
        $attempt->userid = $USER->id;
        $attempt->attempt = $attemptnum;
        $attempt->useranswer = json_encode(array($params['useranswer']));
        $attempt->correctanswer = json_encode(array($params['correctanswer']));
        $attempt->score = $params['score'];
        $attempt->completed = 1;
        $attempt->timecreated = time();
        $attempt->timecompleted = time();

        $attemptid = $DB->insert_record('blossomsequence_attempts', $attempt);

        // Update gradebook
        $grade = new \stdClass();
        $grade->userid = $USER->id;
        $grade->rawgrade = $params['score'];
        $grade->datesubmitted = time();

        blossomsequence_grade_item_update($blossomsequence, $grade);

        return array(
            'success' => true,
            'attemptid' => $attemptid,
            'attemptnum' => $attemptnum,
            'message' => 'Answer submitted successfully'
        );
    }

    /**
     * Returns description of method result value for submit_answer
     *
     * @return external_single_structure
     */
    public static function submit_answer_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Whether the submission was successful'),
                'attemptid' => new external_value(PARAM_INT, 'The attempt id'),
                'attemptnum' => new external_value(PARAM_INT, 'The attempt number'),
                'message' => new external_value(PARAM_TEXT, 'A message about the submission')
            )
        );
    }
}
