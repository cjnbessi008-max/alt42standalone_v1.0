<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * API for managing misconception feedback
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_missedquestionfeedback;

defined('MOODLE_INTERNAL') || die();

/**
 * API class for missed question feedback operations
 */
class api {

    /**
     * Get feedback for a question attempt
     *
     * @param int $questionattemptid Question attempt ID
     * @param int $questionid Question ID
     * @param int $selectedanswerid Selected answer ID (if applicable)
     * @return object|null Misconception object or null if none found
     */
    public static function get_feedback_for_attempt($questionattemptid, $questionid, $selectedanswerid = null) {
        global $DB;

        // First try to find a specific answer mapping
        if ($selectedanswerid) {
            $mapping = $DB->get_record('missed_feedback_qmapping',
                ['questionid' => $questionid, 'answerid' => $selectedanswerid],
                '*', IGNORE_MULTIPLE);

            if ($mapping) {
                return self::get_misconception($mapping->misconceptionid);
            }
        }

        // Fall back to generic question mapping (any wrong answer)
        $mapping = $DB->get_record('missed_feedback_qmapping',
            ['questionid' => $questionid, 'answerid' => null],
            '*', IGNORE_MULTIPLE);

        if ($mapping) {
            return self::get_misconception($mapping->misconceptionid);
        }

        return null;
    }

    /**
     * Get a misconception by ID
     *
     * @param int $misconceptionid Misconception ID
     * @return object|null Misconception object with concept data
     */
    public static function get_misconception($misconceptionid) {
        global $DB;

        $sql = "SELECT m.*, c.name as conceptname, c.category as conceptcategory
                FROM {missed_feedback_misconceptions} m
                JOIN {missed_feedback_concepts} c ON m.conceptid = c.id
                WHERE m.id = :id";

        return $DB->get_record_sql($sql, ['id' => $misconceptionid]);
    }

    /**
     * Create or update a concept
     *
     * @param object $data Concept data
     * @return int Concept ID
     */
    public static function save_concept($data) {
        global $DB;

        $data->timemodified = time();

        if (!empty($data->id)) {
            $DB->update_record('missed_feedback_concepts', $data);
            return $data->id;
        } else {
            $data->timecreated = time();
            return $DB->insert_record('missed_feedback_concepts', $data);
        }
    }

    /**
     * Delete a concept and all associated misconceptions
     *
     * @param int $conceptid Concept ID
     * @return bool Success
     */
    public static function delete_concept($conceptid) {
        global $DB;

        // Get all misconception IDs for this concept
        $misconceptions = $DB->get_records('missed_feedback_misconceptions',
            ['conceptid' => $conceptid], '', 'id');

        foreach ($misconceptions as $misconception) {
            self::delete_misconception($misconception->id);
        }

        return $DB->delete_records('missed_feedback_concepts', ['id' => $conceptid]);
    }

    /**
     * Get all concepts
     *
     * @param string $category Optional category filter
     * @return array Array of concept objects
     */
    public static function get_concepts($category = null) {
        global $DB;

        if ($category) {
            return $DB->get_records('missed_feedback_concepts', ['category' => $category], 'name ASC');
        }

        return $DB->get_records('missed_feedback_concepts', null, 'name ASC');
    }

    /**
     * Get a concept by ID
     *
     * @param int $conceptid Concept ID
     * @return object|false Concept object
     */
    public static function get_concept($conceptid) {
        global $DB;
        return $DB->get_record('missed_feedback_concepts', ['id' => $conceptid]);
    }

    /**
     * Create or update a misconception
     *
     * @param object $data Misconception data
     * @return int Misconception ID
     */
    public static function save_misconception($data) {
        global $DB;

        $data->timemodified = time();

        if (!empty($data->id)) {
            $DB->update_record('missed_feedback_misconceptions', $data);
            return $data->id;
        } else {
            $data->timecreated = time();
            return $DB->insert_record('missed_feedback_misconceptions', $data);
        }
    }

    /**
     * Delete a misconception and all associated mappings
     *
     * @param int $misconceptionid Misconception ID
     * @return bool Success
     */
    public static function delete_misconception($misconceptionid) {
        global $DB;

        // Delete all question mappings
        $DB->delete_records('missed_feedback_qmapping', ['misconceptionid' => $misconceptionid]);

        // Delete the misconception
        return $DB->delete_records('missed_feedback_misconceptions', ['id' => $misconceptionid]);
    }

    /**
     * Get misconceptions for a concept
     *
     * @param int $conceptid Concept ID
     * @return array Array of misconception objects
     */
    public static function get_misconceptions_by_concept($conceptid) {
        global $DB;
        return $DB->get_records('missed_feedback_misconceptions',
            ['conceptid' => $conceptid], 'severity DESC, name ASC');
    }

    /**
     * Get all misconceptions
     *
     * @return array Array of misconception objects with concept names
     */
    public static function get_all_misconceptions() {
        global $DB;

        $sql = "SELECT m.*, c.name as conceptname
                FROM {missed_feedback_misconceptions} m
                JOIN {missed_feedback_concepts} c ON m.conceptid = c.id
                ORDER BY c.name ASC, m.severity DESC, m.name ASC";

        return $DB->get_records_sql($sql);
    }

