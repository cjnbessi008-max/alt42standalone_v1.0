<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Learning pattern analyzer class
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_lms_notification;

defined('MOODLE_INTERNAL') || die();

/**
 * Class for analyzing learning patterns and detecting inefficiencies
 */
class analyzer {

    // Default thresholds
    const DEFAULT_TIME_THRESHOLD = 1800;        // 30 minutes
    const DEFAULT_ATTEMPT_THRESHOLD = 10;       // 10 attempts
    const DEFAULT_ERROR_RATE_THRESHOLD = 0.8;   // 80% error rate
    const DEFAULT_STAGNATION_DAYS = 3;          // 3 days

    /**
     * Analyze a learning activity for inefficiency patterns
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $moduleid Module ID
     * @param object $activity Activity record
     * @return array Array of triggered alerts
     */
    public function analyze_activity($userid, $courseid, $moduleid, $activity) {
        $alerts = array();

        // Check for excessive time
        if ($alert = $this->detect_time_inefficiency($userid, $moduleid, $activity)) {
            $alerts[] = $alert;
        }

        // Check for excessive attempts
        if ($alert = $this->detect_attempt_inefficiency($userid, $moduleid, $activity)) {
            $alerts[] = $alert;
        }

        // Check for high error rate
        if ($alert = $this->detect_error_pattern($userid, $courseid)) {
            $alerts[] = $alert;
        }

        // Check for learning stagnation (scheduled task handles this)

        return $alerts;
    }

    /**
     * Detect time-based inefficiency
     *
     * @param int $userid User ID
     * @param int $moduleid Module ID
     * @param object $activity Activity record
     * @return mixed Alert object or false
     */
    private function detect_time_inefficiency($userid, $moduleid, $activity) {
        $settings = $this->get_user_settings($userid);
        $threshold = $settings->threshold_time ?: self::DEFAULT_TIME_THRESHOLD;

        // Get average time for this module
        $avg_time = tracker::get_average_module_time($moduleid);

        // Check if time spent exceeds threshold or is significantly above average
        if ($activity->time_spent > $threshold ||
            ($avg_time > 0 && $activity->time_spent > ($avg_time * 2))) {

            // Check for duplicate alerts in the last hour
            if ($this->check_duplicate_alert($userid, 'excessive_time', 3600)) {
                return false;
            }

            $metrics = array(
                'time_spent' => $activity->time_spent,
                'threshold' => $threshold,
                'average_time' => $avg_time,
                'module_id' => $moduleid
            );

            return $this->create_alert(
                $userid,
                $activity->courseid,
                $moduleid,
                'excessive_time',
                'high',
                get_string('alert_excessive_time', 'local_lms_notification',
                    array('time' => format_time($activity->time_spent))),
                $metrics
            );
        }

        return false;
    }

    /**
     * Detect attempt-based inefficiency
     *
     * @param int $userid User ID
     * @param int $moduleid Module ID
     * @param object $activity Activity record
     * @return mixed Alert object or false
     */
    private function detect_attempt_inefficiency($userid, $moduleid, $activity) {
        $settings = $this->get_user_settings($userid);
        $threshold = $settings->threshold_attempts ?: self::DEFAULT_ATTEMPT_THRESHOLD;

        // Calculate success rate
        $total_answers = $activity->correct_answers + $activity->incorrect_answers;
        $success_rate = $total_answers > 0 ? $activity->correct_answers / $total_answers : 0;

        // Check if attempts exceed threshold and success rate is low
        if ($activity->attempts > $threshold && $success_rate < 0.3) {

            // Check for duplicate alerts
            if ($this->check_duplicate_alert($userid, 'excessive_attempts', 3600)) {
                return false;
            }

            $metrics = array(
                'attempts' => $activity->attempts,
                'threshold' => $threshold,
                'success_rate' => $success_rate,
                'module_id' => $moduleid
            );

            return $this->create_alert(
                $userid,
                $activity->courseid,
                $moduleid,
                'excessive_attempts',
                'high',
                get_string('alert_excessive_attempts', 'local_lms_notification',
                    array('attempts' => $activity->attempts)),
                $metrics
            );
        }

        return false;
    }

