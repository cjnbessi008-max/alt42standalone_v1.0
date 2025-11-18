<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Cognitive load tip manager class
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_cognitiveloadtips;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for managing cognitive load tips
 */
class tip_manager {

    /**
     * Get tips for a specific difficulty level and language
     *
     * @param int $difficulty Difficulty level (1-5)
     * @param string $language Language code (default: user's language)
     * @param bool $random Get random tip or all tips
     * @return array Array of tip objects
     */
    public static function get_tips_for_difficulty($difficulty, $language = null, $random = true) {
        global $DB, $USER;

        if ($language === null) {
            $language = current_language();
        }

        $params = array(
            'difficulty' => $difficulty,
            'language' => $language,
            'enabled' => 1
        );

        $sql = "SELECT *
                  FROM {local_clt_tips}
                 WHERE difficulty_min <= :difficulty
                   AND difficulty_max >= :difficulty
                   AND language = :language
                   AND enabled = :enabled
              ORDER BY sortorder ASC";

        $tips = $DB->get_records_sql($sql, $params);

        if ($random && !empty($tips)) {
            $randomkey = array_rand($tips);
            return array($tips[$randomkey]);
        }

        return $tips;
    }

    /**
     * Get difficulty level for a question
     *
     * @param int $questionid Question ID
     * @return int Difficulty level (1-5, default 3)
     */
    public static function get_question_difficulty($questionid) {
        global $DB;

        $record = $DB->get_record('local_clt_question_difficulty',
            array('questionid' => $questionid), 'difficulty_level');

        if ($record) {
            return (int)$record->difficulty_level;
        }

        // Default difficulty if not set
        return 3;
    }

    /**
     * Set difficulty level for a question
     *
     * @param int $questionid Question ID
     * @param int $difficulty Difficulty level (1-5)
     * @param bool $auto_calculated Was this auto-calculated?
     * @return bool Success
     */
    public static function set_question_difficulty($questionid, $difficulty, $auto_calculated = false) {
        global $DB;

        $difficulty = max(1, min(5, (int)$difficulty)); // Clamp to 1-5
        $time = time();

        $existing = $DB->get_record('local_clt_question_difficulty',
            array('questionid' => $questionid));

        if ($existing) {
            $existing->difficulty_level = $difficulty;
            $existing->auto_calculated = $auto_calculated ? 1 : 0;
            $existing->timemodified = $time;
            return $DB->update_record('local_clt_question_difficulty', $existing);
        } else {
            $record = new \stdClass();
            $record->questionid = $questionid;
            $record->difficulty_level = $difficulty;
            $record->auto_calculated = $auto_calculated ? 1 : 0;
            $record->timecreated = $time;
            $record->timemodified = $time;
            return $DB->insert_record('local_clt_question_difficulty', $record);
        }
    }

    /**
     * Calculate difficulty based on question statistics
     * Uses success rate and time spent to estimate difficulty
     *
     * @param int $questionid Question ID
     * @return int Calculated difficulty (1-5)
     */
    public static function auto_calculate_difficulty($questionid) {
        global $DB;

        // Get question statistics from quiz_statistics table
        $sql = "SELECT
                    COUNT(*) as attempts,
                    AVG(CASE WHEN fraction > 0.99 THEN 1 ELSE 0 END) as success_rate,
                    AVG(timeused) as avg_time
                FROM {question_attempts} qa
                JOIN {question_attempt_steps} qas ON qas.questionattemptid = qa.id
                WHERE qa.questionid = :questionid
                  AND qas.state IN ('gradedright', 'gradedwrong', 'gradedpartial')";

        $stats = $DB->get_record_sql($sql, array('questionid' => $questionid));

        if (!$stats || $stats->attempts < 5) {
            // Not enough data, return default
            return 3;
        }

        $difficulty = 3; // Start with medium

        // Lower success rate = higher difficulty
        if ($stats->success_rate < 0.3) {
            $difficulty = 5;
        } else if ($stats->success_rate < 0.5) {
            $difficulty = 4;
        } else if ($stats->success_rate > 0.8) {
            $difficulty = 2;
        } else if ($stats->success_rate > 0.9) {
            $difficulty = 1;
        }

        return $difficulty;
    }

