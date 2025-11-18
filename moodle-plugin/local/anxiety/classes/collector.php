<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Anxiety Data Collector
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_anxiety;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/anxiety/classes/analyzer.php');
require_once($CFG->dirroot . '/local/anxiety/classes/alert_manager.php');

/**
 * Class collector
 *
 * Collects and stores behavioral metrics
 */
class collector {

    /**
     * Track a behavioral event
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID (optional)
     * @param string $event_type Type of event
     * @param array $event_data Event data
     * @return object Result with anxiety score
     */
    public static function track_event($userid, $courseid, $cmid, $event_type, $event_data) {
        global $DB;

        // Ensure active session exists
        $session = self::ensure_session($userid, $courseid);

        // Get or create current metrics record
        $metrics = self::get_current_metrics($userid, $courseid, $cmid);

        // Update metrics based on event type
        self::update_metrics($metrics, $event_type, $event_data);

        // Calculate anxiety score
        $analysis = analyzer::calculate_anxiety_score($metrics, $courseid);

        // Update record with calculated score
        $metrics->anxiety_score = $analysis->score;
        $metrics->anxiety_level = $analysis->level;

        if (isset($metrics->id)) {
            $DB->update_record('local_anxiety_metrics', $metrics);
        } else {
            $metrics->timecreated = time();
            $metrics->id = $DB->insert_record('local_anxiety_metrics', $metrics);
        }

        // Check if alert should be triggered
        alert_manager::check_and_create_alert($userid, $courseid, $analysis);

        return (object)[
            'success' => true,
            'anxiety_score' => $analysis->score,
            'anxiety_level' => $analysis->level,
            'components' => $analysis->components
        ];
    }

    /**
     * Ensure an active session exists for the user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return object Session record
     */
    private static function ensure_session($userid, $courseid) {
        global $DB;

        // Check for active session (within last 30 minutes)
        $sql = "SELECT *
                FROM {local_anxiety_sessions}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND session_end IS NULL
                  AND session_start > :threshold
                ORDER BY session_start DESC
                LIMIT 1";

        $session = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'threshold' => time() - 1800 // 30 minutes
        ]);

        if (!$session) {
            // Create new session
            $session = (object)[
                'userid' => $userid,
                'courseid' => $courseid,
                'session_start' => time(),
                'session_end' => null,
                'session_duration' => 0,
                'avg_response_time' => 0,
                'total_clicks' => 0,
                'total_errors' => 0,
                'avg_anxiety_score' => 0,
                'max_anxiety_score' => 0,
                'anxiety_peaks' => 0
            ];
            $session->id = $DB->insert_record('local_anxiety_sessions', $session);
        }

        return $session;
    }

    /**
     * Get current metrics record for user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @return object Metrics record
     */
    private static function get_current_metrics($userid, $courseid, $cmid) {
        global $DB;

        // Get most recent metrics (within last 5 minutes)
        $sql = "SELECT *
                FROM {local_anxiety_metrics}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND timecreated > :threshold
                ORDER BY timecreated DESC
                LIMIT 1";

        $metrics = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'threshold' => time() - 300 // 5 minutes
        ]);

        if (!$metrics) {
            // Create new metrics record
            $metrics = (object)[
                'userid' => $userid,
                'courseid' => $courseid,
                'cmid' => $cmid,
                'response_time' => 0,
                'click_count' => 0,
                'error_count' => 0,
                'time_on_task' => 0,
                'navigation_back_count' => 0,
                'anxiety_score' => 0,
                'anxiety_level' => analyzer::LEVEL_NORMAL
            ];
        }

        return $metrics;
    }

    /**
     * Update metrics based on event
     *
     * @param object $metrics Metrics record to update
     * @param string $event_type Event type
     * @param array $event_data Event data
     */
    private static function update_metrics(&$metrics, $event_type, $event_data) {
        switch ($event_type) {
            case 'click':
                $metrics->click_count++;
                break;

            case 'response':
                if (isset($event_data['response_time'])) {
                    $metrics->response_time = intval($event_data['response_time']);
                }
                if (isset($event_data['is_correct']) && !$event_data['is_correct']) {
                    $metrics->error_count++;
                }
                break;

            case 'error':
                $metrics->error_count++;
                break;

            case 'navigation_back':
                $metrics->navigation_back_count++;
                break;

            case 'time_update':
                if (isset($event_data['time_on_task'])) {
                    $metrics->time_on_task = intval($event_data['time_on_task']);
                }
                break;
        }
    }

    /**
     * End a session for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return bool Success
     */
    public static function end_session($userid, $courseid) {
        global $DB;

        $sql = "SELECT *
                FROM {local_anxiety_sessions}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND session_end IS NULL
                ORDER BY session_start DESC
                LIMIT 1";

        $session = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$session) {
            return false;
        }

        // Calculate session statistics
        $session->session_end = time();
        $session->session_duration = $session->session_end - $session->session_start;

        // Get aggregated metrics for this session
        $sql = "SELECT AVG(response_time) as avg_response_time,
                       SUM(click_count) as total_clicks,
                       SUM(error_count) as total_errors,
                       AVG(anxiety_score) as avg_anxiety_score,
                       MAX(anxiety_score) as max_anxiety_score,
                       SUM(CASE WHEN anxiety_level IN ('moderate', 'severe') THEN 1 ELSE 0 END) as anxiety_peaks
                FROM {local_anxiety_metrics}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND timecreated >= :session_start
                  AND timecreated <= :session_end";

        $stats = $DB->get_record_sql($sql, [
            'userid' => $userid,
            'courseid' => $courseid,
            'session_start' => $session->session_start,
            'session_end' => $session->session_end
        ]);

        if ($stats) {
            $session->avg_response_time = $stats->avg_response_time ?? 0;
            $session->total_clicks = $stats->total_clicks ?? 0;
            $session->total_errors = $stats->total_errors ?? 0;
            $session->avg_anxiety_score = $stats->avg_anxiety_score ?? 0;
            $session->max_anxiety_score = $stats->max_anxiety_score ?? 0;
            $session->anxiety_peaks = $stats->anxiety_peaks ?? 0;
        }

        $DB->update_record('local_anxiety_sessions', $session);

        return true;
    }

    /**
     * Clean up old metrics data
     *
     * @param int $days Number of days to keep (default: 90)
     * @return int Number of records deleted
     */
    public static function cleanup_old_data($days = 90) {
        global $DB;

        $threshold = time() - ($days * 24 * 3600);

        // Delete old metrics
        $count = $DB->count_records_select('local_anxiety_metrics', 'timecreated < ?', [$threshold]);
        $DB->delete_records_select('local_anxiety_metrics', 'timecreated < ?', [$threshold]);

        // Delete old sessions
        $DB->delete_records_select('local_anxiety_sessions', 'session_start < ?', [$threshold]);

        // Delete old acknowledged alerts
        $DB->delete_records_select('local_anxiety_alerts',
            'timecreated < ? AND is_read = 1',
            [$threshold]);

        return $count;
    }
}
