<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace local_confidence;

defined('MOODLE_INTERNAL') || die();

/**
 * Score management class
 *
 * @package    local_confidence
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class score_manager {

    /**
     * Submit or update a confidence score
     *
     * @param int $userid User ID
     * @param int $conceptid Concept ID
     * @param int $score Score (1-5)
     * @param string $comment Optional comment
     * @return bool Success
     * @throws \invalid_parameter_exception
     */
    public static function submit_score($userid, $conceptid, $score, $comment = '') {
        global $DB;

        // Validate score range
        if (!is_numeric($score) || $score < 1 || $score > 5) {
            throw new \invalid_parameter_exception('Score must be between 1 and 5');
        }

        // Validate comment length
        if (strlen($comment) > 500) {
            throw new \invalid_parameter_exception('Comment is too long (max 500 characters)');
        }

        // Get concept to retrieve courseid
        $concept = $DB->get_record('local_confidence_concepts', array('id' => $conceptid), '*', MUST_EXIST);

        // Check if score already exists
        $existing = $DB->get_record('local_confidence_scores', array(
            'userid' => $userid,
            'conceptid' => $conceptid
        ));

        $now = time();

        if ($existing) {
            // Update existing score
            $oldscore = $existing->score;
            $existing->score = $score;
            $existing->comment = $comment;
            $existing->timemodified = $now;

            $result = $DB->update_record('local_confidence_scores', $existing);

            if ($result) {
                // Save history
                self::save_history($existing->id, $userid, $conceptid, $oldscore, $score, $comment);

                // Trigger event
                $event = \local_confidence\event\score_updated::create(array(
                    'objectid' => $existing->id,
                    'relateduserid' => $userid,
                    'context' => \context_course::instance($concept->courseid),
                    'other' => array(
                        'conceptid' => $conceptid,
                        'oldscore' => $oldscore,
                        'newscore' => $score
                    )
                ));
                $event->trigger();
            }

        } else {
            // Create new score
            $scorerecord = new \stdClass();
            $scorerecord->userid = $userid;
            $scorerecord->conceptid = $conceptid;
            $scorerecord->courseid = $concept->courseid;
            $scorerecord->score = $score;
            $scorerecord->comment = $comment;
            $scorerecord->timecreated = $now;
            $scorerecord->timemodified = $now;

            $scorerecord->id = $DB->insert_record('local_confidence_scores', $scorerecord);

            if ($scorerecord->id) {
                // Save history
                self::save_history($scorerecord->id, $userid, $conceptid, null, $score, $comment);

                // Trigger event
                $event = \local_confidence\event\score_submitted::create(array(
                    'objectid' => $scorerecord->id,
                    'relateduserid' => $userid,
                    'context' => \context_course::instance($concept->courseid),
                    'other' => array(
                        'conceptid' => $conceptid,
                        'score' => $score
                    )
                ));
                $event->trigger();

                $result = true;
            } else {
                $result = false;
            }
        }

        return $result;
    }

    /**
     * Get all scores for a user in a course
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Array of concept objects with scores
     */
    public static function get_user_scores($userid, $courseid) {
        global $DB;

        $sql = "SELECT c.id, c.conceptname, c.description, c.category, c.displayorder,
                       s.score, s.comment, s.timemodified
                FROM {local_confidence_concepts} c
                LEFT JOIN {local_confidence_scores} s
                    ON c.id = s.conceptid AND s.userid = :userid
                WHERE c.courseid = :courseid
                ORDER BY c.displayorder ASC, c.conceptname ASC";

        return $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid
        ));
    }

    /**
     * Get score history for a user and concept
     *
     * @param int $userid User ID
     * @param int $conceptid Concept ID
     * @return array Array of history records
     */
    public static function get_score_history($userid, $conceptid) {
        global $DB;

        $sql = "SELECT h.*
                FROM {local_confidence_history} h
                WHERE h.userid = :userid AND h.conceptid = :conceptid
                ORDER BY h.timecreated ASC";

        return $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'conceptid' => $conceptid
        ));
    }

    /**
     * Get a specific score
     *
     * @param int $userid User ID
     * @param int $conceptid Concept ID
     * @return object|false Score object or false
     */
    public static function get_score($userid, $conceptid) {
        global $DB;

        return $DB->get_record('local_confidence_scores', array(
            'userid' => $userid,
            'conceptid' => $conceptid
        ));
    }

    /**
     * Delete a score
     *
     * @param int $scoreid Score ID
     * @return bool Success
     */
    public static function delete_score($scoreid) {
        global $DB;

        // Delete history first
        $DB->delete_records('local_confidence_history', array('scoreid' => $scoreid));

        // Delete score
        return $DB->delete_records('local_confidence_scores', array('id' => $scoreid));
    }

    /**
     * Save score change to history
     *
     * @param int $scoreid Score ID
     * @param int $userid User ID
     * @param int $conceptid Concept ID
     * @param int|null $oldscore Old score value
     * @param int $newscore New score value
     * @param string $comment Comment
     * @return int History record ID
     */
    private static function save_history($scoreid, $userid, $conceptid, $oldscore, $newscore, $comment) {
        global $DB;

        $history = new \stdClass();
        $history->scoreid = $scoreid;
        $history->userid = $userid;
        $history->conceptid = $conceptid;
        $history->oldscore = $oldscore;
        $history->newscore = $newscore;
        $history->comment = $comment;
        $history->timecreated = time();

        return $DB->insert_record('local_confidence_history', $history);
    }

    /**
     * Get user's average confidence for a course
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return float Average score
     */
    public static function get_user_average($userid, $courseid) {
        global $DB;

        $sql = "SELECT AVG(score) as avg_score
                FROM {local_confidence_scores}
                WHERE userid = :userid AND courseid = :courseid";

        $result = $DB->get_record_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid
        ));

        return $result && $result->avg_score ? round($result->avg_score, 2) : 0;
    }

    /**
     * Get low confidence concepts for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $threshold Score threshold (default 2)
     * @return array Array of concept objects
     */
    public static function get_low_confidence_concepts($userid, $courseid, $threshold = 2) {
        global $DB;

        $sql = "SELECT c.id, c.conceptname, s.score, s.comment
                FROM {local_confidence_concepts} c
                JOIN {local_confidence_scores} s ON c.id = s.conceptid
                WHERE s.userid = :userid AND c.courseid = :courseid AND s.score <= :threshold
                ORDER BY s.score ASC, c.conceptname ASC";

        return $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid,
            'threshold' => $threshold
        ));
    }
}
