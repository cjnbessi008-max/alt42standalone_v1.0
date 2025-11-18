<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - Core Library Functions
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Hook into quiz attempt submission
 *
 * @param object $attempt Quiz attempt object
 */
function local_aiproblemoptimizer_quiz_attempt_submitted($attempt) {
    global $DB;

    // Get quiz and course info
    $quiz = $DB->get_record('quiz', ['id' => $attempt->quiz]);
    if (!$quiz) {
        return;
    }

    // Get attempt details
    $userid = $attempt->userid;
    $courseid = $quiz->course;

    // Get questions and answers
    $quba = question_engine::load_questions_usage_by_activity($attempt->uniqueid);
    $slots = $quba->get_slots();

    foreach ($slots as $slot) {
        $qa = $quba->get_question_attempt($slot);
        $question = $qa->get_question();

        // Determine if answer was correct
        $fraction = $qa->get_fraction();
        $is_correct = ($fraction >= 1.0) ? 1 : 0;

        // Get time spent (if available)
        $time_spent = 0;
        // Note: Moodle doesn't track per-question time by default
        // This would need additional tracking implementation

        // Estimate problem difficulty (basic heuristic)
        $difficulty_level = 1;
        if (isset($question->defaultmark)) {
            $difficulty_level = min(5, max(1, ceil($question->defaultmark)));
        }

        // Get problem type from question tags or category
        $problem_type = 'general';
        if (isset($question->category)) {
            $category = $DB->get_record('question_categories', ['id' => $question->category]);
            if ($category) {
                $problem_type = $category->name;
            }
        }

        // Record the attempt
        $attempt_data = [
            'userid' => $userid,
            'courseid' => $courseid,
            'quizid' => $quiz->id,
            'questionid' => $question->id,
            'problem_type' => $problem_type,
            'difficulty_level' => $difficulty_level,
            'is_correct' => $is_correct,
            'time_spent' => $time_spent > 0 ? $time_spent : 60, // Default 60 seconds if unknown
            'student_answer' => $qa->get_response_summary(),
            'correct_answer' => $qa->get_right_answer_summary()
        ];

        \local_aiproblemoptimizer\metrics_tracker::record_attempt($attempt_data);
    }
}

/**
 * Get optimal number of problems for a student in a course
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return int Recommended number of problems
 */
function local_aiproblemoptimizer_get_optimal_problems($userid, $courseid) {
    $result = \local_aiproblemoptimizer\optimizer::calculate_optimal_problems($userid, $courseid);
    return isset($result['recommended_problems']) ? $result['recommended_problems'] : 10;
}

/**
 * Get student's current difficulty level
 *
 * @param int $userid User ID
 * @param int $courseid Course ID
 * @return int Current difficulty level (1-5)
 */
function local_aiproblemoptimizer_get_difficulty_level($userid, $courseid) {
    global $DB;

    $metrics = $DB->get_record('ai_student_metrics', [
        'userid' => $userid,
        'courseid' => $courseid
    ]);

    return $metrics ? $metrics->current_difficulty_level : 1;
}

/**
 * Check if plugin is enabled for a course
 *
 * @param int $courseid Course ID
 * @return bool True if enabled
 */
function local_aiproblemoptimizer_is_enabled($courseid) {
    global $DB;

    $config = $DB->get_record('ai_problem_config', ['courseid' => $courseid]);
    return $config ? (bool) $config->is_enabled : true;
}

/**
 * Initialize plugin for a course
 *
 * @param int $courseid Course ID
 * @return bool Success
 */
function local_aiproblemoptimizer_initialize_course($courseid) {
    global $DB;

    // Check if already initialized
    $existing = $DB->get_record('ai_problem_config', ['courseid' => $courseid]);
    if ($existing) {
        return true;
    }

    // Create default configuration
    $config = new stdClass();
    $config->courseid = $courseid;
    $config->base_problems = 10;
    $config->min_problems = 5;
    $config->max_problems = 30;
    $config->difficulty_up_threshold = 0.9000;
    $config->difficulty_down_threshold = 0.6000;
    $config->optimal_accuracy_min = 0.7000;
    $config->optimal_accuracy_max = 0.8500;
    $config->fast_time_threshold = 30;
    $config->slow_time_threshold = 60;
    $config->high_consistency_days = 5;
    $config->accuracy_weight = 0.40;
    $config->speed_weight = 0.30;
    $config->consistency_weight = 0.30;
    $config->is_enabled = 1;
    $config->auto_adjust_difficulty = 1;
    $config->timecreated = time();
    $config->timemodified = time();

    return (bool) $DB->insert_record('ai_problem_config', $config);
}
