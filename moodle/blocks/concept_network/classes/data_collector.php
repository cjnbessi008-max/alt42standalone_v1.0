<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace block_concept_network;

defined('MOODLE_INTERNAL') || die();

/**
 * Data Collector - Collects student activity data from Moodle
 *
 * @package    block_concept_network
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class data_collector {

    /** @var int Course ID */
    private $courseid;

    /** @var int Student ID */
    private $studentid;

    /** @var object Database instance */
    private $db;

    /**
     * Constructor
     *
     * @param int $courseid Course ID
     * @param int $studentid Student ID
     */
    public function __construct($courseid, $studentid) {
        global $DB;
        $this->courseid = $courseid;
        $this->studentid = $studentid;
        $this->db = $DB;
    }

    /**
     * Collect all activity data for the student
     *
     * @return array Array of activity data
     */
    public function collect_all_activities() {
        $activities = array();

        // Collect quiz attempts
        $activities['quiz'] = $this->collect_quiz_attempts();

        // Collect assignment submissions
        $activities['assign'] = $this->collect_assignment_submissions();

        // Collect forum posts
        $activities['forum'] = $this->collect_forum_posts();

        // Collect lesson attempts
        $activities['lesson'] = $this->collect_lesson_attempts();

        return $activities;
    }

    /**
     * Collect quiz attempts and scores
     *
     * @return array Array of quiz attempt data
     */
    private function collect_quiz_attempts() {
        $sql = "SELECT qa.id as attemptid,
                       q.id as quizid,
                       q.name as quizname,
                       qa.sumgrades as score,
                       q.sumgrades as maxscore,
                       qa.timefinish as timestamp,
                       qa.attempt as attempt_number,
                       (qa.timefinish - qa.timestart) as time_spent
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON q.id = qa.quiz
                WHERE qa.userid = :userid
                  AND q.course = :courseid
                  AND qa.state = 'finished'
                ORDER BY qa.timefinish ASC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        $attempts = $this->db->get_records_sql($sql, $params);

        // Get question details for each attempt
        foreach ($attempts as &$attempt) {
            $attempt->questions = $this->get_quiz_questions($attempt->quizid);
        }

        return array_values($attempts);
    }

    /**
     * Get quiz questions with tags/concepts
     *
     * @param int $quizid Quiz ID
     * @return array Array of questions
     */
    private function get_quiz_questions($quizid) {
        $sql = "SELECT q.id,
                       q.name,
                       q.qtype,
                       qs.slot,
                       qs.maxmark
                FROM {quiz_slots} qs
                JOIN {question} q ON q.id = qs.questionid
                WHERE qs.quizid = :quizid
                ORDER BY qs.slot ASC";

        $questions = $this->db->get_records_sql($sql, array('quizid' => $quizid));

        // Get tags for each question
        foreach ($questions as &$question) {
            $question->tags = \core_tag_tag::get_item_tags_array('core_question', 'question', $question->id);
        }

        return array_values($questions);
    }

    /**
     * Collect assignment submissions and grades
     *
     * @return array Array of assignment submission data
     */
    private function collect_assignment_submissions() {
        $sql = "SELECT a.id as assignid,
                       a.name as assignname,
                       asub.id as submissionid,
                       ag.grade as score,
                       a.grade as maxscore,
                       asub.timemodified as timestamp,
                       asub.attemptnumber as attempt_number
                FROM {assign_submission} asub
                JOIN {assign} a ON a.id = asub.assignment
                LEFT JOIN {assign_grades} ag ON ag.assignment = a.id AND ag.userid = asub.userid
                WHERE asub.userid = :userid
                  AND a.course = :courseid
                  AND asub.status = 'submitted'
                ORDER BY asub.timemodified ASC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        return array_values($this->db->get_records_sql($sql, $params));
    }

    /**
     * Collect forum posts
     *
     * @return array Array of forum post data
     */
    private function collect_forum_posts() {
        $sql = "SELECT fp.id as postid,
                       f.id as forumid,
                       f.name as forumname,
                       fd.name as discussionname,
                       fp.message,
                       fp.created as timestamp,
                       LENGTH(fp.message) as message_length
                FROM {forum_posts} fp
                JOIN {forum_discussions} fd ON fd.id = fp.discussion
                JOIN {forum} f ON f.id = fd.forum
                WHERE fp.userid = :userid
                  AND f.course = :courseid
                ORDER BY fp.created ASC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        $posts = $this->db->get_records_sql($sql, $params);

        // Extract keywords from posts for concept extraction
        foreach ($posts as &$post) {
            $post->keywords = $this->extract_keywords($post->message);
        }

        return array_values($posts);
    }

    /**
     * Collect lesson attempts
     *
     * @return array Array of lesson attempt data
     */
    private function collect_lesson_attempts() {
        $sql = "SELECT l.id as lessonid,
                       l.name as lessonname,
                       lg.grade as score,
                       l.grade as maxscore,
                       lg.completed as timestamp,
                       COUNT(DISTINCT la.id) as attempt_number
                FROM {lesson_grades} lg
                JOIN {lesson} l ON l.id = lg.lessonid
                LEFT JOIN {lesson_attempts} la ON la.lessonid = l.id AND la.userid = lg.userid
                WHERE lg.userid = :userid
                  AND l.course = :courseid
                GROUP BY l.id, l.name, lg.grade, l.grade, lg.completed
                ORDER BY lg.completed ASC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        return array_values($this->db->get_records_sql($sql, $params));
    }

    /**
     * Extract keywords from text for concept identification
     *
     * @param string $text Text to analyze
     * @return array Array of keywords
     */
    private function extract_keywords($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Convert to lowercase
        $text = strtolower($text);

        // Remove punctuation
        $text = preg_replace('/[^\w\s가-힣]/', ' ', $text);

        // Split into words
        $words = preg_split('/\s+/', $text);

        // Filter out common stop words and short words
        $stopwords = array('the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'a', 'an');
        $keywords = array();

        foreach ($words as $word) {
            if (strlen($word) > 2 && !in_array($word, $stopwords)) {
                if (!isset($keywords[$word])) {
                    $keywords[$word] = 0;
                }
                $keywords[$word]++;
            }
        }

        // Sort by frequency
        arsort($keywords);

        // Return top 10 keywords
        return array_slice(array_keys($keywords), 0, 10);
    }

    /**
     * Get resource access patterns
     *
     * @return array Array of resource access data
     */
    public function collect_resource_access() {
        $sql = "SELECT cm.id as cmid,
                       cm.module as modname,
                       cm.instance as instanceid,
                       COUNT(l.id) as access_count,
                       MIN(l.timecreated) as first_access,
                       MAX(l.timecreated) as last_access,
                       AVG(l.timecreated) as avg_access_time
                FROM {logstore_standard_log} l
                JOIN {course_modules} cm ON cm.id = l.contextinstanceid
                WHERE l.userid = :userid
                  AND l.courseid = :courseid
                  AND l.action = 'viewed'
                  AND l.target = 'course_module'
                GROUP BY cm.id, cm.module, cm.instance
                ORDER BY access_count DESC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        return array_values($this->db->get_records_sql($sql, $params));
    }

    /**
     * Get time spent on activities (from logs)
     *
     * @return array Array of time spent data
     */
    public function collect_time_spent() {
        $sql = "SELECT cm.id as cmid,
                       cm.module as modname,
                       SUM(CASE
                           WHEN LEAD(l.timecreated) OVER (ORDER BY l.timecreated) - l.timecreated < 3600
                           THEN LEAD(l.timecreated) OVER (ORDER BY l.timecreated) - l.timecreated
                           ELSE 0
                       END) as time_spent
                FROM {logstore_standard_log} l
                JOIN {course_modules} cm ON cm.id = l.contextinstanceid
                WHERE l.userid = :userid
                  AND l.courseid = :courseid
                  AND l.action = 'viewed'
                GROUP BY cm.id, cm.module";

        // Note: Above SQL uses window functions (LEAD) which may not work in all MySQL 5.7 versions
        // Fallback to simpler time estimation if needed

        // Simple alternative: estimate session time based on sequential logs
        $logs = $this->get_activity_logs();
        $timespent = array();

        $previous = null;
        foreach ($logs as $log) {
            if ($previous && ($log->timecreated - $previous->timecreated < 3600)) {
                $duration = $log->timecreated - $previous->timecreated;
                $key = $previous->cmid . '_' . $previous->modname;
                if (!isset($timespent[$key])) {
                    $timespent[$key] = array(
                        'cmid' => $previous->cmid,
                        'modname' => $previous->modname,
                        'time_spent' => 0
                    );
                }
                $timespent[$key]['time_spent'] += $duration;
            }
            $previous = $log;
        }

        return array_values($timespent);
    }

    /**
     * Get activity logs for time calculation
     *
     * @return array Array of log records
     */
    private function get_activity_logs() {
        $sql = "SELECT l.id,
                       l.timecreated,
                       cm.id as cmid,
                       cm.module as modname
                FROM {logstore_standard_log} l
                JOIN {course_modules} cm ON cm.id = l.contextinstanceid
                WHERE l.userid = :userid
                  AND l.courseid = :courseid
                  AND l.action = 'viewed'
                  AND l.target = 'course_module'
                ORDER BY l.timecreated ASC";

        $params = array(
            'userid' => $this->studentid,
            'courseid' => $this->courseid
        );

        return array_values($this->db->get_records_sql($sql, $params));
    }
}
