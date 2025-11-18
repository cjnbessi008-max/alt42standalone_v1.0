<?php
// This file is part of Moodle - http://moodle.org/

namespace local_confidencereasoning;

defined('MOODLE_INTERNAL') || die();

/**
 * Event observer for confidence reasoning plugin
 */
class observer {

    /**
     * Handle quiz attempt submission event
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function quiz_attempt_submitted(\mod_quiz\event\attempt_submitted $event) {
        global $DB;

        $quizid = $event->other['quizid'];
        $userid = $event->relateduserid;

        // Update statistics after quiz submission
        local_confidencereasoning_update_stats($userid, $quizid);

        // Log event
        debugging('Confidence stats updated for user ' . $userid . ' in quiz ' . $quizid, DEBUG_DEVELOPER);
    }

    /**
     * Handle question answered event
     *
     * @param \core\event\question_answered $event
     */
    public static function question_answered(\core\event\question_answered $event) {
        // This can be used for real-time tracking if needed
        // Currently handled via AJAX in the frontend
    }
}
