<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Engagement Alert System';
$string['engagementalert'] = 'Engagement Alert';

// Capabilities
$string['engagementalert:view'] = 'View engagement alerts';
$string['engagementalert:viewreports'] = 'View engagement reports';
$string['engagementalert:configure'] = 'Configure engagement alert settings';
$string['engagementalert:receivealerts'] = 'Receive engagement alerts';

// Settings
$string['settings_header'] = 'Engagement Alert Settings';
$string['inactive_threshold'] = 'Inactivity threshold';
$string['inactive_threshold_desc'] = 'Time in seconds before considering user inactive (default: 120)';
$string['unfocus_threshold'] = 'Unfocus threshold';
$string['unfocus_threshold_desc'] = 'Time in seconds of unfocused state before alert (default: 60)';
$string['enable_student_alerts'] = 'Enable student alerts';
$string['enable_student_alerts_desc'] = 'Show pop-up alerts to students when drift is detected';
$string['enable_teacher_alerts'] = 'Enable teacher alerts';
$string['enable_teacher_alerts_desc'] = 'Send notifications to teachers when student drift is detected';
$string['tracking_interval'] = 'Tracking interval';
$string['tracking_interval_desc'] = 'How often to send tracking data to server (seconds, default: 30)';
$string['alert_cooldown'] = 'Alert cooldown';
$string['alert_cooldown_desc'] = 'Minimum time between alerts for same user (seconds, default: 300)';

// Alert messages
$string['alert_student_title'] = 'Are you still with us?';
$string['alert_student_message'] = 'We noticed you might be losing focus. Take a quick break or refocus on the material!';
$string['alert_teacher_title'] = 'Student engagement alert';
$string['alert_teacher_message'] = '{$a->fullname} appears to be losing focus in {$a->coursename}';

// Alert types
$string['alerttype_inactive'] = 'Inactive';
$string['alerttype_unfocused'] = 'Unfocused';
$string['alerttype_slow_progress'] = 'Slow progress';

// Report strings
$string['report_title'] = 'Engagement Report';
$string['engagement_score'] = 'Engagement Score';
$string['total_alerts'] = 'Total Alerts';
$string['session_duration'] = 'Session Duration';
$string['last_activity'] = 'Last Activity';

// Privacy
$string['privacy:metadata:local_engagement_events'] = 'Stores user engagement tracking events';
$string['privacy:metadata:local_engagement_events:userid'] = 'The ID of the user';
$string['privacy:metadata:local_engagement_events:eventtype'] = 'Type of engagement event';
$string['privacy:metadata:local_engagement_events:timestamp'] = 'When the event occurred';
$string['privacy:metadata:local_engagement_alerts'] = 'Stores detected engagement drift incidents';
$string['privacy:metadata:local_engagement_alerts:userid'] = 'The ID of the user';
$string['privacy:metadata:local_engagement_alerts:alerttype'] = 'Type of alert triggered';
$string['privacy:metadata:local_engagement_alerts:detected_at'] = 'When the drift was detected';
