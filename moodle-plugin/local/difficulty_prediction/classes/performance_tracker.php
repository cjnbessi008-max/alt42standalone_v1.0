<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Performance Tracker
 *
 * Tracks student performance on questions to refine difficulty predictions.
 *
 * @package    local_difficulty_prediction
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_difficulty_prediction;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/difficulty_prediction/classes/difficulty_predictor.php');

/**
 * Class performance_tracker
 *
 * Tracks and analyzes student performance data.
 */
class performance_tracker {

    /**
     * Record a question attempt performance
     *
     * @param int $questionid Question ID
     * @param int $userid User ID
     * @param int $attemptid Quiz attempt ID
     * @param bool $iscorrect Whether answer was correct
     * @param int $timespent Time spent in seconds
     * @return int Record ID
     */
    public static function record_performance($questionid, $userid, $attemptid, $iscorrect, $timespent = 0) {
        global $DB;

        $record = new \stdClass();
        $record->questionid = $questionid;
        $record->userid = $userid;
        $record->attemptid = $attemptid;
        $record->is_correct = $iscorrect ? 1 : 0;
        $record->time_spent = $timespent;
        $record->num_attempts = 1;
        $record->timecreated = time();

        // Check if this user has attempted this question before in this attempt.
        $existing = $DB->get_record('question_performance',
            array('questionid' => $questionid, 'userid' => $userid, 'attemptid' => $attemptid));

        if ($existing) {
            // Update existing record.
            $record->id = $existing->id;
            $record->num_attempts = $existing->num_attempts + 1;
            $record->time_spent = $existing->time_spent + $timespent;
            $DB->update_record('question_performance', $record);
            $recordid = $record->id;
        } else {
            // Insert new record.
            $recordid = $DB->insert_record('question_performance', $record);
        }

        // Trigger difficulty update if enough attempts have accumulated.
        self::maybe_trigger_difficulty_update($questionid);

        return $recordid;
    }

    /**
     * Process quiz attempt and record all performances
     *
     * @param int $attemptid Quiz attempt ID
     * @return int Number of performances recorded
     */
    public static function process_quiz_attempt($attemptid) {
        global $DB;

        // Get attempt details.
        $attempt = $DB->get_record('quiz_attempts', array('id' => $attemptid), '*', MUST_EXIST);

        // Get all question usages for this attempt.
        $sql = "SELECT qa.id, qa.questionid, qa.rightanswer, qa.responsesummary,
                       qas.state, qas.fraction, qas.timecreated
                FROM {question_attempts} qa
                JOIN {question_attempt_steps} qas ON qa.id = qas.questionattemptid
                WHERE qa.questionusageid = :qubaid
                  AND qas.sequencenumber = (
                      SELECT MAX(sequencenumber)
                      FROM {question_attempt_steps}
                      WHERE questionattemptid = qa.id
                  )";

        $questions = $DB->get_records_sql($sql, array('qubaid' => $attempt->uniqueid));

        $count = 0;

        foreach ($questions as $question) {
            // Determine if answer was correct.
            $iscorrect = ($question->fraction >= 1.0);

            // Calculate time spent (approximate from step timing).
            $timespent = self::calculate_time_spent($question->id);

            // Record performance.
            self::record_performance(
                $question->questionid,
                $attempt->userid,
                $attemptid,
                $iscorrect,
                $timespent
            );

            $count++;
        }

        return $count;
    }

    /**
     * Calculate time spent on a question
     *
     * @param int $questionattemptid Question attempt ID
     * @return int Time in seconds
     */
    private static function calculate_time_spent($questionattemptid) {
        global $DB;

        $sql = "SELECT MIN(timecreated) as start_time, MAX(timecreated) as end_time
                FROM {question_attempt_steps}
                WHERE questionattemptid = :qaid";

        $times = $DB->get_record_sql($sql, array('qaid' => $questionattemptid));

        if ($times && $times->start_time && $times->end_time) {
            return max(0, $times->end_time - $times->start_time);
        }

        return 0;
    }

    /**
     * Maybe trigger difficulty update if threshold is reached
     *
     * @param int $questionid
     * @return void
     */
    private static function maybe_trigger_difficulty_update($questionid) {
        global $DB;

        // Check total attempts for this question.
        $sql = "SELECT COUNT(*) as count
                FROM {question_performance}
                WHERE questionid = :questionid";

        $result = $DB->get_record_sql($sql, array('questionid' => $questionid));

        // Update every 10 attempts.
        if ($result && $result->count % 10 == 0) {
            difficulty_predictor::update_from_performance($questionid);
        }
    }

    /**
     * Get student performance analytics for a question
     *
     * @param int $questionid Question ID
     * @return object Analytics data
     */
    public static function get_question_analytics($questionid) {
        global $DB;

        $sql = "SELECT
                    COUNT(*) as total_attempts,
                    SUM(is_correct) as correct_attempts,
                    AVG(time_spent) as avg_time,
                    MIN(time_spent) as min_time,
                    MAX(time_spent) as max_time,
                    AVG(num_attempts) as avg_attempts_per_student
                FROM {question_performance}
                WHERE questionid = :questionid";

        $analytics = $DB->get_record_sql($sql, array('questionid' => $questionid));

        if ($analytics && $analytics->total_attempts > 0) {
            $analytics->success_rate = $analytics->correct_attempts / $analytics->total_attempts;
            $analytics->failure_rate = 1.0 - $analytics->success_rate;
        } else {
            $analytics = new \stdClass();
            $analytics->total_attempts = 0;
            $analytics->correct_attempts = 0;
            $analytics->success_rate = 0.0;
            $analytics->failure_rate = 0.0;
            $analytics->avg_time = 0;
            $analytics->min_time = 0;
            $analytics->max_time = 0;
            $analytics->avg_attempts_per_student = 0;
        }

        return $analytics;
    }

