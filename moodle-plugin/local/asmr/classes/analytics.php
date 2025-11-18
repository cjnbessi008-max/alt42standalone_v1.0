<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Analytics manager for ASMR plugin
 *
 * @package    local_asmr
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_asmr;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for tracking and analyzing ASMR usage
 */
class analytics {

    /** @var array Action types */
    const ACTION_PLAY = 'play';
    const ACTION_PAUSE = 'pause';
    const ACTION_STOP = 'stop';
    const ACTION_SKIP = 'skip';
    const ACTION_COMPLETE = 'complete';

    /**
     * Log usage event
     *
     * @param int $userid User ID
     * @param int $soundid Sound ID
     * @param string $action Action type
     * @param int $duration Duration listened in seconds
     * @param array $options Additional options (courseid, cmid, volume, device)
     * @return int Log ID
     */
    public static function log_usage($userid, $soundid, $action, $duration = 0, $options = array()) {
        global $DB;

        $log = new \stdClass();
        $log->userid = $userid;
        $log->soundid = $soundid;
        $log->action = $action;
        $log->duration_listened = $duration;
        $log->volume_level = isset($options['volume']) ? $options['volume'] : 70;
        $log->courseid = isset($options['courseid']) ? $options['courseid'] : null;
        $log->cmid = isset($options['cmid']) ? $options['cmid'] : null;
        $log->device_type = isset($options['device']) ? $options['device'] : self::detect_device();
        $log->timecreated = time();

        return $DB->insert_record('asmr_usage_log', $log);
    }

    /**
     * Get usage statistics for a user
     *
     * @param int $userid User ID
     * @param int $days Number of days to look back (default: 30)
     * @return object Usage statistics
     */
    public static function get_user_stats($userid, $days = 30) {
        global $DB;

        $since = time() - ($days * 86400);

        $stats = new \stdClass();

        // Total listening time
        $sql = "SELECT SUM(duration_listened) as total
                FROM {asmr_usage_log}
                WHERE userid = :userid
                AND timecreated >= :since
                AND action IN (:play, :complete)";

        $params = array(
            'userid' => $userid,
            'since' => $since,
            'play' => self::ACTION_PLAY,
            'complete' => self::ACTION_COMPLETE
        );

        $result = $DB->get_record_sql($sql, $params);
        $stats->total_listening_time = $result->total ? $result->total : 0;

        // Total plays
        $stats->total_plays = $DB->count_records_select('asmr_usage_log',
            'userid = :userid AND timecreated >= :since AND action = :action',
            array('userid' => $userid, 'since' => $since, 'action' => self::ACTION_PLAY)
        );

        // Most played sounds
        $sql = "SELECT s.*, COUNT(*) as play_count
                FROM {asmr_usage_log} l
                JOIN {asmr_sounds} s ON s.id = l.soundid
                WHERE l.userid = :userid
                AND l.timecreated >= :since
                AND l.action = :action
                GROUP BY l.soundid
                ORDER BY play_count DESC
                LIMIT 5";

        $stats->top_sounds = $DB->get_records_sql($sql, $params);

        // Preferred category
        $sql = "SELECT s.category, COUNT(*) as count
                FROM {asmr_usage_log} l
                JOIN {asmr_sounds} s ON s.id = l.soundid
                WHERE l.userid = :userid
                AND l.timecreated >= :since
                AND l.action = :action
                GROUP BY s.category
                ORDER BY count DESC
                LIMIT 1";

        $result = $DB->get_record_sql($sql, $params);
        $stats->preferred_category = $result ? $result->category : null;

        // Average session duration
        if ($stats->total_plays > 0) {
            $stats->avg_session_duration = round($stats->total_listening_time / $stats->total_plays);
        } else {
            $stats->avg_session_duration = 0;
        }

        return $stats;
    }

    /**
     * Get overall system statistics
     *
     * @param int $days Number of days to look back (default: 30)
     * @return object System statistics
     */
    public static function get_system_stats($days = 30) {
        global $DB;

        $since = time() - ($days * 86400);
        $stats = new \stdClass();

        // Total active users
        $sql = "SELECT COUNT(DISTINCT userid) as count
                FROM {asmr_usage_log}
                WHERE timecreated >= :since";

        $result = $DB->get_record_sql($sql, array('since' => $since));
        $stats->active_users = $result->count;

        // Total plays
        $stats->total_plays = $DB->count_records_select('asmr_usage_log',
            'timecreated >= :since AND action = :action',
            array('since' => $since, 'action' => self::ACTION_PLAY)
        );

        // Total listening time
        $sql = "SELECT SUM(duration_listened) as total
                FROM {asmr_usage_log}
                WHERE timecreated >= :since
                AND action IN (:play, :complete)";

        $params = array(
            'since' => $since,
            'play' => self::ACTION_PLAY,
            'complete' => self::ACTION_COMPLETE
        );

        $result = $DB->get_record_sql($sql, $params);
        $stats->total_listening_time = $result->total ? $result->total : 0;

        // Most popular sounds
        $sql = "SELECT s.*, COUNT(*) as play_count
                FROM {asmr_usage_log} l
                JOIN {asmr_sounds} s ON s.id = l.soundid
                WHERE l.timecreated >= :since
                AND l.action = :action
                GROUP BY l.soundid
                ORDER BY play_count DESC
                LIMIT 10";

        $stats->popular_sounds = $DB->get_records_sql($sql, $params);

        // Usage by hour of day
        $stats->usage_by_hour = self::get_usage_by_hour($since);

        // Category distribution
        $sql = "SELECT s.category, COUNT(*) as count
                FROM {asmr_usage_log} l
                JOIN {asmr_sounds} s ON s.id = l.soundid
                WHERE l.timecreated >= :since
                AND l.action = :action
                GROUP BY s.category
                ORDER BY count DESC";

        $stats->category_distribution = $DB->get_records_sql($sql, $params);

        return $stats;
    }

