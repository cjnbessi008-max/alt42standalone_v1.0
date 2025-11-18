<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event Observer for Difficulty Prediction
 *
 * Observes Moodle events to automatically trigger difficulty predictions
 * and performance tracking.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');
require_once($CFG->dirroot . '/local/difficulty_prediction/classes/performance_tracker.php');

/**
 * Class observer
 *
 * Event observer for automatic difficulty prediction.
 */
class observer {

    /**
     * Handle question created event
     *
     * @param \core\event\question_created $event
     */
    public static function question_created(\core\event\question_created $event) {
        $questionid = $event->objectid;

        // Automatically predict difficulty for new question.
        try {
            difficulty_predictor::predict($questionid);
            mtrace("Difficulty predicted for new question ID: $questionid");
        } catch (\Exception $e) {
            mtrace("Error predicting difficulty for question $questionid: " . $e->getMessage());
        }
    }

    /**
     * Handle question updated event
     *
     * @param \core\event\question_updated $event
     */
    public static function question_updated(\core\event\question_updated $event) {
        $questionid = $event->objectid;

        // Recalculate difficulty when question is updated.
        try {
            difficulty_predictor::predict($questionid, true); // Force recalculation.
            mtrace("Difficulty recalculated for updated question ID: $questionid");
        } catch (\Exception $e) {
            mtrace("Error recalculating difficulty for question $questionid: " . $e->getMessage());
        }
    }

    /**
     * Handle quiz attempt submitted event
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function attempt_submitted(\mod_quiz\event\attempt_submitted $event) {
        $attemptid = $event->objectid;

        // Process quiz attempt and record performance.
        try {
            $count = performance_tracker::process_quiz_attempt($attemptid);
            mtrace("Recorded performance for $count questions in attempt ID: $attemptid");
        } catch (\Exception $e) {
            mtrace("Error processing quiz attempt $attemptid: " . $e->getMessage());
        }
    }

    /**
     * Handle question answered event
     *
     * @param \core\event\question_answered $event (if available)
     */
    public static function question_answered($event) {
        // This can be used for real-time difficulty updates.
        // Currently, we process in batch on attempt submission.
        mtrace("Question answered event received for question: " . $event->objectid);
    }
}