    /**
     * Create a question-misconception mapping
     *
     * @param int $questionid Question ID
     * @param int $misconceptionid Misconception ID
     * @param int|null $answerid Answer ID (null for any wrong answer)
     * @param int $priority Priority (default 1)
     * @return int Mapping ID
     */
    public static function create_question_mapping($questionid, $misconceptionid, $answerid = null, $priority = 1) {
        global $DB;

        $data = new \stdClass();
        $data->questionid = $questionid;
        $data->misconceptionid = $misconceptionid;
        $data->answerid = $answerid;
        $data->priority = $priority;
        $data->timecreated = time();
        $data->timemodified = time();

        return $DB->insert_record('missed_feedback_qmapping', $data);
    }

    /**
     * Get question mappings for a question
     *
     * @param int $questionid Question ID
     * @return array Array of mapping objects
     */
    public static function get_question_mappings($questionid) {
        global $DB;

        $sql = "SELECT qm.*, m.name as misconceptionname, c.name as conceptname
                FROM {missed_feedback_qmapping} qm
                JOIN {missed_feedback_misconceptions} m ON qm.misconceptionid = m.id
                JOIN {missed_feedback_concepts} c ON m.conceptid = c.id
                WHERE qm.questionid = :questionid
                ORDER BY qm.priority DESC";

        return $DB->get_records_sql($sql, ['questionid' => $questionid]);
    }

    /**
     * Log a feedback interaction
     *
     * @param int $userid User ID
     * @param int $questionattemptid Question attempt ID
     * @param int $quizattemptid Quiz attempt ID
     * @param int $misconceptionid Misconception ID
     * @return int Interaction ID
     */
    public static function log_interaction($userid, $questionattemptid, $quizattemptid, $misconceptionid) {
        global $DB;

        $data = new \stdClass();
        $data->userid = $userid;
        $data->questionattemptid = $questionattemptid;
        $data->quizattemptid = $quizattemptid;
        $data->misconceptionid = $misconceptionid;
        $data->viewed = 1;
        $data->timeviewed = time();
        $data->timecreated = time();

        return $DB->insert_record('missed_feedback_interactions', $data);
    }

    /**
     * Update interaction with time spent and resource click
     *
     * @param int $interactionid Interaction ID
     * @param int $timespent Time spent in seconds
     * @param bool $resourceclicked Whether resource was clicked
     * @return bool Success
     */
    public static function update_interaction($interactionid, $timespent = null, $resourceclicked = false) {
        global $DB;

        $data = new \stdClass();
        $data->id = $interactionid;

        if ($timespent !== null) {
            $data->timespent = $timespent;
        }

        if ($resourceclicked) {
            $data->resourceclicked = 1;
        }

        return $DB->update_record('missed_feedback_interactions', $data);
    }

    /**
     * Get analytics data for a course
     *
     * @param int $courseid Course ID
     * @param int $timestart Start time (optional)
     * @param int $timeend End time (optional)
     * @return array Analytics data
     */
    public static function get_course_analytics($courseid, $timestart = null, $timeend = null) {
        global $DB;

        $params = ['courseid' => $courseid];
        $timewhere = '';

        if ($timestart) {
            $timewhere .= ' AND i.timecreated >= :timestart';
            $params['timestart'] = $timestart;
        }

        if ($timeend) {
            $timewhere .= ' AND i.timecreated <= :timeend';
            $params['timeend'] = $timeend;
        }

        // Most common misconceptions
        $sql = "SELECT m.id, m.name, c.name as conceptname, COUNT(i.id) as occurrences
                FROM {missed_feedback_interactions} i
                JOIN {missed_feedback_misconceptions} m ON i.misconceptionid = m.id
                JOIN {missed_feedback_concepts} c ON m.conceptid = c.id
                JOIN {quiz_attempts} qa ON i.quizattemptid = qa.id
                JOIN {quiz} q ON qa.quiz = q.id
                WHERE q.course = :courseid $timewhere
                GROUP BY m.id, m.name, c.name
                ORDER BY occurrences DESC
                LIMIT 10";

        $commonmisconceptions = $DB->get_records_sql($sql, $params);

        // Engagement metrics
        $sql = "SELECT
                    COUNT(DISTINCT i.userid) as uniquestudents,
                    COUNT(i.id) as totalviews,
                    SUM(i.resourceclicked) as resourceclicks,
                    AVG(i.timespent) as avgtimespent
                FROM {missed_feedback_interactions} i
                JOIN {quiz_attempts} qa ON i.quizattemptid = qa.id
                JOIN {quiz} q ON qa.quiz = q.id
                WHERE q.course = :courseid $timewhere";

        $engagement = $DB->get_record_sql($sql, $params);

        return [
            'common_misconceptions' => $commonmisconceptions,
            'engagement' => $engagement
        ];
    }
}
