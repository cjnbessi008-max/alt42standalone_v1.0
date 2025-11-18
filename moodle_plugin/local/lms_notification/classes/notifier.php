<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Notification handler class
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_lms_notification;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/message/lib.php');

/**
 * Class for sending notifications to users
 */
class notifier {

    /**
     * Send notification for an alert
     *
     * @param object $alert Alert record
     * @return bool Success status
     */
    public function send_notification($alert) {
        global $DB;

        // Get user settings
        $settings = $DB->get_record('lms_notification_settings',
            array('userid' => $alert->userid, 'notification_type' => 'inefficiency_alert')
        );

        if (!$settings || !$settings->enabled) {
            return false;
        }

        $success = true;

        // Send Moodle message notification
        if ($settings->browser_enabled) {
            $success = $success && $this->send_moodle_message($alert);
        }

        // Send email notification
        if ($settings->email_enabled) {
            $success = $success && $this->send_email($alert);
        }

        // Send SMS notification (if enabled)
        if ($settings->sms_enabled) {
            $success = $success && $this->send_sms($alert);
        }

        // Notify teachers
        $this->notify_teachers($alert);

        // Update notification status
        if ($success) {
            $alert->notification_sent = 1;
            $alert->notification_time = time();
            $DB->update_record('lms_inefficiency_alerts', $alert);
        }

        return $success;
    }

