<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * English language strings
 *
 * @package    local_flowmoments
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Flow Moments';
$string['flowmoments'] = 'Flow Moments';
$string['flowmoments_dashboard'] = 'Flow Moments Dashboard';
$string['flowmoments_for'] = 'Flow Moments for {$a}';

// Capabilities
$string['flowmoments:viewown'] = 'View own flow moments';
$string['flowmoments:viewreports'] = 'View all users\' flow moments';

// Dashboard
$string['summary_statistics'] = 'Summary Statistics';
$string['total_flow_moments'] = 'Total Flow Moments';
$string['avg_flow_score'] = 'Average Flow Score';
$string['total_flow_hours'] = 'Total Flow Time (hours)';
$string['last_flow_moment'] = 'Last Flow Moment';
$string['never'] = 'Never';
$string['no_flow_data'] = 'No flow data available yet. Complete some activities to start tracking.';
$string['flow_moments_history'] = 'Flow Moments History';

// Table headers
$string['start_time'] = 'Start Time';
$string['duration'] = 'Duration';
$string['flow_score'] = 'Flow Score';
$string['indicators'] = 'Flow Indicators';

// Indicators
$string['indicator_time_consistency'] = 'Time Consistency';
$string['indicator_error_rate'] = 'Optimal Challenge';
$string['indicator_continuity'] = 'Continuity';
$string['indicator_input_rhythm'] = 'Input Rhythm';
$string['indicator_correction_rate'] = 'Self-Correction';
$string['indicator_response_time'] = 'Response Consistency';

// Privacy
$string['privacy:metadata:local_flowmoments_tracking'] = 'Stores student behavior tracking data for flow detection';
$string['privacy:metadata:local_flowmoments_tracking:userid'] = 'User ID';
$string['privacy:metadata:local_flowmoments_tracking:courseid'] = 'Course ID';
$string['privacy:metadata:local_flowmoments_tracking:eventtype'] = 'Type of event (click, input, etc.)';
$string['privacy:metadata:local_flowmoments_tracking:eventdata'] = 'Event data (JSON)';
$string['privacy:metadata:local_flowmoments_tracking:timestamp'] = 'Event timestamp';

$string['privacy:metadata:local_flowmoments_detected'] = 'Stores detected flow moments';
$string['privacy:metadata:local_flowmoments_detected:userid'] = 'User ID';
$string['privacy:metadata:local_flowmoments_detected:courseid'] = 'Course ID';
$string['privacy:metadata:local_flowmoments_detected:flowscore'] = 'Flow state score';
$string['privacy:metadata:local_flowmoments_detected:starttime'] = 'Flow moment start time';
$string['privacy:metadata:local_flowmoments_detected:duration'] = 'Flow moment duration';

$string['privacy:metadata:local_flowmoments_summary'] = 'Stores aggregated flow statistics';
$string['privacy:metadata:local_flowmoments_summary:userid'] = 'User ID';
$string['privacy:metadata:local_flowmoments_summary:courseid'] = 'Course ID';
$string['privacy:metadata:local_flowmoments_summary:totalflowmoments'] = 'Total number of flow moments';
$string['privacy:metadata:local_flowmoments_summary:avgflowscore'] = 'Average flow score';