    /**
     * Record user interaction with a tip
     *
     * @param int $tipid Tip ID
     * @param int $questionid Question ID (optional)
     * @param int $quizid Quiz ID (optional)
     * @param int $duration View duration in seconds
     * @param bool $skipped Was the tip skipped?
     * @return bool Success
     */
    public static function record_interaction($tipid, $questionid = null, $quizid = null,
                                               $duration = null, $skipped = false) {
        global $DB, $USER;

        $record = new \stdClass();
        $record->userid = $USER->id;
        $record->tipid = $tipid;
        $record->questionid = $questionid;
        $record->quizid = $quizid;
        $record->view_duration = $duration;
        $record->skipped = $skipped ? 1 : 0;
        $record->timecreated = time();

        return $DB->insert_record('local_clt_user_interactions', $record);
    }

    /**
     * Get quiz settings for cognitive load tips
     *
     * @param int $quizid Quiz ID
     * @return object Settings object
     */
    public static function get_quiz_settings($quizid) {
        global $DB;

        $settings = $DB->get_record('local_clt_quiz_settings', array('quizid' => $quizid));

        if (!$settings) {
            // Return default settings
            $settings = new \stdClass();
            $settings->quizid = $quizid;
            $settings->enabled = 1;
            $settings->show_before_difficulty = 4;
            $settings->random_tip = 1;
            $settings->allow_skip = 1;
        }

        return $settings;
    }

    /**
     * Save quiz settings for cognitive load tips
     *
     * @param int $quizid Quiz ID
     * @param object $settings Settings object
     * @return bool Success
     */
    public static function save_quiz_settings($quizid, $settings) {
        global $DB;

        $time = time();
        $existing = $DB->get_record('local_clt_quiz_settings', array('quizid' => $quizid));

        if ($existing) {
            $existing->enabled = $settings->enabled;
            $existing->show_before_difficulty = $settings->show_before_difficulty;
            $existing->random_tip = $settings->random_tip;
            $existing->allow_skip = $settings->allow_skip;
            $existing->timemodified = $time;
            return $DB->update_record('local_clt_quiz_settings', $existing);
        } else {
            $settings->quizid = $quizid;
            $settings->timecreated = $time;
            $settings->timemodified = $time;
            return $DB->insert_record('local_clt_quiz_settings', $settings);
        }
    }

    /**
     * Check if tips should be shown for this question in this quiz
     *
     * @param int $quizid Quiz ID
     * @param int $questionid Question ID
     * @return bool True if tips should be shown
     */
    public static function should_show_tips($quizid, $questionid) {
        $settings = self::get_quiz_settings($quizid);

        if (!$settings->enabled) {
            return false;
        }

        $difficulty = self::get_question_difficulty($questionid);

        return ($difficulty >= $settings->show_before_difficulty);
    }

    /**
     * Get statistics for admin dashboard
     *
     * @return object Statistics object
     */
    public static function get_statistics() {
        global $DB;

        $stats = new \stdClass();

        // Total tips
        $stats->total_tips = $DB->count_records('local_clt_tips', array('enabled' => 1));

        // Total interactions
        $stats->total_interactions = $DB->count_records('local_clt_user_interactions');

        // Tips shown vs skipped
        $stats->tips_shown = $DB->count_records('local_clt_user_interactions', array('skipped' => 0));
        $stats->tips_skipped = $DB->count_records('local_clt_user_interactions', array('skipped' => 1));

        // Average view duration
        $sql = "SELECT AVG(view_duration) as avg_duration
                  FROM {local_clt_user_interactions}
                 WHERE view_duration IS NOT NULL AND skipped = 0";
        $duration = $DB->get_record_sql($sql);
        $stats->avg_view_duration = $duration ? round($duration->avg_duration, 1) : 0;

        // Most helpful tips
        $sql = "SELECT tipid, COUNT(*) as views
                  FROM {local_clt_user_interactions}
                 WHERE skipped = 0
              GROUP BY tipid
              ORDER BY views DESC
                 LIMIT 5";
        $stats->popular_tips = $DB->get_records_sql($sql);

        return $stats;
    }
}
