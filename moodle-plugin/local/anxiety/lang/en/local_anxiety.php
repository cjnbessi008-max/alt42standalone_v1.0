<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = 'Anxiety Detection System';

// Capabilities
$string['anxiety:view'] = 'View own anxiety data';
$string['anxiety:viewothers'] = 'View other users\' anxiety data';
$string['anxiety:manage'] = 'Manage anxiety detection settings';
$string['anxiety:receivealerts'] = 'Receive anxiety alerts';

// Dashboard
$string['dashboard'] = 'Anxiety Dashboard';
$string['anxiety_dashboard'] = 'Anxiety Monitoring Dashboard';
$string['anxiety_report_for'] = 'Anxiety Report for {$a}';
$string['current_status'] = 'Current Status';
$string['anxiety_trend'] = 'Anxiety Trend';
$string['anxiety_distribution'] = 'Anxiety Level Distribution';
$string['students_overview'] = 'Students Overview';
$string['recent_alerts'] = 'Recent Alerts';
$string['view_dashboard'] = 'View Dashboard';

// Time ranges
$string['timerange'] = 'Time Range';
$string['today'] = 'Today';
$string['this_week'] = 'This Week';
$string['this_month'] = 'This Month';

// Anxiety levels
$string['anxiety_level_normal'] = 'Normal';
$string['anxiety_level_mild'] = 'Mild Anxiety';
$string['anxiety_level_moderate'] = 'Moderate Anxiety';
$string['anxiety_level_severe'] = 'Severe Anxiety';

// Alerts
$string['alert_subject'] = 'Student Anxiety Alert';
$string['alert_small_message'] = 'A student is experiencing high anxiety';
$string['alert_message_template'] = 'Student {$a->student} in course {$a->course} is showing {$a->level} (score: {$a->score}).';
$string['high_components'] = 'High concern indicators';
$string['high_anxiety_warning'] = 'Your stress level seems high. Consider taking a short break, deep breaths, or reaching out for support.';

// Components
$string['component_response_time'] = 'Response Time';
$string['component_error_rate'] = 'Error Rate';
$string['component_click_frequency'] = 'Click Frequency';
$string['component_time_on_task'] = 'Time on Task';
$string['component_navigation'] = 'Navigation Pattern';
$string['component_session_duration'] = 'Session Duration';

// Tips
$string['anxiety_tips_title'] = 'Tips for Managing Study Anxiety';
$string['anxiety_tip_1'] = 'Take regular breaks every 25-30 minutes (Pomodoro Technique)';
$string['anxiety_tip_2'] = 'Practice deep breathing: inhale for 4 counts, hold for 4, exhale for 4';
$string['anxiety_tip_3'] = 'Don\'t hesitate to ask for help from teachers or classmates';
$string['anxiety_tip_4'] = 'Break complex problems into smaller, manageable steps';
$string['anxiety_tip_5'] = 'Maintain a positive mindset: mistakes are learning opportunities';

// Settings
$string['settings_heading'] = 'Anxiety Detection Settings';
$string['mild_threshold'] = 'Mild Anxiety Threshold';
$string['mild_threshold_desc'] = 'Anxiety score threshold for mild level (0-100)';
$string['moderate_threshold'] = 'Moderate Anxiety Threshold';
$string['moderate_threshold_desc'] = 'Anxiety score threshold for moderate level (0-100)';
$string['severe_threshold'] = 'Severe Anxiety Threshold';
$string['severe_threshold_desc'] = 'Anxiety score threshold for severe level (0-100)';
$string['enable_alerts'] = 'Enable Alerts';
$string['enable_alerts_desc'] = 'Send alerts to teachers when students show high anxiety';
$string['alert_frequency'] = 'Alert Frequency';
$string['alert_frequency_desc'] = 'Minimum time between alerts for same student (in seconds)';

// Privacy
$string['privacy:metadata:local_anxiety_metrics'] = 'Stores behavioral metrics for anxiety detection';
$string['privacy:metadata:local_anxiety_metrics:userid'] = 'User ID';
$string['privacy:metadata:local_anxiety_metrics:anxiety_score'] = 'Calculated anxiety score';
$string['privacy:metadata:local_anxiety_metrics:timecreated'] = 'Time when metric was recorded';
