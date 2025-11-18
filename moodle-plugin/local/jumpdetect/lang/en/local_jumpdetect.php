<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Language strings for Jump Detection Plugin
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Jump Reasoning Detection';
$string['jumpdetect'] = 'Jump Detection';
$string['dashboard'] = 'Jump Detection Dashboard';

// Capabilities
$string['jumpdetect:view'] = 'View jump detection dashboard';
$string['jumpdetect:configure'] = 'Configure jump detection settings';

// Jump types
$string['sequential'] = 'Sequential Jump';
$string['prerequisite'] = 'Prerequisite Skip';
$string['time_anomaly'] = 'Time Anomaly';
$string['assessment_evasion'] = 'Assessment Evasion';

// Severity levels
$string['severity_normal'] = 'Normal';
$string['severity_caution'] = 'Caution';
$string['severity_warning'] = 'Warning';
$string['severity_critical'] = 'Critical';

// Dashboard
$string['stats_summary'] = 'Statistics Summary';
$string['recent_alerts'] = 'Recent Alerts';
$string['student_scores'] = 'Student Jump Scores';
$string['jump_type_stats'] = 'Jump Type Statistics';

// Messages
$string['no_data'] = 'No data available';
$string['no_alerts'] = 'No recent alerts';

// Settings
$string['settings'] = 'Settings';
$string['sequential_threshold'] = 'Sequential Jump Threshold';
$string['sequential_threshold_desc'] = 'Number of modules that can be skipped before triggering detection';
$string['time_threshold'] = 'Time Anomaly Z-Score Threshold';
$string['time_threshold_desc'] = 'Z-score threshold for detecting abnormally fast completion';
$string['min_learning_time'] = 'Minimum Learning Time (seconds)';
$string['min_learning_time_desc'] = 'Minimum time required to complete a module';
