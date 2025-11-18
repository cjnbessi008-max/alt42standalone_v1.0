<?php
/**
 * Moodle API Connector for Concept Detection
 *
 * Collects student activity data from Moodle core functions
 *
 * @package    local_conceptdetection
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_conceptdetection\api;

defined('MOODLE_INTERNAL') || die();

class moodle_connector {

    /**
     * Get student activity for a specific course
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $timefrom Optional start time
     * @return array Student activity data
     */
    public static function get_student_activity($userid, $courseid, $timefrom = 0) {
        global $DB;

        $activities = array();

        // Get quiz attempts
        $sql = "SELECT qa.id, qa.quiz, qa.timestart, qa.timefinish, qa.sumgrades, q.name, q.grade
                FROM {quiz_attempts} qa
                JOIN {quiz} q ON q.id = qa.quiz
                WHERE qa.userid = :userid
                AND q.course = :courseid
                AND qa.timestart >= :timefrom
                ORDER BY qa.timestart DESC";

        $quiz_attempts = $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid,
            'timefrom' => $timefrom
        ));

        foreach ($quiz_attempts as $attempt) {
            $activities[] = array(
                'type' => 'quiz',
                'moduleid' => $attempt->quiz,
                'name' => $attempt->name,
                'timestart' => $attempt->timestart,
                'timefinish' => $attempt->timefinish,
                'duration' => $attempt->timefinish - $attempt->timestart,
                'score' => ($attempt->grade > 0) ? ($attempt->sumgrades / $attempt->grade) * 100 : 0,
                'rawscore' => $attempt->sumgrades,
                'maxscore' => $attempt->grade
            );
        }

        // Get assignment submissions
        $sql = "SELECT asub.id, asub.assignment, asub.timemodified, asub.timecreated,
                       a.name, ag.grade, a.grade as maxgrade
                FROM {assign_submission} asub
                JOIN {assign} a ON a.id = asub.assignment
                LEFT JOIN {assign_grades} ag ON ag.assignment = asub.assignment AND ag.userid = asub.userid
                WHERE asub.userid = :userid
                AND a.course = :courseid
                AND asub.timecreated >= :timefrom
                ORDER BY asub.timecreated DESC";

        $assign_submissions = $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid,
            'timefrom' => $timefrom
        ));

        foreach ($assign_submissions as $submission) {
            $score = 0;
            if ($submission->grade !== null && $submission->maxgrade > 0) {
                $score = ($submission->grade / $submission->maxgrade) * 100;
            }

            $activities[] = array(
                'type' => 'assignment',
                'moduleid' => $submission->assignment,
                'name' => $submission->name,
                'timestart' => $submission->timecreated,
                'timefinish' => $submission->timemodified,
                'duration' => $submission->timemodified - $submission->timecreated,
                'score' => $score,
                'rawscore' => $submission->grade,
                'maxscore' => $submission->maxgrade
            );
        }

        return $activities;
    }

    /**
     * Get quiz question attempts with details
     *
     * @param int $userid User ID
     * @param int $quizid Quiz ID
     * @return array Question attempt details
     */
    public static function get_quiz_question_attempts($userid, $quizid) {
        global $DB;

        $sql = "SELECT qa.id as attemptid, qa.timestart, qa.timefinish,
                       qua.slot, qua.questionid, qua.rightanswer, qua.responsesummary,
                       qua.maxmark, qua.minfraction, qua.maxfraction, qua.fraction,
                       q.name, q.questiontext, q.qtype
                FROM {quiz_attempts} qa
                JOIN {question_attempts} qua ON qua.questionusageid = qa.uniqueid
                JOIN {question} q ON q.id = qua.questionid
                WHERE qa.userid = :userid
                AND qa.quiz = :quizid
                ORDER BY qa.timestart DESC, qua.slot ASC";

        $attempts = $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'quizid' => $quizid
        ));

        $results = array();
        foreach ($attempts as $attempt) {
            $results[] = array(
                'attemptid' => $attempt->attemptid,
                'questionid' => $attempt->questionid,
                'questionname' => $attempt->name,
                'questiontext' => $attempt->questiontext,
                'questiontype' => $attempt->qtype,
                'slot' => $attempt->slot,
                'timestart' => $attempt->timestart,
                'timefinish' => $attempt->timefinish,
                'score' => $attempt->fraction * 100,
                'maxmark' => $attempt->maxmark,
                'rightanswer' => $attempt->rightanswer,
                'studentanswer' => $attempt->responsesummary
            );
        }

        return $results;
    }

    /**
     * Get student page views and interactions
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $timefrom Optional start time
     * @return array Log entries
     */
    public static function get_student_logs($userid, $courseid, $timefrom = 0) {
        global $DB;

        // Moodle 3.7 uses the logstore_standard plugin
        $sql = "SELECT id, timecreated, eventname, component, action, target,
                       objecttable, objectid, contextid, contextlevel
                FROM {logstore_standard_log}
                WHERE userid = :userid
                AND courseid = :courseid
                AND timecreated >= :timefrom
                ORDER BY timecreated DESC";

        $logs = $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid,
            'timefrom' => $timefrom
        ));

        $results = array();
        foreach ($logs as $log) {
            $results[] = array(
                'id' => $log->id,
                'time' => $log->timecreated,
                'event' => $log->eventname,
                'component' => $log->component,
                'action' => $log->action,
                'target' => $log->target,
                'objecttable' => $log->objecttable,
                'objectid' => $log->objectid,
                'contextid' => $log->contextid
            );
        }

        return $results;
    }

    /**
     * Get course concepts (from course structure and tags)
     *
     * @param int $courseid Course ID
     * @return array Course concepts
     */
    public static function get_course_concepts($courseid) {
        global $DB;

        $concepts = array();

        // Get concepts from quiz questions (using tags and categories)
        $sql = "SELECT DISTINCT q.id, q.name, q.questiontext, q.qtype,
                       qc.name as category, qc.contextid
                FROM {question} q
                JOIN {question_categories} qc ON qc.id = q.category
                JOIN {context} ctx ON ctx.id = qc.contextid
                WHERE ctx.contextlevel = 50
                AND ctx.instanceid = :courseid";

        $questions = $DB->get_records_sql($sql, array('courseid' => $courseid));

        foreach ($questions as $question) {
            // Extract concepts from question category names
            $concepts[] = array(
                'source' => 'quiz',
                'sourceid' => $question->id,
                'name' => $question->category,
                'type' => $question->qtype,
                'keywords' => self::extract_keywords($question->questiontext)
            );
        }

        // Get concepts from course sections and activities
        $sections = $DB->get_records('course_sections', array('course' => $courseid));
        foreach ($sections as $section) {
            if (!empty($section->name)) {
                $concepts[] = array(
                    'source' => 'section',
                    'sourceid' => $section->id,
                    'name' => $section->name,
                    'type' => 'section',
                    'keywords' => self::extract_keywords($section->name . ' ' . $section->summary)
                );
            }
        }

        return $concepts;
    }

    /**
     * Extract keywords from text for concept matching
     *
     * @param string $text Input text
     * @return array Keywords
     */
    private static function extract_keywords($text) {
        // Remove HTML tags
        $text = strip_tags($text);

        // Simple keyword extraction (can be enhanced with NLP)
        $words = preg_split('/\s+/', strtolower($text));

        // Filter out common words and short words
        $stopwords = array('the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are');
        $keywords = array();

        foreach ($words as $word) {
            $word = preg_replace('/[^a-z0-9가-힣]/', '', $word);
            if (strlen($word) > 2 && !in_array($word, $stopwords)) {
                $keywords[] = $word;
            }
        }

        return array_unique($keywords);
    }

    /**
     * Get student's time spent on activities
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param string $moduletype Module type (quiz, assign, etc)
     * @param int $moduleid Module instance ID
     * @return int Time spent in seconds
     */
    public static function calculate_time_spent($userid, $courseid, $moduletype, $moduleid) {
        global $DB;

        $timespent = 0;

        // Get logs for the specific module
        $sql = "SELECT timecreated
                FROM {logstore_standard_log}
                WHERE userid = :userid
                AND courseid = :courseid
                AND component = :component
                AND (objectid = :moduleid OR contextinstanceid = :moduleid2)
                ORDER BY timecreated ASC";

        $component = 'mod_' . $moduletype;

        $logs = $DB->get_records_sql($sql, array(
            'userid' => $userid,
            'courseid' => $courseid,
            'component' => $component,
            'moduleid' => $moduleid,
            'moduleid2' => $moduleid
        ));

        if (empty($logs)) {
            return 0;
        }

        // Calculate time spent by grouping consecutive logs
        $logs_array = array_values($logs);
        $session_gap = 1800; // 30 minutes gap = new session

        for ($i = 0; $i < count($logs_array) - 1; $i++) {
            $gap = $logs_array[$i + 1]->timecreated - $logs_array[$i]->timecreated;
            if ($gap < $session_gap) {
                $timespent += $gap;
            }
        }

        return $timespent;
    }
}
