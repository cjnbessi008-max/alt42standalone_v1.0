<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Anxiety Alert Manager
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_anxiety;

defined('MOODLE_INTERNAL') || die();

/**
 * Class alert_manager
 *
 * Manages anxiety alerts and notifications
 */
class alert_manager {

    /**
     * Check if an alert should be created and create it
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param object $analysis Anxiety analysis result
     * @return bool|int Alert ID if created, false otherwise
     */
    public static function check_and_create_alert($userid, $courseid, $analysis) {
        global $DB;

        // Only create alerts for concerning levels
        if ($analysis->level === analyzer::LEVEL_NORMAL) {
            return false;
        }

        // Check if alert was recently sent (rate limiting)
        $config = $DB->get_record('local_anxiety_config', ['courseid' => $courseid]);
        if (!$config) {
            $config = $DB->get_record('local_anxiety_config', ['courseid' => 0]);
        }

        if (!$config || !$config->enable_alerts) {
            return false;
        }

        // Check for recent alerts
        $recent_alert = $DB->get_record_sql(
            "SELECT *
             FROM {local_anxiety_alerts}
             WHERE userid = :userid
               AND courseid = :courseid
               AND alert_type = :alert_type
               AND timecreated > :threshold
             ORDER BY timecreated DESC
             LIMIT 1",
            [
                'userid' => $userid,
                'courseid' => $courseid,
                'alert_type' => $analysis->level,
                'threshold' => time() - $config->alert_frequency
            ]
        );

        if ($recent_alert) {
            return false; // Alert already sent recently
        }

        // Create alert
        return self::create_alert($userid, $courseid, $analysis);
    }

    /**
     * Create an anxiety alert
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param object $analysis Anxiety analysis result
     * @return int Alert ID
     */
    public static function create_alert($userid, $courseid, $analysis) {
        global $DB;

        // Get user info
        $user = $DB->get_record('user', ['id' => $userid], 'id, firstname, lastname');
        $course = $DB->get_record('course', ['id' => $courseid], 'id, fullname');

        // Generate message
        $message = self::generate_alert_message($user, $course, $analysis);

        // Create alert record
        $alert = (object)[
            'userid' => $userid,
            'courseid' => $courseid,
            'alert_type' => $analysis->level,
            'anxiety_score' => $analysis->score,
            'message' => $message,
            'is_read' => 0,
            'acknowledged_by' => null,
            'acknowledged_at' => null,
            'timecreated' => time()
        ];

        $alert->id = $DB->insert_record('local_anxiety_alerts', $alert);

        // Send notifications to teachers
        self::notify_teachers($alert, $courseid);

        return $alert->id;
    }

    /**
     * Generate alert message
     *
     * @param object $user User record
     * @param object $course Course record
     * @param object $analysis Analysis result
     * @return string Alert message
     */
    private static function generate_alert_message($user, $course, $analysis) {
        $fullname = fullname($user);
        $coursename = $course->fullname;
        $score = round($analysis->score, 1);

        $level_text = [
            analyzer::LEVEL_MILD => get_string('anxiety_level_mild', 'local_anxiety'),
            analyzer::LEVEL_MODERATE => get_string('anxiety_level_moderate', 'local_anxiety'),
            analyzer::LEVEL_SEVERE => get_string('anxiety_level_severe', 'local_anxiety')
        ];

        $message = get_string('alert_message_template', 'local_anxiety', [
            'student' => $fullname,
            'course' => $coursename,
            'level' => $level_text[$analysis->level] ?? $analysis->level,
            'score' => $score
        ]);

        // Add component breakdown
        $components = [];
        foreach ($analysis->components as $key => $value) {
            if ($value > 50) { // Only show concerning components
                $components[] = get_string('component_' . $key, 'local_anxiety') . ': ' . round($value, 1);
            }
        }

        if (!empty($components)) {
            $message .= "\n\n" . get_string('high_components', 'local_anxiety') . ":\n- " . implode("\n- ", $components);
        }

        return $message;
    }