    /**
     * Send Moodle message notification
     *
     * @param object $alert Alert record
     * @return bool Success status
     */
    private function send_moodle_message($alert) {
        global $DB;

        try {
            $user = $DB->get_record('user', array('id' => $alert->userid), '*', MUST_EXIST);

            $message = new \core\message\message();
            $message->component = 'local_lms_notification';
            $message->name = 'inefficiency_alert';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $user;
            $message->subject = $this->get_alert_subject($alert);
            $message->fullmessage = $this->format_message_text($alert);
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = $this->format_message_html($alert);
            $message->smallmessage = $alert->description;
            $message->notification = 1;
            $message->contexturl = $this->get_alert_url($alert);
            $message->contexturlname = get_string('view_alert', 'local_lms_notification');

            $messageid = message_send($message);

            return $messageid !== false;
        } catch (\Exception $e) {
            debugging('Failed to send Moodle message: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Send email notification
     *
     * @param object $alert Alert record
     * @return bool Success status
     */
    private function send_email($alert) {
        global $DB;

        try {
            $user = $DB->get_record('user', array('id' => $alert->userid), '*', MUST_EXIST);
            $course = $DB->get_record('course', array('id' => $alert->courseid));

            $subject = $this->get_alert_subject($alert);
            $messagetext = $this->format_email_text($alert, $course);
            $messagehtml = $this->format_email_html($alert, $course);

            return email_to_user(
                $user,
                \core_user::get_noreply_user(),
                $subject,
                $messagetext,
                $messagehtml
            );
        } catch (\Exception $e) {
            debugging('Failed to send email: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Send SMS notification (placeholder for external SMS service)
     *
     * @param object $alert Alert record
     * @return bool Success status
     */
    private function send_sms($alert) {
        // Implement SMS sending logic here
        // This would typically integrate with an SMS gateway service
        // For now, this is a placeholder

        debugging('SMS notifications are not yet implemented', DEBUG_DEVELOPER);
        return true;
    }

    /**
     * Notify teachers about student alerts
     *
     * @param object $alert Alert record
     * @return bool Success status
     */
    private function notify_teachers($alert) {
        global $DB;

        // Only notify for high severity alerts
        if ($alert->severity !== 'high' && $alert->severity !== 'critical') {
            return false;
        }

        try {
            $course = $DB->get_record('course', array('id' => $alert->courseid));
            $context = \context_course::instance($alert->courseid);

            // Get teachers with notification capability
            $teachers = get_enrolled_users($context, 'local/lms_notification:viewallalerts');

            foreach ($teachers as $teacher) {
                $this->send_teacher_notification($teacher, $alert);
            }

            return true;
        } catch (\Exception $e) {
            debugging('Failed to notify teachers: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Send notification to a teacher
     *
     * @param object $teacher Teacher user record
     * @param object $alert Alert record
     * @return bool Success status
     */
    private function send_teacher_notification($teacher, $alert) {
        global $DB;

        try {
            $student = $DB->get_record('user', array('id' => $alert->userid));
            $course = $DB->get_record('course', array('id' => $alert->courseid));

            $message = new \core\message\message();
            $message->component = 'local_lms_notification';
            $message->name = 'teacher_alert';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = $teacher;
            $message->subject = get_string('teacher_alert_subject', 'local_lms_notification');
            $message->fullmessage = $this->format_teacher_message_text($alert, $student, $course);
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = $this->format_teacher_message_html($alert, $student, $course);
            $message->smallmessage = get_string('teacher_alert_small', 'local_lms_notification',
                array('student' => fullname($student), 'type' => $alert->alert_type));
            $message->notification = 1;
            $message->contexturl = $this->get_student_alert_url($alert);
            $message->contexturlname = get_string('view_student_progress', 'local_lms_notification');

            return message_send($message) !== false;
        } catch (\Exception $e) {
            debugging('Failed to send teacher notification: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return false;
        }
    }

    /**
     * Get alert subject line
     *
     * @param object $alert Alert record
     * @return string Subject line
     */
    private function get_alert_subject($alert) {
        $severity_str = get_string('severity_' . $alert->severity, 'local_lms_notification');
        $type_str = get_string('alert_type_' . $alert->alert_type, 'local_lms_notification');

        return get_string('alert_subject', 'local_lms_notification',
            array('severity' => $severity_str, 'type' => $type_str));
    }

    /**
     * Format message text
     *
     * @param object $alert Alert record
     * @return string Formatted text
     */
    private function format_message_text($alert) {
        $metrics = json_decode($alert->metrics, true);

        $text = $alert->description . "\n\n";
        $text .= get_string('alert_details', 'local_lms_notification') . ":\n";

        foreach ($metrics as $key => $value) {
            $text .= "  " . get_string('metric_' . $key, 'local_lms_notification') . ": " . $value . "\n";
        }

        $text .= "\n" . get_string('alert_recommendation', 'local_lms_notification') . "\n";
        $text .= $this->get_recommendation($alert->alert_type);

        return $text;
    }

    /**
     * Format message HTML
     *
     * @param object $alert Alert record
     * @return string Formatted HTML
     */
    private function format_message_html($alert) {
        $metrics = json_decode($alert->metrics, true);

        $html = '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">';
        $html .= '<div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';

        // Alert icon and title
        $icon = $this->get_severity_icon($alert->severity);
        $html .= '<h2 style="color: ' . $this->get_severity_color($alert->severity) . ';">';
        $html .= $icon . ' ' . $alert->description;
        $html .= '</h2>';

        // Metrics
        $html .= '<h3>' . get_string('alert_details', 'local_lms_notification') . '</h3>';
        $html .= '<table style="width: 100%; border-collapse: collapse;">';
        foreach ($metrics as $key => $value) {
            $html .= '<tr style="border-bottom: 1px solid #eee;">';
            $html .= '<td style="padding: 8px; font-weight: bold;">' .
                     get_string('metric_' . $key, 'local_lms_notification') . '</td>';
            $html .= '<td style="padding: 8px;">' . $value . '</td>';
            $html .= '</tr>';
        }
        $html .= '</table>';

        // Recommendation
        $html .= '<h3>' . get_string('alert_recommendation', 'local_lms_notification') . '</h3>';
        $html .= '<p>' . $this->get_recommendation($alert->alert_type) . '</p>';

        // Action button
        $url = $this->get_alert_url($alert);
        $html .= '<p style="text-align: center; margin-top: 20px;">';
        $html .= '<a href="' . $url . '" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">';
        $html .= get_string('view_full_report', 'local_lms_notification');
        $html .= '</a>';
        $html .= '</p>';

        $html .= '</div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * Format email text
     *
     * @param object $alert Alert record
     * @param object $course Course record
     * @return string Formatted text
     */
    private function format_email_text($alert, $course) {
        $text = get_string('hello', 'local_lms_notification') . ",\n\n";
        $text .= get_string('email_intro', 'local_lms_notification',
            array('course' => $course->fullname)) . "\n\n";
        $text .= $this->format_message_text($alert);
        $text .= "\n\n" . get_string('email_footer', 'local_lms_notification');

        return $text;
    }

    /**
     * Format email HTML
     *
     * @param object $alert Alert record
     * @param object $course Course record
     * @return string Formatted HTML
     */
    private function format_email_html($alert, $course) {
        $html = '<html><body>';
        $html .= '<p>' . get_string('hello', 'local_lms_notification') . ',</p>';
        $html .= '<p>' . get_string('email_intro', 'local_lms_notification',
            array('course' => $course->fullname)) . '</p>';
        $html .= $this->format_message_html($alert);
        $html .= '<p style="margin-top: 20px; color: #666; font-size: 12px;">';
        $html .= get_string('email_footer', 'local_lms_notification');
        $html .= '</p>';
        $html .= '</body></html>';

        return $html;
    }

    /**
     * Format teacher message text
     *
     * @param object $alert Alert record
     * @param object $student Student record
     * @param object $course Course record
     * @return string Formatted text
     */
    private function format_teacher_message_text($alert, $student, $course) {
        $text = get_string('teacher_alert_intro', 'local_lms_notification',
            array('student' => fullname($student), 'course' => $course->fullname)) . "\n\n";
        $text .= $this->format_message_text($alert);

        return $text;
    }

    /**
     * Format teacher message HTML
     *
     * @param object $alert Alert record
     * @param object $student Student record
     * @param object $course Course record
     * @return string Formatted HTML
     */
    private function format_teacher_message_html($alert, $student, $course) {
        $html = '<html><body>';
        $html .= '<p>' . get_string('teacher_alert_intro', 'local_lms_notification',
            array('student' => fullname($student), 'course' => $course->fullname)) . '</p>';
        $html .= $this->format_message_html($alert);
        $html .= '</body></html>';

        return $html;
    }

    /**
     * Get recommendation based on alert type
     *
     * @param string $alert_type Alert type
     * @return string Recommendation text
     */
    private function get_recommendation($alert_type) {
        return get_string('recommendation_' . $alert_type, 'local_lms_notification');
    }

    /**
     * Get alert URL
     *
     * @param object $alert Alert record
     * @return string URL
     */
    private function get_alert_url($alert) {
        global $CFG;
        return $CFG->wwwroot . '/local/lms_notification/view.php?id=' . $alert->id;
    }

    /**
     * Get student alert URL (for teachers)
     *
     * @param object $alert Alert record
     * @return string URL
     */
    private function get_student_alert_url($alert) {
        global $CFG;
        return $CFG->wwwroot . '/local/lms_notification/student.php?userid=' .
               $alert->userid . '&courseid=' . $alert->courseid;
    }

    /**
     * Get severity icon
     *
     * @param string $severity Severity level
     * @return string Icon HTML
     */
    private function get_severity_icon($severity) {
        $icons = array(
            'low' => '&#9432;',     // ℹ️ info
            'medium' => '&#9888;',  // ⚠️ warning
            'high' => '&#10071;',   // ❗ exclamation
            'critical' => '&#128680;' // 🚨 rotating light
        );

        return isset($icons[$severity]) ? $icons[$severity] : '&#9432;';
    }

    /**
     * Get severity color
     *
     * @param string $severity Severity level
     * @return string Color hex code
     */
    private function get_severity_color($severity) {
        $colors = array(
            'low' => '#3498db',      // blue
            'medium' => '#f39c12',   // orange
            'high' => '#e74c3c',     // red
            'critical' => '#c0392b'  // dark red
        );

        return isset($colors[$severity]) ? $colors[$severity] : '#3498db';
    }
}
