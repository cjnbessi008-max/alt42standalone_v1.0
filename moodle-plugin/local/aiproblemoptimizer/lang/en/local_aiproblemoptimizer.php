<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - English Language Strings
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'AI Problem Optimizer';
$string['aiproblemoptimizer'] = 'AI Problem Optimizer';

// Capabilities
$string['aiproblemoptimizer:viewown'] = 'View own optimization data';
$string['aiproblemoptimizer:viewall'] = 'View all students optimization data';
$string['aiproblemoptimizer:viewstatistics'] = 'View course statistics';
$string['aiproblemoptimizer:manage'] = 'Manage optimization settings';

// Dashboard
$string['dashboard'] = 'Dashboard';
$string['student_dashboard'] = 'Student Dashboard';
$string['course_statistics'] = 'Course Statistics';

// Metrics
$string['total_attempts'] = 'Total Attempts';
$string['correct_attempts'] = 'Correct Attempts';
$string['accuracy'] = 'Accuracy';
$string['avg_time'] = 'Average Time';
$string['difficulty_level'] = 'Difficulty Level';
$string['recommended_problems'] = 'Recommended Problems';
$string['consecutive_days'] = 'Consecutive Learning Days';
$string['last_activity'] = 'Last Activity';

// Recommendations
$string['recommendations'] = 'Recommendations';
$string['optimal_problems'] = 'Optimal Problems';
$string['study_tip'] = 'Study Tip';
$string['suggested_difficulty'] = 'Suggested Difficulty';

// Configuration
$string['config_base_problems'] = 'Base Problems';
$string['config_base_problems_desc'] = 'Default number of problems to assign';
$string['config_min_problems'] = 'Minimum Problems';
$string['config_min_problems_desc'] = 'Minimum problem count limit';
$string['config_max_problems'] = 'Maximum Problems';
$string['config_max_problems_desc'] = 'Maximum problem count limit';

$string['config_difficulty_up'] = 'Difficulty Up Threshold';
$string['config_difficulty_up_desc'] = 'Increase difficulty when accuracy reaches this value';
$string['config_difficulty_down'] = 'Difficulty Down Threshold';
$string['config_difficulty_down_desc'] = 'Decrease difficulty when accuracy falls below this value';

$string['config_fast_time'] = 'Fast Time Threshold (seconds)';
$string['config_fast_time_desc'] = 'Problems solved faster than this are considered fast';
$string['config_slow_time'] = 'Slow Time Threshold (seconds)';
$string['config_slow_time_desc'] = 'Problems solved slower than this are considered slow';

$string['config_high_consistency'] = 'High Consistency Threshold (days)';
$string['config_high_consistency_desc'] = 'Consecutive learning days above this value indicate high consistency';

$string['config_enabled'] = 'Plugin Enabled';
$string['config_enabled_desc'] = 'Enable AI problem optimization for this course';
$string['config_auto_difficulty'] = 'Auto Difficulty Adjustment';
$string['config_auto_difficulty_desc'] = 'Automatically adjust difficulty based on student performance';

// Performance
$string['performance_title'] = 'Performance Analysis';
$string['recent_performance'] = 'Recent Performance';
$string['difficulty_progress'] = 'Difficulty Progress';
$string['level'] = 'Level';
$string['mastery'] = 'Mastery';

// Messages
$string['no_data'] = 'No data available yet.';
$string['calculation_successful'] = 'Optimal problems calculated successfully.';
$string['difficulty_adjusted'] = 'Difficulty level has been adjusted.';
$string['settings_saved'] = 'Settings have been saved.';

// Study tips
$string['tip_excellent'] = 'Excellent! Try more challenging problems.';
$string['tip_perfect'] = 'Perfect! Maintain this level.';
$string['tip_good'] = 'Good job. Keep practicing consistently.';
$string['tip_focus'] = 'Focus more on each problem. Take your time.';
$string['tip_basics'] = 'Let\'s review the basics step by step.';
$string['tip_start'] = 'Start your learning journey!';

// Errors
$string['error_permission'] = 'Permission denied.';
$string['error_not_enrolled'] = 'Not enrolled in this course.';
$string['error_invalid_data'] = 'Invalid data.';
$string['error_database'] = 'Database error occurred.';

// Time units
$string['seconds'] = 'seconds';
$string['minutes'] = 'minutes';
$string['hours'] = 'hours';
$string['days'] = 'days';