    /**
     * Notify teachers about the alert
     *
     * @param object $alert Alert record
     * @param int $courseid Course ID
     */
    private static function notify_teachers($alert, $courseid) {
        global $DB;

        // Get course context
        $context = \context_course::instance($courseid);

        // Get users with receivealerts capability
        $teachers = get_users_by_capability($context, 'local/anxiety:receivealerts');

        foreach ($teachers as $teacher) {
            // Send Moodle message
            $message = new \core\message\message();
            $message->component = 'local_anxiety';
            $message->name = 'anxietyalert';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $teacher;
            $message->subject = get_string('alert_subject', 'local_anxiety');
            $message->fullmessage = $alert->message;
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = nl2br($alert->message);
            $message->smallmessage = get_string('alert_small_message', 'local_anxiety');
            $message->notification = 1;
            $message->contexturl = new \moodle_url('/local/anxiety/dashboard.php', ['courseid' => $courseid]);
            $message->contexturlname = get_string('view_dashboard', 'local_anxiety');

            message_send($message);
        }
    }

    /**
     * Acknowledge an alert
     *
     * @param int $alertid Alert ID
     * @param int $userid User ID acknowledging
     * @return bool Success
     */
    public static function acknowledge_alert($alertid, $userid) {
        global $DB;

        $alert = $DB->get_record('local_anxiety_alerts', ['id' => $alertid]);
        if (!$alert) {
            return false;
        }

        $alert->is_read = 1;
        $alert->acknowledged_by = $userid;
        $alert->acknowledged_at = time();

        return $DB->update_record('local_anxiety_alerts', $alert);
    }

    /**
     * Get unread alerts for a course
     *
     * @param int $courseid Course ID
     * @param int $limit Maximum number of alerts
     * @return array Array of alert records
     */
    public static function get_unread_alerts($courseid, $limit = 50) {
        global $DB;

        $sql = "SELECT a.*, u.firstname, u.lastname
                FROM {local_anxiety_alerts} a
                JOIN {user} u ON u.id = a.userid
                WHERE a.courseid = :courseid
                  AND a.is_read = 0
                ORDER BY a.timecreated DESC
                LIMIT :limit";

        return $DB->get_records_sql($sql, ['courseid' => $courseid, 'limit' => $limit]);
    }

    /**
     * Get all alerts for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @param int $limit Maximum number of alerts
     * @return array Array of alert records
     */
    public static function get_user_alerts($userid, $courseid = null, $limit = 50) {
        global $DB;

        $params = ['userid' => $userid, 'limit' => $limit];
        $where = 'userid = :userid';

        if ($courseid) {
            $where .= ' AND courseid = :courseid';
            $params['courseid'] = $courseid;
        }

        $sql = "SELECT *
                FROM {local_anxiety_alerts}
                WHERE $where
                ORDER BY timecreated DESC
                LIMIT :limit";

        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Get alert statistics for a course
     *
     * @param int $courseid Course ID
     * @param int $timerange Time range in seconds
     * @return object Statistics object
     */
    public static function get_alert_statistics($courseid, $timerange = 604800) {
        global $DB;

        $threshold = time() - $timerange;

        $sql = "SELECT
                    COUNT(*) as total_alerts,
                    SUM(CASE WHEN alert_type = 'mild' THEN 1 ELSE 0 END) as mild_alerts,
                    SUM(CASE WHEN alert_type = 'moderate' THEN 1 ELSE 0 END) as moderate_alerts,
                    SUM(CASE WHEN alert_type = 'severe' THEN 1 ELSE 0 END) as severe_alerts,
                    SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as acknowledged_alerts,
                    AVG(anxiety_score) as avg_score
                FROM {local_anxiety_alerts}
                WHERE courseid = :courseid
                  AND timecreated > :threshold";

        $stats = $DB->get_record_sql($sql, ['courseid' => $courseid, 'threshold' => $threshold]);

        return $stats ?: (object)[
            'total_alerts' => 0,
            'mild_alerts' => 0,
            'moderate_alerts' => 0,
            'severe_alerts' => 0,
            'acknowledged_alerts' => 0,
            'avg_score' => 0
        ];
    }
}
