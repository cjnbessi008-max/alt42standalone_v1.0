<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'LMS Usage Notification System';
$string['lms_notification:view'] = 'View LMS notifications';
$string['lms_notification:viewalerts'] = 'View own alerts';
$string['lms_notification:viewallalerts'] = 'View all student alerts';
$string['lms_notification:managesettings'] = 'Manage notification settings';
$string['lms_notification:acknowledge'] = 'Acknowledge alerts';
$string['lms_notification:viewanalytics'] = 'View learning analytics';

// Alert types
$string['alert_type_excessive_time'] = 'Excessive Time Spent';
$string['alert_type_excessive_attempts'] = 'Excessive Attempts';
$string['alert_type_high_error_rate'] = 'High Error Rate';
$string['alert_type_learning_stagnation'] = 'Learning Stagnation';

// Severity levels
$string['severity_low'] = 'Low';
$string['severity_medium'] = 'Medium';
$string['severity_high'] = 'High';
$string['severity_critical'] = 'Critical';

// Alert messages
$string['alert_excessive_time'] = 'You have spent more than {$a->time} on this problem.';
$string['alert_excessive_attempts'] = 'You have made more than {$a->attempts} attempts on this problem.';
$string['alert_high_error_rate'] = 'Your recent error rate is {$a->rate}%.';
$string['alert_learning_stagnation'] = 'No learning activity for {$a->days} days.';

// Recommendations
$string['recommendation_excessive_time'] = 'Take a break or try a different approach. Use hints or ask your instructor for help if needed.';
$string['recommendation_excessive_attempts'] = 'Review the basic concepts and check the hints. Contact your instructor if difficulties persist.';
$string['recommendation_high_error_rate'] = 'Review the learning materials and ensure you understand the basic concepts before attempting problems. Try additional practice problems if needed.';
$string['recommendation_learning_stagnation'] = 'Establish a regular learning routine. Even a little progress each day can lead to better results.';

// Metrics
$string['metric_time_spent'] = 'Time Spent';
$string['metric_threshold'] = 'Threshold';
$string['metric_average_time'] = 'Average Time';
$string['metric_module_id'] = 'Module ID';
$string['metric_attempts'] = 'Attempts';
$string['metric_success_rate'] = 'Success Rate';
$string['metric_error_rate'] = 'Error Rate';
$string['metric_recent_activities'] = 'Recent Activities';
$string['metric_error_count'] = 'Error Count';
$string['metric_days_since_activity'] = 'Days Since Last Activity';
$string['metric_last_activity'] = 'Last Activity';

// Notification messages
$string['hello'] = 'Hello';
$string['email_intro'] = 'A learning pattern alert has been triggered in course "{$a->course}".';
$string['email_footer'] = 'This message was automatically sent by the LMS Usage Notification System.';
$string['alert_subject'] = '[{$a->severity}] {$a->type} Alert';
$string['alert_details'] = 'Details';
$string['alert_recommendation'] = 'Recommendation';
$string['view_alert'] = 'View Alert';
$string['view_full_report'] = 'View Full Report';
$string['view_student_progress'] = 'View Student Progress';

// Teacher notifications
$string['teacher_alert_subject'] = 'Student Learning Pattern Alert';
$string['teacher_alert_small'] = 'A {$a->type} alert was triggered for student {$a->student}.';
$string['teacher_alert_intro'] = 'The following learning pattern alert was triggered for student {$a->student} in course "{$a->course}".';

// Settings
$string['settings_header'] = 'Notification Settings';
$string['settings_general'] = 'General Settings';
$string['settings_thresholds'] = 'Threshold Settings';
$string['settings_notifications'] = 'Notification Channels';

$string['enable_notifications'] = 'Enable Notifications';
$string['enable_notifications_desc'] = 'Do you want to receive learning pattern alerts?';

$string['threshold_time'] = 'Time Threshold (seconds)';
$string['threshold_time_desc'] = 'An alert will be triggered when time spent on a single problem exceeds this value.';

$string['threshold_attempts'] = 'Attempts Threshold';
$string['threshold_attempts_desc'] = 'An alert will be triggered when the number of attempts exceeds this value.';

$string['threshold_error_rate'] = 'Error Rate Threshold';
$string['threshold_error_rate_desc'] = 'An alert will be triggered when the error rate of recent activities exceeds this value. (0.0 ~ 1.0)';

$string['email_enabled'] = 'Email Notifications';
$string['email_enabled_desc'] = 'Do you want to receive alerts via email?';

$string['browser_enabled'] = 'Browser Notifications';
$string['browser_enabled_desc'] = 'Do you want to receive browser notifications?';

$string['sms_enabled'] = 'SMS Notifications';
$string['sms_enabled_desc'] = 'Do you want to receive alerts via SMS? (if configured)';

// Dashboard
$string['dashboard'] = 'Dashboard';
$string['my_alerts'] = 'My Alerts';
$string['my_analytics'] = 'Learning Analytics';
$string['total_time'] = 'Total Learning Time';
$string['total_attempts'] = 'Total Attempts';
$string['success_rate'] = 'Success Rate';
$string['inefficiency_score'] = 'Inefficiency Score';
$string['recent_alerts'] = 'Recent Alerts';
$string['no_alerts'] = 'No alerts.';
$string['acknowledge'] = 'Acknowledge';
$string['acknowledged'] = 'Acknowledged';
$string['view_details'] = 'View Details';

// Time formatting
$string['time_seconds'] = '{$a} seconds';
$string['time_minutes'] = '{$a} minutes';
$string['time_hours'] = '{$a} hours';
$string['time_days'] = '{$a} days';

// Errors
$string['error_permission_denied'] = 'Permission denied.';
$string['error_not_enrolled'] = 'You are not enrolled in this course.';
$string['error_alert_not_found'] = 'Alert not found.';
$string['error_tracking_failed'] = 'Failed to track activity.';