    /**
     * Detect error pattern inefficiency
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return mixed Alert object or false
     */
    private function detect_error_pattern($userid, $courseid) {
        $settings = $this->get_user_settings($userid);
        $error_rate_threshold = $settings->threshold_error_rate ?: self::DEFAULT_ERROR_RATE_THRESHOLD;

        // Get recent activities (last 10)
        $recent_activities = tracker::get_recent_activities($userid, $courseid, 10);

        if (count($recent_activities) < 5) {
            return false; // Not enough data
        }

        $error_count = 0;
        foreach ($recent_activities as $activity) {
            if ($activity->incorrect_answers > $activity->correct_answers) {
                $error_count++;
            }
        }

        $error_rate = $error_count / count($recent_activities);

        if ($error_rate >= $error_rate_threshold) {

            // Check for duplicate alerts
            if ($this->check_duplicate_alert($userid, 'high_error_rate', 7200)) {
                return false;
            }

            $metrics = array(
                'error_rate' => $error_rate,
                'threshold' => $error_rate_threshold,
                'recent_activities' => count($recent_activities),
                'error_count' => $error_count
            );

            return $this->create_alert(
                $userid,
                $courseid,
                null,
                'high_error_rate',
                'high',
                get_string('alert_high_error_rate', 'local_lms_notification',
                    array('rate' => round($error_rate * 100))),
                $metrics
            );
        }

        return false;
    }

    /**
     * Detect learning stagnation
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return mixed Alert object or false
     */
    public function detect_learning_stagnation($userid, $courseid) {
        global $DB;

        $settings = $this->get_user_settings($userid);
        $days_threshold = self::DEFAULT_STAGNATION_DAYS;

        // Get last activity date
        $sql = "SELECT MAX(timecreated) as last_activity
                FROM {lms_usage_tracking}
                WHERE userid = :userid AND courseid = :courseid";

        $result = $DB->get_record_sql($sql, array('userid' => $userid, 'courseid' => $courseid));

        if (!$result || !$result->last_activity) {
            return false;
        }

        $days_since_activity = (time() - $result->last_activity) / 86400;

        if ($days_since_activity > $days_threshold) {

            // Check for duplicate alerts
            if ($this->check_duplicate_alert($userid, 'learning_stagnation', 86400)) {
                return false;
            }

            $metrics = array(
                'days_since_activity' => round($days_since_activity, 1),
                'threshold' => $days_threshold,
                'last_activity' => $result->last_activity
            );

            return $this->create_alert(
                $userid,
                $courseid,
                null,
                'learning_stagnation',
                'medium',
                get_string('alert_learning_stagnation', 'local_lms_notification',
                    array('days' => round($days_since_activity))),
                $metrics
            );
        }

        return false;
    }

    /**
     * Create an alert
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $moduleid Module ID (optional)
     * @param string $alert_type Alert type
     * @param string $severity Severity level
     * @param string $description Alert description
     * @param array $metrics Alert metrics
     * @return object Alert record
     */
    private function create_alert($userid, $courseid, $moduleid, $alert_type, $severity, $description, $metrics) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $userid;
        $record->courseid = $courseid;
        $record->moduleid = $moduleid;
        $record->alert_type = $alert_type;
        $record->severity = $severity;
        $record->description = $description;
        $record->metrics = json_encode($metrics);
        $record->is_acknowledged = 0;
        $record->notification_sent = 0;
        $record->timecreated = time();
        $record->timemodified = time();

        $alert_id = $DB->insert_record('lms_inefficiency_alerts', $record);
        $record->id = $alert_id;

        // Send notification
        $notifier = new notifier();
        $notifier->send_notification($record);

        // Update analytics
        $this->update_analytics($userid, $courseid);

