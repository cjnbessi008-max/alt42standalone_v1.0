<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Alert management for engagement monitoring
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_engagementalert;

defined('MOODLE_INTERNAL') || die();

/**
 * Alert manager class
 */
class alert_manager {

    /**
     * Create an engagement alert
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $cmid Course module ID
     * @param string $sessionid Session ID
     * @param string $alerttype Alert type
     * @param int $duration Duration in seconds
     * @return bool Success status
     */
    public function create_alert($userid, $courseid, $cmid, $sessionid, $alerttype, $duration) {
        global $DB;

        // Check if we recently sent an alert for this user/session
        $cooldown = get_config('local_engagementalert', 'alert_cooldown') ?: 300;
        $recentalert = $DB->get_record_select(
            'local_engagement_alerts',
            'userid = :userid AND sessionid = :sessionid AND detected_at > :cutoff',
            [
                'userid' => $userid,
                'sessionid' => $sessionid,
                'cutoff' => time() - $cooldown
            ],
            '*',
            IGNORE_MULTIPLE
        );

        if ($recentalert) {
            // Skip - too soon since last alert
            return false;
        }

        // Calculate severity based on duration
        $severity = $this->calculate_severity($alerttype, $duration);

        // Create alert record
        $alert = new \stdClass();
        $alert->userid = $userid;
        $alert->courseid = $courseid;
        $alert->cmid = $cmid ?: null;
        $alert->sessionid = $sessionid;
        $alert->alerttype = $alerttype;
        $alert->duration = $duration;
        $alert->detected_at = time();
        $alert->notified_student = 0;
        $alert->notified_teacher = 0;
        $alert->severity = $severity;

        try {
            $alertid = $DB->insert_record('local_engagement_alerts', $alert);

            // Update session alert count
            $this->update_session_alert_count($sessionid);

            // Send notifications
            $this->send_notifications($alertid, $userid, $courseid, $alerttype);

            return true;
        } catch (\Exception $e) {
            debugging('Failed to create alert: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Calculate severity level
     *
     * @param string $alerttype Alert type
     * @param int $duration Duration in seconds
     * @return int Severity level (1-5)
     */
    protected function calculate_severity($alerttype, $duration) {
        switch ($alerttype) {
            case 'inactive':
                if ($duration > 300) return 5; // Very high
                if ($duration > 180) return 4; // High
                if ($duration > 120) return 3; // Medium
                if ($duration > 60) return 2;  // Low
                return 1; // Very low

            case 'unfocused':
                if ($duration > 180) return 5;
                if ($duration > 120) return 4;
                if ($duration > 90) return 3;
                if ($duration > 60) return 2;
                return 1;

            case 'slow_progress':
                return 3; // Default medium severity

            default:
                return 1;
        }
    }

    /**
     * Update session alert count
     *
     * @param string $sessionid Session ID
     */
    protected function update_session_alert_count($sessionid) {
        global $DB;

        $session = $DB->get_record('local_engagement_sessions', ['sessionid' => $sessionid]);
        if ($session) {
            $session->total_alerts++;
            $DB->update_record('local_engagement_sessions', $session);
        }
    }

    /**
     * Send notifications for an alert
     *
     * @param int $alertid Alert ID
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param string $alerttype Alert type
     */
    protected function send_notifications($alertid, $userid, $courseid, $alerttype) {
        global $DB;

        $enableTeacherAlerts = get_config('local_engagementalert', 'enable_teacher_alerts');

        if ($enableTeacherAlerts) {
            $this->notify_teachers($alertid, $userid, $courseid, $alerttype);
        }

        // Mark that student was notified (handled by JavaScript)
        $DB->set_field('local_engagement_alerts', 'notified_student', 1, ['id' => $alertid]);
    }

    /**
     * Notify teachers about student engagement alert
     *
     * @param int $alertid Alert ID
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param string $alerttype Alert type
     */
    protected function notify_teachers($alertid, $userid, $courseid, $alerttype) {
        global $DB;

        // Get course context and teachers
        $context = \context_course::instance($courseid);
        $teachers = get_users_by_capability($context, 'local/engagementalert:receivealerts');

        if (empty($teachers)) {
            return;
        }

        // Get user and course info
        $user = $DB->get_record('user', ['id' => $userid]);
        $course = $DB->get_record('course', ['id' => $courseid]);

        if (!$user || !$course) {
            return;
        }

        $messageparams = new \stdClass();
        $messageparams->fullname = fullname($user);
        $messageparams->coursename = $course->fullname;

        $messagetext = get_string('alert_teacher_message', 'local_engagementalert', $messageparams);

        // Send message to each teacher
        foreach ($teachers as $teacher) {
            $message = new \core\message\message();
            $message->component = 'local_engagementalert';
            $message->name = 'engagementalert';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $teacher;
            $message->subject = get_string('alert_teacher_title', 'local_engagementalert');
            $message->fullmessage = $messagetext;
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '<p>' . $messagetext . '</p>';
            $message->smallmessage = $messagetext;
            $message->notification = 1;
            $message->contexturl = new \moodle_url('/course/view.php', ['id' => $courseid]);
            $message->contexturlname = $course->fullname;

            message_send($message);
        }

        // Mark as notified
        $DB->set_field('local_engagement_alerts', 'notified_teacher', 1, ['id' => $alertid]);
    }

    /**
     * Get alerts for a user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID (optional)
     * @param int $limit Limit
     * @return array Array of alerts
     */
    public function get_user_alerts($userid, $courseid = 0, $limit = 50) {
        global $DB;

        $params = ['userid' => $userid];
        $where = 'userid = :userid';

        if ($courseid) {
            $where .= ' AND courseid = :courseid';
            $params['courseid'] = $courseid;
        }

        $sql = "SELECT * FROM {local_engagement_alerts}
                WHERE $where
                ORDER BY detected_at DESC";

        return $DB->get_records_sql($sql, $params, 0, $limit);
    }

    /**
     * Get course-wide alerts
     *
     * @param int $courseid Course ID
     * @param int $starttime Start time
     * @param int $endtime End time
     * @return array Array of alerts with user info
     */
    public function get_course_alerts($courseid, $starttime = 0, $endtime = 0) {
        global $DB;

        if (!$endtime) {
            $endtime = time();
        }
        if (!$starttime) {
            $starttime = $endtime - (24 * 60 * 60); // Last 24 hours
        }

        $sql = "SELECT a.*, u.firstname, u.lastname, u.email
                FROM {local_engagement_alerts} a
                JOIN {user} u ON u.id = a.userid
                WHERE a.courseid = :courseid
                  AND a.detected_at BETWEEN :start AND :end
                ORDER BY a.detected_at DESC";

        return $DB->get_records_sql($sql, [
            'courseid' => $courseid,
            'start' => $starttime,
            'end' => $endtime
        ]);
    }
}
