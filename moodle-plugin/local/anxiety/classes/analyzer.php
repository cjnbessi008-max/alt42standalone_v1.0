<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Anxiety Analysis Engine
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_anxiety;

defined('MOODLE_INTERNAL') || die();

/**
 * Class analyzer
 *
 * Calculates anxiety scores based on behavioral metrics
 */
class analyzer {

    /** Anxiety level constants */
    const LEVEL_NORMAL = 'normal';
    const LEVEL_MILD = 'mild';
    const LEVEL_MODERATE = 'moderate';
    const LEVEL_SEVERE = 'severe';

    /**
     * Calculate anxiety score from metrics
     *
     * @param object $metrics Raw behavioral metrics
     * @param int $courseid Course ID for configuration
     * @return object Calculated anxiety score and level
     */
    public static function calculate_anxiety_score($metrics, $courseid) {
        global $DB;

        // Get configuration
        $config = self::get_config($courseid);

        // Get baseline statistics for comparison
        $baseline = self::get_baseline_stats($metrics->userid, $courseid);

        $score = 0;

        // 1. Response Time Deviation (25%)
        $response_deviation = self::calculate_response_time_score($metrics->response_time, $baseline);
        $score += $response_deviation * $config->weight_response_time;

        // 2. Error Rate (20%)
        $error_score = self::calculate_error_rate_score($metrics->error_count);
        $score += $error_score * $config->weight_error_rate;

        // 3. Click Frequency Abnormality (15%)
        $click_score = self::calculate_click_frequency_score($metrics->click_count);
        $score += $click_score * $config->weight_click_frequency;

        // 4. Time on Task Deviation (20%)
        $time_deviation = self::calculate_time_on_task_score($metrics->time_on_task, $baseline);
        $score += $time_deviation * $config->weight_time_on_task;

        // 5. Navigation Pattern Issues (10%)
        $navigation_score = self::calculate_navigation_score($metrics->navigation_back_count);
        $score += $navigation_score * $config->weight_navigation;

        // 6. Session Duration (10%)
        $session_score = self::calculate_session_duration_score($metrics->userid);
        $score += $session_score * $config->weight_session_duration;

        // Normalize to 0-100
        $final_score = min(100, max(0, $score * 100));

        // Determine anxiety level
        $level = self::get_anxiety_level($final_score, $config);

        return (object)[
            'score' => round($final_score, 2),
            'level' => $level,
            'components' => [
                'response_time' => round($response_deviation * 100, 2),
                'error_rate' => round($error_score * 100, 2),
                'click_frequency' => round($click_score * 100, 2),
                'time_on_task' => round($time_deviation * 100, 2),
                'navigation' => round($navigation_score * 100, 2),
                'session_duration' => round($session_score * 100, 2),
            ]
        ];
    }

    /**
     * Calculate response time deviation score
     *
     * @param int $response_time Current response time in seconds
     * @param object $baseline Baseline statistics
     * @return float Score between 0 and 1
     */
    private static function calculate_response_time_score($response_time, $baseline) {
        if ($baseline->avg_response_time == 0) {
            return 0; // No baseline yet
        }

        $ratio = $response_time / $baseline->avg_response_time;

        // Too fast (< 30% of average) or too slow (> 200% of average) indicates anxiety
        if ($ratio < 0.3) {
            return 0.8; // Rushing through
        } else if ($ratio > 2.0) {
            return min(1.0, ($ratio - 2.0) / 3.0); // Struggling
        }

        return 0; // Normal range
    }

    /**
     * Calculate error rate score
     *
     * @param int $error_count Number of errors in current session
     * @return float Score between 0 and 1
     */
    private static function calculate_error_rate_score($error_count) {
        // Linear increase: 0 errors = 0, 5+ errors = 1.0
        return min(1.0, $error_count / 5.0);
    }

    /**
     * Calculate click frequency score
     *
     * @param int $click_count Number of clicks per minute
     * @return float Score between 0 and 1
     */
    private static function calculate_click_frequency_score($click_count) {
        // High click frequency (> 20/min) indicates anxiety
        if ($click_count > 20) {
            return min(1.0, ($click_count - 20) / 30.0);
        }
        return 0;
    }

    /**
     * Calculate time on task deviation score
     *
     * @param int $time_on_task Time spent in seconds
     * @param object $baseline Baseline statistics
     * @return float Score between 0 and 1
     */
    private static function calculate_time_on_task_score($time_on_task, $baseline) {
        // Too short (< 10 seconds) = giving up
        if ($time_on_task < 10) {
            return 0.9;
        }

        // Too long (> 10 minutes) = stuck/confused
        if ($time_on_task > 600) {
            return min(1.0, ($time_on_task - 600) / 1200.0);
        }

        return 0; // Normal range
    }