    /**
     * Get usage by hour of day
     *
     * @param int $since Timestamp to start from
     * @return array Usage counts by hour (0-23)
     */
    private static function get_usage_by_hour($since) {
        global $DB;

        // Initialize array with 0 for all hours
        $hours = array_fill(0, 24, 0);

        $sql = "SELECT FROM_UNIXTIME(timecreated, '%H') as hour, COUNT(*) as count
                FROM {asmr_usage_log}
                WHERE timecreated >= :since
                AND action = :action
                GROUP BY hour";

        $params = array('since' => $since, 'action' => self::ACTION_PLAY);
        $results = $DB->get_records_sql($sql, $params);

        foreach ($results as $result) {
            $hours[(int)$result->hour] = (int)$result->count;
        }

        return $hours;
    }

    /**
     * Get course-specific statistics
     *
     * @param int $courseid Course ID
     * @param int $days Number of days to look back
     * @return object Course statistics
     */
    public static function get_course_stats($courseid, $days = 30) {
        global $DB;

        $since = time() - ($days * 86400);
        $stats = new \stdClass();

        // Active students in course
        $sql = "SELECT COUNT(DISTINCT l.userid) as count
                FROM {asmr_usage_log} l
                JOIN {user_enrolments} ue ON ue.userid = l.userid
                JOIN {enrol} e ON e.id = ue.enrolid
                WHERE e.courseid = :courseid
                AND l.timecreated >= :since";

        $result = $DB->get_record_sql($sql, array('courseid' => $courseid, 'since' => $since));
        $stats->active_students = $result->count;

        // Course plays
        $stats->total_plays = $DB->count_records_select('asmr_usage_log',
            'courseid = :courseid AND timecreated >= :since AND action = :action',
            array('courseid' => $courseid, 'since' => $since, 'action' => self::ACTION_PLAY)
        );

        // Most used sounds in course
        $sql = "SELECT s.*, COUNT(*) as play_count
                FROM {asmr_usage_log} l
                JOIN {asmr_sounds} s ON s.id = l.soundid
                WHERE l.courseid = :courseid
                AND l.timecreated >= :since
                AND l.action = :action
                GROUP BY l.soundid
                ORDER BY play_count DESC
                LIMIT 5";

        $params = array('courseid' => $courseid, 'since' => $since, 'action' => self::ACTION_PLAY);
        $stats->top_sounds = $DB->get_records_sql($sql, $params);

        return $stats;
    }

    /**
     * Detect device type from user agent
     *
     * @return string Device type (desktop, mobile, tablet)
     */
    private static function detect_device() {
        if (isset($_SERVER['HTTP_USER_AGENT'])) {
            $useragent = $_SERVER['HTTP_USER_AGENT'];

            if (preg_match('/(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i', $useragent)) {
                return 'tablet';
            }

            if (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile)/i', $useragent)) {
                return 'mobile';
            }
        }

        return 'desktop';
    }

    /**
     * Generate wellbeing report for user
     *
     * @param int $userid User ID
     * @param int $days Number of days
     * @return object Wellbeing report
     */
    public static function get_wellbeing_report($userid, $days = 30) {
        $stats = self::get_user_stats($userid, $days);

        $report = new \stdClass();
        $report->listening_time = $stats->total_listening_time;
        $report->sessions = $stats->total_plays;
        $report->avg_session = $stats->avg_session_duration;

        // Calculate wellbeing score (0-100)
        // Based on consistent usage patterns
        $ideal_daily_minutes = 20; // 20 minutes per day is ideal
        $actual_daily_minutes = ($stats->total_listening_time / 60) / $days;

        if ($actual_daily_minutes >= $ideal_daily_minutes) {
            $score = 100;
        } else {
            $score = min(100, ($actual_daily_minutes / $ideal_daily_minutes) * 100);
        }

        $report->wellbeing_score = round($score);

        // Recommendations
        $report->recommendations = array();
        if ($actual_daily_minutes < 10) {
            $report->recommendations[] = 'Try to listen to ASMR sounds for at least 10-15 minutes daily for stress relief.';
        }
        if ($stats->preferred_category === 'effect') {
            $report->recommendations[] = 'Consider exploring longer ASMR sounds for deeper relaxation.';
        }

        return $report;
    }
}
