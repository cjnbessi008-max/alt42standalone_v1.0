<?php
// This file is part of Moodle - http://moodle.org/

namespace local_meditation_routine;

defined('MOODLE_INTERNAL') || die();

/**
 * Meditation routine manager class
 *
 * @package    local_meditation_routine
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class meditation_manager {

    /**
     * Check if meditation routine should be shown for this quiz attempt
     *
     * @param int $quizid Quiz ID
     * @param int $userid User ID
     * @param int $attemptid Quiz attempt ID
     * @return array|false Settings array or false if disabled
     */
    public static function should_show_meditation($quizid, $userid, $attemptid) {
        global $DB;

        // Get quiz meditation settings
        $settings = $DB->get_record('local_meditation_settings', ['quizid' => $quizid]);

        if (!$settings || !$settings->enabled) {
            return false;
        }

        // Check if questions in this attempt meet complexity threshold
        $complexity = self::get_attempt_complexity($attemptid);

        if ($complexity >= $settings->complexity_threshold) {
            return [
                'duration' => $settings->duration,
                'animation_style' => $settings->animation_style,
                'complexity' => $complexity
            ];
        }

        return false;
    }

    /**
     * Get complexity level of quiz attempt questions
     *
     * @param int $attemptid Quiz attempt ID
     * @return int Complexity level (1-5)
     */
    private static function get_attempt_complexity($attemptid) {
        global $DB;

        // Get first unanswered question
        $sql = "SELECT q.*, qt.name as qtype
                FROM {question} q
                JOIN {quiz_slots} qs ON qs.questionid = q.id
                JOIN {quiz_attempts} qa ON qa.quiz = qs.quizid
                JOIN {question_types} qt ON qt.id = q.qtype
                WHERE qa.id = :attemptid
                ORDER BY qs.slot
                LIMIT 1";

        $question = $DB->get_record_sql($sql, ['attemptid' => $attemptid]);

        if (!$question) {
            return 1;
        }

        // Check question metadata for complexity tag
        $tags = \core_tag_tag::get_item_tags('core_question', 'question', $question->id);
        foreach ($tags as $tag) {
            if (preg_match('/complexity[:\-_]?(\d)/', $tag->name, $matches)) {
                return min(5, max(1, intval($matches[1])));
            }
        }

        // Fallback: estimate complexity based on question type
        return self::estimate_complexity_by_type($question->qtype);
    }

    /**
     * Estimate complexity based on question type
     *
     * @param string $qtype Question type
     * @return int Complexity level (1-5)
     */
    private static function estimate_complexity_by_type($qtype) {
        $complexity_map = [
            'truefalse' => 1,
            'multichoice' => 2,
            'shortanswer' => 3,
            'numerical' => 3,
            'calculated' => 4,
            'calculatedmulti' => 4,
            'essay' => 5,
            'match' => 3,
            'coderunner' => 5,
        ];

        return isset($complexity_map[$qtype]) ? $complexity_map[$qtype] : 3;
    }

    /**
     * Log meditation session completion
     *
     * @param int $userid User ID
     * @param int $quizid Quiz ID
     * @param int $attemptid Quiz attempt ID
     * @param int $duration Duration in seconds
     * @param bool $completed Whether meditation was completed
     * @return int Record ID
     */
    public static function log_meditation_session($userid, $quizid, $attemptid, $duration, $completed = true) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $userid;
        $record->quizid = $quizid;
        $record->attemptid = $attemptid;
        $record->completed = $completed ? 1 : 0;
        $record->duration = $duration;
        $record->timecreated = time();

        return $DB->insert_record('local_meditation_sessions', $record);
    }

    /**
     * Get meditation settings for a quiz
     *
     * @param int $quizid Quiz ID
     * @return object|false Settings object or false
     */
    public static function get_quiz_settings($quizid) {
        global $DB;
        return $DB->get_record('local_meditation_settings', ['quizid' => $quizid]);
    }

    /**
     * Update meditation settings for a quiz
     *
     * @param int $quizid Quiz ID
     * @param array $settings Settings array
     * @return bool Success
     */
    public static function update_quiz_settings($quizid, $settings) {
        global $DB;

        $record = $DB->get_record('local_meditation_settings', ['quizid' => $quizid]);

        if (!$record) {
            $record = new \stdClass();
            $record->quizid = $quizid;
            $record->enabled = isset($settings['enabled']) ? $settings['enabled'] : 1;
            $record->complexity_threshold = isset($settings['complexity_threshold']) ? $settings['complexity_threshold'] : 4;
            $record->duration = isset($settings['duration']) ? $settings['duration'] : 5;
            $record->animation_style = isset($settings['animation_style']) ? $settings['animation_style'] : 'breathing';

            return $DB->insert_record('local_meditation_settings', $record);
        } else {
            if (isset($settings['enabled'])) {
                $record->enabled = $settings['enabled'];
            }
            if (isset($settings['complexity_threshold'])) {
                $record->complexity_threshold = $settings['complexity_threshold'];
            }
            if (isset($settings['duration'])) {
                $record->duration = $settings['duration'];
            }
            if (isset($settings['animation_style'])) {
                $record->animation_style = $settings['animation_style'];
            }

            return $DB->update_record('local_meditation_settings', $record);
        }
    }

    /**
     * Get meditation statistics for a user
     *
     * @param int $userid User ID
     * @return array Statistics
     */
    public static function get_user_statistics($userid) {
        global $DB;

        $total = $DB->count_records('local_meditation_sessions', ['userid' => $userid]);
        $completed = $DB->count_records('local_meditation_sessions', [
            'userid' => $userid,
            'completed' => 1
        ]);

        return [
            'total_sessions' => $total,
            'completed_sessions' => $completed,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0
        ];
    }
}