    /**
     * Calculate navigation pattern score
     *
     * @param int $back_count Number of back button presses
     * @return float Score between 0 and 1
     */
    private static function calculate_navigation_score($back_count) {
        // Frequent back navigation (> 5) indicates uncertainty/anxiety
        return min(1.0, $back_count / 10.0);
    }

    /**
     * Calculate session duration score
     *
     * @param int $userid User ID
     * @return float Score between 0 and 1
     */
    private static function calculate_session_duration_score($userid) {
        global $DB;

        // Get current active session
        $sql = "SELECT session_start, session_duration
                FROM {local_anxiety_sessions}
                WHERE userid = :userid
                  AND session_end IS NULL
                ORDER BY session_start DESC
                LIMIT 1";

        $session = $DB->get_record_sql($sql, ['userid' => $userid]);

        if (!$session) {
            return 0;
        }

        $current_duration = time() - $session->session_start;

        // Excessive session (> 2 hours) indicates potential burnout/anxiety
        if ($current_duration > 7200) {
            return min(1.0, ($current_duration - 7200) / 3600.0);
        }

        return 0;
    }

    /**
     * Get baseline statistics for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return object Baseline statistics
     */
    private static function get_baseline_stats($userid, $courseid) {
        global $DB;

        // Get average metrics from last 30 days
        $sql = "SELECT AVG(response_time) as avg_response_time,
                       AVG(time_on_task) as avg_time_on_task,
                       AVG(click_count) as avg_click_count
                FROM {local_anxiety_metrics}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND timecreated > :timeframe
                  AND anxiety_level = 'normal'";

        $baseline = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'timeframe' => time() - (30 * 24 * 3600)
        ]);

        if (!$baseline || $baseline->avg_response_time === null) {
            // Default baseline if no history
            return (object)[
                'avg_response_time' => 30, // 30 seconds
                'avg_time_on_task' => 120, // 2 minutes
                'avg_click_count' => 5
            ];
        }

        return $baseline;
    }

    /**
     * Determine anxiety level from score
     *
     * @param float $score Anxiety score (0-100)
     * @param object $config Configuration object
     * @return string Anxiety level
     */
    private static function get_anxiety_level($score, $config) {
        if ($score >= $config->severe_threshold) {
            return self::LEVEL_SEVERE;
        } else if ($score >= $config->moderate_threshold) {
            return self::LEVEL_MODERATE;
        } else if ($score >= $config->mild_threshold) {
            return self::LEVEL_MILD;
        }
        return self::LEVEL_NORMAL;
    }

    /**
     * Get configuration for course
     *
     * @param int $courseid Course ID (0 for site-wide)
     * @return object Configuration object
     */
    private static function get_config($courseid) {
        global $DB;

        $config = $DB->get_record('local_anxiety_config', ['courseid' => $courseid]);

        if (!$config) {
            // Try site-wide config
            $config = $DB->get_record('local_anxiety_config', ['courseid' => 0]);
        }

        if (!$config) {
            // Create default config
            $config = (object)[
                'courseid' => $courseid,
                'mild_threshold' => 30.00,
                'moderate_threshold' => 50.00,
                'severe_threshold' => 70.00,
                'enable_alerts' => 1,
                'alert_frequency' => 300,
                'weight_response_time' => 0.25,
                'weight_error_rate' => 0.20,
                'weight_click_frequency' => 0.15,
                'weight_time_on_task' => 0.20,
                'weight_navigation' => 0.10,
                'weight_session_duration' => 0.10,
                'timemodified' => time()
            ];
            $config->id = $DB->insert_record('local_anxiety_config', $config);
        }

        return $config;
    }

    /**
     * Get anxiety trend for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $timerange Time range in seconds (default: 7 days)
     * @return array Array of anxiety scores over time
     */
    public static function get_anxiety_trend($userid, $courseid, $timerange = 604800) {
        global $DB;

        $sql = "SELECT id, anxiety_score, anxiety_level, timecreated
                FROM {local_anxiety_metrics}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND timecreated > :timeframe
                ORDER BY timecreated ASC";

        $records = $DB->get_records_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'timeframe' => time() - $timerange
        ]);

        return array_values($records);
    }
}
