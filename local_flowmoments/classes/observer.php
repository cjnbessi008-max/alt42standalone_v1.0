<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Event observers for Flow Moments plugin
 *
 * Listens to Moodle events and tracks student behavior
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_flowmoments;

defined('MOODLE_INTERNAL') || die();

/**
 * Event observer class
 */
class observer {

    /**
     * Observer for quiz attempt started event
     *
     * @param \mod_quiz\event\attempt_started $event
     */
    public static function quiz_attempt_started(\mod_quiz\event\attempt_started $event) {
        self::track_event($event, 'quiz_attempt_started');
    }

    /**
     * Observer for quiz attempt submitted event
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function quiz_attempt_submitted(\mod_quiz\event\attempt_submitted $event) {
        self::track_event($event, 'quiz_attempt_submitted');

        // Trigger flow analysis when quiz is submitted
        self::analyze_flow_for_attempt($event);
    }

    /**
     * Observer for question answered event
     *
     * @param \core\event\question_answered $event
     */
    public static function question_answered(\core\event\question_answered $event) {
        global $DB;

        $eventdata = $event->get_data();
        $other = $eventdata['other'];

        // Check if answer is correct
        $is_correct = false;
        if (isset($other['correct']) || isset($other['fraction'])) {
            $is_correct = isset($other['correct']) ? $other['correct'] : ($other['fraction'] >= 1.0);
        }

        $data = [
            'correct' => $is_correct,
            'fraction' => $other['fraction'] ?? null,
            'response' => $other['response'] ?? null,
        ];

        self::track_event($event, 'question_answered', $data);
    }

    /**
     * Observer for quiz question viewed event
     *
     * @param \mod_quiz\event\question_viewed $event
     */
    public static function question_viewed(\mod_quiz\event\question_viewed $event) {
        self::track_event($event, 'question_viewed');
    }

    /**
     * Observer for course module viewed event
     *
     * @param \core\event\course_module_viewed $event
     */
    public static function course_module_viewed(\core\event\course_module_viewed $event) {
        self::track_event($event, 'module_viewed');
    }

    /**
     * Generic event tracking method
     *
     * @param \core\event\base $event Moodle event
     * @param string $eventtype Event type label
     * @param array $additional_data Additional data to store
     */
    private static function track_event($event, $eventtype, $additional_data = []) {
        global $DB;

        $eventdata = $event->get_data();

        // Prepare tracking record
        $record = new \stdClass();
        $record->userid = $eventdata['userid'];
        $record->courseid = $eventdata['courseid'];
        $record->cmid = $eventdata['contextinstanceid'] ?? 0;
        $record->eventtype = $eventtype;
        $record->timestamp = $eventdata['timecreated'];
        $record->timecreated = time();

        // Add attempt ID if available
        if (isset($eventdata['other']['attemptid'])) {
            $record->attemptid = $eventdata['other']['attemptid'];
        }

        // Add question ID if available
        if (isset($eventdata['other']['questionid'])) {
            $record->questionid = $eventdata['other']['questionid'];
        } else if (isset($eventdata['objectid']) && $eventdata['target'] === 'question') {
            $record->questionid = $eventdata['objectid'];
        }

        // Merge additional data
        $event_data = array_merge([
            'contextlevel' => $eventdata['contextlevel'] ?? null,
            'component' => $eventdata['component'] ?? null,
            'action' => $eventdata['action'] ?? null,
        ], $additional_data);

        $record->eventdata = json_encode($event_data);

        try {
            $DB->insert_record('local_flowmoments_tracking', $record);
        } catch (\Exception $e) {
            // Log error but don't disrupt normal flow
            debugging('Failed to track flow moment event: ' . $e->getMessage(), DEBUG_NORMAL);
        }
    }

    /**
     * Analyze flow for a completed quiz attempt
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    private static function analyze_flow_for_attempt($event) {
        global $DB;

        $eventdata = $event->get_data();
        $userid = $eventdata['userid'];
        $courseid = $eventdata['courseid'];
        $cmid = $eventdata['contextinstanceid'];
        $attemptid = $eventdata['other']['attemptid'] ?? null;

        if (!$attemptid) {
            return;
        }

        try {
            // Get attempt data to determine time range
            $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);
            if (!$attempt) {
                return;
            }

            $timestart = $attempt->timestart;
            $timeend = $attempt->timefinish;

            // Run flow detection
            $detector = new flow_detector();
            $flow_moments = $detector->detect_flow_moments($userid, $courseid, $cmid, $timestart, $timeend);

            // Save detected flow moments
            foreach ($flow_moments as $flow_moment) {
                $flow_moment['attemptid'] = $attemptid;
                $detector->save_flow_moment($flow_moment);
            }

            // Update summary statistics
            self::update_flow_summary($userid, $courseid, $flow_moments);

        } catch (\Exception $e) {
            debugging('Failed to analyze flow for attempt: ' . $e->getMessage(), DEBUG_NORMAL);
        }
    }

    /**
     * Update flow summary statistics
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $flow_moments Detected flow moments
     */
    private static function update_flow_summary($userid, $courseid, $flow_moments) {
        global $DB;

        if (empty($flow_moments)) {
            return;
        }

        // Check if summary record exists
        $summary = $DB->get_record('local_flowmoments_summary', [
            'userid' => $userid,
            'courseid' => $courseid,
        ]);

        if (!$summary) {
            // Create new summary
            $summary = new \stdClass();
            $summary->userid = $userid;
            $summary->courseid = $courseid;
            $summary->totalflowmoments = 0;
            $summary->avgflowscore = 0;
            $summary->totalflowtime = 0;
            $summary->lastflowtime = null;
            $summary->timecreated = time();
        }

        // Update summary with new flow moments
        foreach ($flow_moments as $moment) {
            $summary->totalflowmoments++;
            $summary->totalflowtime += $moment['duration'];
            $summary->lastflowtime = $moment['endtime'];
        }

        // Recalculate average flow score
        $all_moments = $DB->get_records('local_flowmoments_detected', [
            'userid' => $userid,
            'courseid' => $courseid,
        ]);

        if (!empty($all_moments)) {
            $total_score = 0;
            foreach ($all_moments as $moment) {
                $total_score += $moment->flowscore;
            }
            $summary->avgflowscore = $total_score / count($all_moments);
        }

        $summary->timemodified = time();

        // Insert or update
        if (isset($summary->id)) {
            $DB->update_record('local_flowmoments_summary', $summary);
        } else {
            $DB->insert_record('local_flowmoments_summary', $summary);
        }
    }
}
