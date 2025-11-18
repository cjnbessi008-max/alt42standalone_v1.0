<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * English language strings for Student Priority Selection block.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Student Priority Selection';
$string['student_priority'] = 'Student Priority Selection';
$string['student_priority:addinstance'] = 'Add a new Student Priority Selection block';
$string['student_priority:myaddinstance'] = 'Add a new Student Priority Selection block to Dashboard';
$string['student_priority:setpriority'] = 'Set learning step priority';
$string['student_priority:viewreports'] = 'View priority selection reports';

// Block content strings
$string['pleaselogin'] = 'Please log in to select your priority learning step.';
$string['select_priority_header'] = 'What is your #1 priority to learn?';
$string['select_priority_instruction'] = 'Choose the most important learning step you want to focus on right now.';
$string['current_priority'] = 'Your current priority';
$string['selected'] = 'Selected';
$string['unknown_step'] = 'Unknown Step';

// Default learning steps
$string['step1_name'] = 'Understanding Core Concepts';
$string['step1_desc'] = 'Master the fundamental concepts and principles';
$string['step2_name'] = 'Practicing Basic Skills';
$string['step2_desc'] = 'Build proficiency through guided practice';
$string['step3_name'] = 'Problem Solving';
$string['step3_desc'] = 'Apply knowledge to solve real problems';
$string['step4_name'] = 'Critical Thinking';
$string['step4_desc'] = 'Analyze and evaluate complex scenarios';
$string['step5_name'] = 'Creative Application';
$string['step5_desc'] = 'Innovate and create new solutions';

// Configuration strings
$string['config_custom_steps'] = 'Custom Learning Steps';
$string['config_custom_steps_desc'] = 'Enter custom learning steps, one per line. Leave empty to use defaults.';
$string['config_require_reason'] = 'Require Reason';
$string['config_require_reason_desc'] = 'Require students to provide a reason for their selection';
$string['config_allow_change'] = 'Allow Changes';
$string['config_allow_change_desc'] = 'Allow students to change their priority selection';
$string['config_show_analytics'] = 'Show Analytics';
$string['config_show_analytics_desc'] = 'Show selection statistics to teachers';

// AJAX response strings
$string['priority_saved'] = 'Your priority has been saved successfully!';
$string['priority_updated'] = 'Your priority has been updated!';
$string['error_saving'] = 'Error saving your priority. Please try again.';
$string['error_permission'] = 'You do not have permission to set priority.';
$string['error_invalid_step'] = 'Invalid learning step selected.';
$string['error_no_change_allowed'] = 'You are not allowed to change your priority selection.';

// Report strings
$string['report_title'] = 'Priority Selection Report';
$string['report_no_data'] = 'No priority selections yet.';
$string['report_step_column'] = 'Learning Step';
$string['report_count_column'] = 'Number of Students';
$string['report_percentage_column'] = 'Percentage';
$string['total_students'] = 'Total students with selections';
$string['recent_changes'] = 'Recent Priority Changes';
$string['no_changes'] = 'No priority changes yet.';
$string['student'] = 'Student';
$string['old_priority'] = 'Old Priority';
$string['new_priority'] = 'New Priority';
$string['when'] = 'When';

// Event strings
$string['event_priority_selected'] = 'Student priority selected';

// Global settings strings
$string['config_default_steps'] = 'Default Learning Steps';
$string['config_default_steps_desc'] = 'Default learning steps to use when block is first added (one per line)';
$string['default_steps_value'] = "Understanding Core Concepts\nPracticing Basic Skills\nProblem Solving\nCritical Thinking\nCreative Application";
