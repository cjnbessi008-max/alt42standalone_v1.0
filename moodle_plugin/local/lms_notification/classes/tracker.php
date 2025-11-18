<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Activity tracker class
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_lms_notification;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for tracking student learning activities
 */
class tracker {

    /**
     * Track a learning activity
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $moduleid Module ID
     * @param string $activitytype Type of activity
     * @param array $data Activity data
     * @return int|bool Tracking ID or false on failure
     */
    public static function track_activity($userid, $courseid, $moduleid, $activitytype, $data = array()) {
        global $DB;

        // Generate or retrieve session ID
        $sessionid = self::get_session_id($userid);

        $record = new \stdClass();
        $record->userid = $userid;
        $record->courseid = $courseid;
        $record->moduleid = $moduleid;
        $record->activitytype = $activitytype;
        $record->sessionid = $sessionid;
        $record->starttime = isset($data['starttime']) ? $data['starttime'] : time();
        $record->endtime = isset($data['endtime']) ? $data['endtime'] : null;
        $record->attempts = isset($data['attempts']) ? $data['attempts'] : 0;
        $record->correct_answers = isset($data['correct']) ? $data['correct'] : 0;
        $record->incorrect_answers = isset($data['incorrect']) ? $data['incorrect'] : 0;
        $record->hints_used = isset($data['hints_used']) ? $data['hints_used'] : 0;
        $record->time_spent = isset($data['time_spent']) ? $data['time_spent'] : 0;
        $record->metadata = isset($data['metadata']) ? json_encode($data['metadata']) : null;
        $record->timecreated = time();
        $record->timemodified = time();

        try {
            $id = $DB->insert_record('lms_usage_tracking', $record);

            // Analyze for inefficiency patterns
            $analyzer = new analyzer();
            $alerts = $analyzer->analyze_activity($userid, $courseid, $moduleid, $record);

            return array(
                'tracking_id' => $id,
                'alerts' => $alerts
            );
        } catch (\Exception $e) {
            debugging('Failed to track activity: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Update an existing tracking record
     *
     * @param int $trackingid Tracking record ID
     * @param array $data Updated data
     * @return bool Success status
     */
    public static function update_activity($trackingid, $data) {
        global $DB;

        try {
            $record = $DB->get_record('lms_usage_tracking', array('id' => $trackingid), '*', MUST_EXIST);

            if (isset($data['endtime'])) {
                $record->endtime = $data['endtime'];
            }
            if (isset($data['attempts'])) {
                $record->attempts = $data['attempts'];
            }
            if (isset($data['correct'])) {
                $record->correct_answers = $data['correct'];
            }
            if (isset($data['incorrect'])) {
                $record->incorrect_answers = $data['incorrect'];
            }
            if (isset($data['hints_used'])) {
                $record->hints_used = $data['hints_used'];
            }
            if (isset($data['time_spent'])) {
                $record->time_spent = $data['time_spent'];
            }
            if (isset($data['metadata'])) {
                $existing_metadata = json_decode($record->metadata, true) ?: array();
                $new_metadata = array_merge($existing_metadata, $data['metadata']);
                $record->metadata = json_encode($new_metadata);
            }

            $record->timemodified = time();

            $DB->update_record('lms_usage_tracking', $record);

            // Re-analyze for updated patterns
            $analyzer = new analyzer();
            $alerts = $analyzer->analyze_activity($record->userid, $record->courseid, $record->moduleid, $record);

            return array(
                'success' => true,
                'alerts' => $alerts
            );
        } catch (\Exception $e) {
            debugging('Failed to update activity: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Get or create a session ID for the user
     *
     * @param int $userid User ID
     * @return string Session ID
     */
    private static function get_session_id($userid) {
        global $SESSION;

        if (!isset($SESSION->lms_notification_session_id)) {
            $SESSION->lms_notification_session_id = md5($userid . time() . random_string(10));
        }

        return $SESSION->lms_notification_session_id;
    }

    /**
     * Get recent activities for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @param int $limit Number of records to retrieve
     * @return array Activity records
     */
    public static function get_recent_activities($userid, $courseid = null, $limit = 10) {
        global $DB;

        $params = array('userid' => $userid);
        $sql = "SELECT * FROM {lms_usage_tracking} WHERE userid = :userid";

        if ($courseid !== null) {
            $sql .= " AND courseid = :courseid";
            $params['courseid'] = $courseid;
        }

        $sql .= " ORDER BY timecreated DESC";

        return $DB->get_records_sql($sql, $params, 0, $limit);
    }

    /**
     * Get activity statistics for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $days Number of days to look back
     * @return array Statistics
     */
    public static function get_statistics($userid, $courseid, $days = 7) {
        global $DB;

        $starttime = time() - ($days * 86400);

        $sql = "SELECT
                    COUNT(*) as total_activities,
                    SUM(time_spent) as total_time,
                    SUM(attempts) as total_attempts,
                    SUM(correct_answers) as total_correct,
                    SUM(incorrect_answers) as total_incorrect,
                    AVG(time_spent) as avg_time_spent,
                    AVG(CASE WHEN attempts > 0 THEN correct_answers / attempts ELSE 0 END) as avg_success_rate
                FROM {lms_usage_tracking}
                WHERE userid = :userid
                  AND courseid = :courseid
                  AND timecreated >= :starttime";

        $params = array(
            'userid' => $userid,
            'courseid' => $courseid,
            'starttime' => $starttime
        );

        $stats = $DB->get_record_sql($sql, $params);

        return array(
            'total_activities' => $stats->total_activities ?: 0,
            'total_time' => $stats->total_time ?: 0,
            'total_attempts' => $stats->total_attempts ?: 0,
            'total_correct' => $stats->total_correct ?: 0,
            'total_incorrect' => $stats->total_incorrect ?: 0,
            'avg_time_spent' => round($stats->avg_time_spent ?: 0, 2),
            'avg_success_rate' => round($stats->avg_success_rate ?: 0, 4)
        );
    }

    /**
     * Get average time spent on a module by all users
     *
     * @param int $moduleid Module ID
     * @return float Average time in seconds
     */
    public static function get_average_module_time($moduleid) {
        global $DB;

        $sql = "SELECT AVG(time_spent) as avg_time
                FROM {lms_usage_tracking}
                WHERE moduleid = :moduleid
                  AND time_spent > 0";

        $result = $DB->get_record_sql($sql, array('moduleid' => $moduleid));

        return $result->avg_time ?: 0;
    }

    /**
     * Clean up old tracking data
     *
     * @param int $days Number of days to keep
     * @return bool Success status
     */
    public static function cleanup_old_data($days = 365) {
        global $DB;

        $cutofftime = time() - ($days * 86400);

        try {
            $DB->delete_records_select('lms_usage_tracking', 'timecreated < :cutoff', array('cutoff' => $cutofftime));
            return true;
        } catch (\Exception $e) {
            debugging('Failed to cleanup old data: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }
}
