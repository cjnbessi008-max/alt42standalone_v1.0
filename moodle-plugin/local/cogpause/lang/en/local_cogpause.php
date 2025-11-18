<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Cognitive Pause Tracking
 *
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Cognitive Pause Tracking';
$string['cogpause'] = 'Cognitive Pause';

// Settings
$string['settings_header'] = 'Cognitive Pause Tracking Settings';
$string['enable_tracking'] = 'Enable Pause Tracking';
$string['enable_tracking_desc'] = 'Enable cognitive pause tracking for all quizzes';
$string['pause_threshold'] = 'Pause Threshold (ms)';
$string['pause_threshold_desc'] = 'Time of inactivity (milliseconds) before considering it a pause';
$string['thinking_threshold'] = 'Thinking Threshold (ms)';
$string['thinking_threshold_desc'] = 'Pauses shorter than this are classified as "thinking"';
$string['confusion_threshold'] = 'Confusion Threshold (ms)';
$string['confusion_threshold_desc'] = 'Pauses between thinking and this threshold are "confusion"';
$string['distraction_threshold'] = 'Distraction Threshold (ms)';
$string['distraction_threshold_desc'] = 'Pauses longer than this are classified as "distraction"';

// Capabilities
$string['cogpause:view'] = 'View cognitive pause data';
$string['cogpause:viewown'] = 'View own cognitive pause data';
$string['cogpause:manage'] = 'Manage cognitive pause settings';

// Dashboard
$string['dashboard_title'] = 'Cognitive Pause Analytics Dashboard';
$string['student_profile'] = 'Student Cognitive Profile';
$string['question_analysis'] = 'Question Pause Analysis';
$string['at_risk_students'] = 'At-Risk Students';
$string['pause_visualization'] = 'Pause Visualization';

// Pause types
$string['pause_type_thinking'] = 'Thinking';
$string['pause_type_confusion'] = 'Confusion';
$string['pause_type_distraction'] = 'Distraction';
$string['pause_type_rereading'] = 'Re-reading';
$string['pause_type_unknown'] = 'Unknown';

// Analytics
$string['total_pauses'] = 'Total Pauses';
$string['avg_pause_duration'] = 'Average Pause Duration';
$string['cognitive_load_score'] = 'Cognitive Load Score';
$string['struggle_indicator'] = 'Struggle Indicator';
$string['pause_difficulty_score'] = 'Pause Difficulty Score';

// Messages
$string['tracking_enabled'] = 'Pause tracking is enabled for this quiz';
$string['tracking_disabled'] = 'Pause tracking is disabled';
$string['data_saved_success'] = 'Pause data saved successfully';
$string['data_saved_error'] = 'Error saving pause data';

// Privacy
$string['privacy:metadata:cognitive_pause_events'] = 'Stores cognitive pause events during quiz attempts';
$string['privacy:metadata:cognitive_pause_events:userid'] = 'The ID of the user';
$string['privacy:metadata:cognitive_pause_events:pause_start_time'] = 'When the pause started';
$string['privacy:metadata:cognitive_pause_events:pause_duration_ms'] = 'How long the pause lasted';
$string['privacy:metadata:cognitive_pause_events:pause_type'] = 'The type of pause detected';