    /**
     * Get student performance analytics for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @return object Analytics data
     */
    public static function get_student_analytics($userid, $courseid = null) {
        global $DB;

        $sql = "SELECT
                    COUNT(DISTINCT qp.questionid) as questions_attempted,
                    SUM(qp.is_correct) as correct_count,
                    COUNT(*) as total_attempts,
                    AVG(qp.time_spent) as avg_time,
                    AVG(qd.predicted_level) as avg_difficulty_attempted
                FROM {question_performance} qp
                JOIN {question_difficulty} qd ON qp.questionid = qd.questionid
                JOIN {question} q ON qp.questionid = q.id";

        $params = array('userid' => $userid);

        if ($courseid) {
            $sql .= " JOIN {question_categories} qc ON q.category = qc.id
                      JOIN {context} ctx ON qc.contextid = ctx.id
                      WHERE qp.userid = :userid
                        AND ctx.contextlevel = 50
                        AND ctx.instanceid = :courseid";
            $params['courseid'] = $courseid;
        } else {
            $sql .= " WHERE qp.userid = :userid";
        }

        $analytics = $DB->get_record_sql($sql, $params);

        if ($analytics && $analytics->total_attempts > 0) {
            $analytics->success_rate = $analytics->correct_count / $analytics->total_attempts;
            $analytics->mastery_score = self::calculate_mastery_score($userid, $courseid);
        } else {
            $analytics = new \stdClass();
            $analytics->questions_attempted = 0;
            $analytics->correct_count = 0;
            $analytics->total_attempts = 0;
            $analytics->success_rate = 0.0;
            $analytics->avg_time = 0;
            $analytics->avg_difficulty_attempted = 0;
            $analytics->mastery_score = 0;
        }

        return $analytics;
    }

    /**
     * Calculate student mastery score (0-100)
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @return float Mastery score
     */
    private static function calculate_mastery_score($userid, $courseid = null) {
        global $DB;

        // Get performance by difficulty level.
        $sql = "SELECT
                    qd.predicted_level,
                    COUNT(*) as attempts,
                    SUM(qp.is_correct) as correct
                FROM {question_performance} qp
                JOIN {question_difficulty} qd ON qp.questionid = qd.questionid
                JOIN {question} q ON qp.questionid = q.id";

        $params = array('userid' => $userid);

        if ($courseid) {
            $sql .= " JOIN {question_categories} qc ON q.category = qc.id
                      JOIN {context} ctx ON qc.contextid = ctx.id
                      WHERE qp.userid = :userid
                        AND ctx.contextlevel = 50
                        AND ctx.instanceid = :courseid";
            $params['courseid'] = $courseid;
        } else {
            $sql .= " WHERE qp.userid = :userid";
        }

        $sql .= " GROUP BY qd.predicted_level";

        $results = $DB->get_records_sql($sql, $params);

        if (empty($results)) {
            return 0;
        }

        // Calculate weighted mastery score.
        // Higher level questions are weighted more heavily.
        $totalweightedscore = 0;
        $totalweight = 0;

        foreach ($results as $result) {
            $level = $result->predicted_level;
            $successrate = $result->correct / $result->attempts;
            $weight = $level; // Level 5 questions worth 5x level 1.

            $totalweightedscore += $successrate * $weight * 100;
            $totalweight += $weight;
        }

        return $totalweight > 0 ? $totalweightedscore / $totalweight : 0;
    }

    /**
     * Get performance trend for a student
     *
     * @param int $userid User ID
     * @param int $days Number of days to analyze
     * @return array Trend data
     */
    public static function get_performance_trend($userid, $days = 30) {
        global $DB;

        $threshold = time() - ($days * 24 * 3600);

        $sql = "SELECT
                    DATE(FROM_UNIXTIME(timecreated)) as date,
                    COUNT(*) as attempts,
                    SUM(is_correct) as correct,
                    AVG(time_spent) as avg_time
                FROM {question_performance}
                WHERE userid = :userid
                  AND timecreated > :threshold
                GROUP BY DATE(FROM_UNIXTIME(timecreated))
                ORDER BY date ASC";

        $results = $DB->get_records_sql($sql, array('userid' => $userid, 'threshold' => $threshold));

        $trend = array();

        foreach ($results as $result) {
            $trend[] = array(
                'date' => $result->date,
                'attempts' => $result->attempts,
                'success_rate' => $result->attempts > 0 ? ($result->correct / $result->attempts) : 0,
                'avg_time' => $result->avg_time
            );
        }

        return $trend;
    }

    /**
     * Batch update difficulty predictions from recent performance
     *
     * @param int $limit Number of questions to update
     * @return int Number of questions updated
     */
    public static function batch_update_difficulties($limit = 100) {
        global $DB;

        // Get questions with sufficient new attempts since last update.
        $sql = "SELECT qd.questionid, COUNT(qp.id) as new_attempts
                FROM {question_difficulty} qd
                JOIN {question_performance} qp ON qd.questionid = qp.questionid
                WHERE qp.timecreated > qd.timemodified
                GROUP BY qd.questionid
                HAVING COUNT(qp.id) >= 10
                ORDER BY new_attempts DESC
                LIMIT :limit";

        $questions = $DB->get_records_sql($sql, array('limit' => $limit));

        $count = 0;

        foreach ($questions as $question) {
            difficulty_predictor::update_from_performance($question->questionid);
            $count++;
        }

        return $count;
    }
}