        return $record;
    }

    /**
     * Check for duplicate alerts
     *
     * @param int $userid User ID
     * @param string $alert_type Alert type
     * @param int $timewindow Time window in seconds
     * @return bool True if duplicate exists
     */
    private function check_duplicate_alert($userid, $alert_type, $timewindow) {
        global $DB;

        $cutoff = time() - $timewindow;

        $exists = $DB->record_exists_select('lms_inefficiency_alerts',
            'userid = :userid AND alert_type = :type AND timecreated >= :cutoff',
            array(
                'userid' => $userid,
                'type' => $alert_type,
                'cutoff' => $cutoff
            )
        );

        return $exists;
    }

    /**
     * Get user notification settings
     *
     * @param int $userid User ID
     * @return object Settings record
     */
    private function get_user_settings($userid) {
        global $DB;

        $settings = $DB->get_record('lms_notification_settings',
            array('userid' => $userid, 'notification_type' => 'inefficiency_alert')
        );

        if (!$settings) {
            // Create default settings
            $settings = new \stdClass();
            $settings->userid = $userid;
            $settings->notification_type = 'inefficiency_alert';
            $settings->enabled = 1;
            $settings->threshold_time = self::DEFAULT_TIME_THRESHOLD;
            $settings->threshold_attempts = self::DEFAULT_ATTEMPT_THRESHOLD;
            $settings->threshold_error_rate = self::DEFAULT_ERROR_RATE_THRESHOLD;
            $settings->email_enabled = 1;
            $settings->browser_enabled = 1;
            $settings->sms_enabled = 0;
            $settings->timecreated = time();
            $settings->timemodified = time();

            $settings->id = $DB->insert_record('lms_notification_settings', $settings);
        }

        return $settings;
    }

    /**
     * Update daily analytics
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return bool Success status
     */
    private function update_analytics($userid, $courseid) {
        global $DB;

        $date = date('Y-m-d');

        $analytics = $DB->get_record('lms_learning_analytics',
            array('userid' => $userid, 'courseid' => $courseid, 'date' => $date)
        );

        if (!$analytics) {
            $analytics = new \stdClass();
            $analytics->userid = $userid;
            $analytics->courseid = $courseid;
            $analytics->date = $date;
            $analytics->total_time_spent = 0;
            $analytics->total_attempts = 0;
            $analytics->success_rate = 0;
            $analytics->inefficiency_score = 0;
            $analytics->activities_completed = 0;
            $analytics->alerts_triggered = 0;
            $analytics->timecreated = time();
            $analytics->timemodified = time();
        }

        // Increment alert count
        $analytics->alerts_triggered++;

        // Calculate inefficiency score
        $analytics->inefficiency_score = $this->calculate_inefficiency_score($userid, $courseid);

        $analytics->timemodified = time();

        if (isset($analytics->id)) {
            $DB->update_record('lms_learning_analytics', $analytics);
        } else {
            $DB->insert_record('lms_learning_analytics', $analytics);
        }

        return true;
    }

    /**
     * Calculate inefficiency score
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return float Inefficiency score (0-100)
     */
    private function calculate_inefficiency_score($userid, $courseid) {
        $stats = tracker::get_statistics($userid, $courseid, 7);

        $score = 0;

        // Factor 1: Time efficiency (30% weight)
        if ($stats['avg_time_spent'] > self::DEFAULT_TIME_THRESHOLD) {
            $score += 30;
        } else if ($stats['avg_time_spent'] > (self::DEFAULT_TIME_THRESHOLD * 0.7)) {
            $score += 15;
        }

        // Factor 2: Success rate (40% weight)
        if ($stats['avg_success_rate'] < 0.3) {
            $score += 40;
        } else if ($stats['avg_success_rate'] < 0.5) {
            $score += 25;
        } else if ($stats['avg_success_rate'] < 0.7) {
            $score += 10;
        }

        // Factor 3: Attempt efficiency (30% weight)
        $avg_attempts = $stats['total_attempts'] > 0 ?
            $stats['total_attempts'] / $stats['total_activities'] : 0;

        if ($avg_attempts > self::DEFAULT_ATTEMPT_THRESHOLD) {
            $score += 30;
        } else if ($avg_attempts > (self::DEFAULT_ATTEMPT_THRESHOLD * 0.7)) {
            $score += 15;
        }

        return round($score, 2);
    }

    /**
     * Get alerts for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @param bool $acknowledged_only Show only acknowledged alerts
     * @param int $limit Number of alerts to retrieve
     * @param int $offset Offset for pagination
     * @return array Array of alerts
     */
    public static function get_user_alerts($userid, $courseid = null, $acknowledged_only = false, $limit = 20, $offset = 0) {
        global $DB;

        $params = array('userid' => $userid);
        $conditions = array('userid = :userid');

        if ($courseid !== null) {
            $conditions[] = 'courseid = :courseid';
            $params['courseid'] = $courseid;
        }

        if ($acknowledged_only !== null) {
            $conditions[] = 'is_acknowledged = :acknowledged';
            $params['acknowledged'] = $acknowledged_only ? 1 : 0;
        }

        $sql = "SELECT * FROM {lms_inefficiency_alerts}
                WHERE " . implode(' AND ', $conditions) . "
                ORDER BY timecreated DESC";

        return $DB->get_records_sql($sql, $params, $offset, $limit);
    }
}
