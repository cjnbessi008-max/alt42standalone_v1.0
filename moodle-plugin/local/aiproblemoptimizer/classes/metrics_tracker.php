<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - Metrics Tracking
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_aiproblemoptimizer;

defined('MOODLE_INTERNAL') || die();

/**
 * Metrics Tracker class - 학생 성과 추적 및 기록
 */
class metrics_tracker {

    /**
     * Record a problem attempt
     *
     * @param array $attempt_data Attempt data
     * @return array Result with success status and updated metrics
     */
    public static function record_attempt($attempt_data) {
        global $DB;

        // Validate required fields
        $required = ['userid', 'courseid', 'quizid', 'problem_type', 'difficulty_level', 'is_correct', 'time_spent'];
        foreach ($required as $field) {
            if (!isset($attempt_data[$field])) {
                return ['success' => false, 'error' => "Missing required field: $field"];
            }
        }

        // Insert problem history record
        $history = new \stdClass();
        $history->userid = (int) $attempt_data['userid'];
        $history->courseid = (int) $attempt_data['courseid'];
        $history->quizid = (int) $attempt_data['quizid'];
        $history->questionid = isset($attempt_data['questionid']) ? (int) $attempt_data['questionid'] : null;
        $history->problem_type = $attempt_data['problem_type'];
        $history->difficulty_level = (int) $attempt_data['difficulty_level'];
        $history->is_correct = (int) $attempt_data['is_correct'];
        $history->time_spent = (int) $attempt_data['time_spent'];
        $history->attempt_number = isset($attempt_data['attempt_number']) ? (int) $attempt_data['attempt_number'] : 1;
        $history->student_answer = isset($attempt_data['student_answer']) ? $attempt_data['student_answer'] : null;
        $history->correct_answer = isset($attempt_data['correct_answer']) ? $attempt_data['correct_answer'] : null;
        $history->hint_used = isset($attempt_data['hint_used']) ? (int) $attempt_data['hint_used'] : 0;
        $history->quiz_session_id = isset($attempt_data['quiz_session_id']) ? $attempt_data['quiz_session_id'] : null;
        $history->timecreated = time();

        $history_id = $DB->insert_record('ai_problem_history', $history);

        // Update student metrics
        $updated_metrics = self::update_student_metrics(
            $history->userid,
            $history->courseid,
            $history->is_correct,
            $history->time_spent
        );

        // Update daily summary
        self::update_daily_summary(
            $history->userid,
            $history->courseid,
            $history->difficulty_level,
            $history->is_correct,
            $history->time_spent
        );

        // Trigger optimization calculation
        $optimization = \local_aiproblemoptimizer\optimizer::calculate_optimal_problems(
            $history->userid,
            $history->courseid
        );

        // Check if difficulty adjustment is needed
        $difficulty_check = \local_aiproblemoptimizer\optimizer::adjust_difficulty_level(
            $history->userid,
            $history->courseid
        );

        return [
            'success' => true,
            'history_id' => $history_id,
            'updated_metrics' => $updated_metrics,
            'optimization' => $optimization,
            'difficulty_adjustment' => $difficulty_check
        ];
    }

    /**
     * Update student metrics after an attempt
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $is_correct Whether answer was correct
     * @param int $time_spent Time spent in seconds
     * @return object Updated metrics
     */
    private static function update_student_metrics($userid, $courseid, $is_correct, $time_spent) {
        global $DB;

        $metrics = $DB->get_record('ai_student_metrics', [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$metrics) {
            // Initialize new metrics
            $metrics = new \stdClass();
            $metrics->userid = $userid;
            $metrics->courseid = $courseid;
            $metrics->total_attempts = 0;
            $metrics->correct_attempts = 0;
            $metrics->accuracy = 0.0000;
            $metrics->avg_time_per_problem = 0;
            $metrics->total_time_spent = 0;
            $metrics->consecutive_learning_days = 1;
            $metrics->last_activity_date = time();
            $metrics->current_difficulty_level = 1;
            $metrics->difficulty_adaptation_score = 0.5000;
            $metrics->recommended_problems = 10;
            $metrics->last_calculated = time();
            $metrics->timecreated = time();
            $metrics->timemodified = time();
        }

        // Update attempt counts
        $metrics->total_attempts += 1;
        if ($is_correct) {
            $metrics->correct_attempts += 1;
        }

        // Calculate new accuracy
        $metrics->accuracy = $metrics->total_attempts > 0 ?
            $metrics->correct_attempts / $metrics->total_attempts : 0.0000;

        // Update time metrics
        $metrics->total_time_spent += $time_spent;
        // Exponential moving average for avg_time
        if ($metrics->avg_time_per_problem == 0) {
            $metrics->avg_time_per_problem = $time_spent;
        } else {
            $metrics->avg_time_per_problem = (int) (
                ($metrics->avg_time_per_problem * 0.7) + ($time_spent * 0.3)
            );
        }

        // Update learning streak
        $last_activity = (int) $metrics->last_activity_date;
        $now = time();
        $days_since_last = floor(($now - $last_activity) / 86400);

        if ($days_since_last <= 1) {
            // Same day or next day - continue streak
            if ($days_since_last == 1) {
                $metrics->consecutive_learning_days += 1;
            }
        } else {
            // Streak broken
            $metrics->consecutive_learning_days = 1;
        }

        $metrics->last_activity_date = $now;
        $metrics->timemodified = $now;

        // Save or update
        if (isset($metrics->id)) {
            $DB->update_record('ai_student_metrics', $metrics);
        } else {
            $metrics->id = $DB->insert_record('ai_student_metrics', $metrics);
        }

        return $metrics;
    }

    /**
     * Update daily summary statistics
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $difficulty_level Problem difficulty
     * @param int $is_correct Whether correct
     * @param int $time_spent Time spent
     * @return bool Success
     */
    private static function update_daily_summary($userid, $courseid, $difficulty_level, $is_correct, $time_spent) {
        global $DB;

        // Get today's date at midnight
        $today = strtotime('today');

        $summary = $DB->get_record('ai_daily_summary', [
            'userid' => $userid,
            'courseid' => $courseid,
            'activity_date' => $today
        ]);

        if (!$summary) {
            $summary = new \stdClass();
            $summary->userid = $userid;
            $summary->courseid = $courseid;
            $summary->activity_date = $today;
            $summary->problems_attempted = 0;
            $summary->problems_correct = 0;
            $summary->total_time_spent = 0;
            $summary->avg_accuracy = 0.0000;
            // Initialize level counters
            for ($i = 1; $i <= 5; $i++) {
                $summary->{"level_{$i}_attempts"} = 0;
                $summary->{"level_{$i}_correct"} = 0;
            }
            $summary->timecreated = time();
            $summary->timemodified = time();
        }

        // Update general stats
        $summary->problems_attempted += 1;
        if ($is_correct) {
            $summary->problems_correct += 1;
        }
        $summary->total_time_spent += $time_spent;
        $summary->avg_accuracy = $summary->problems_attempted > 0 ?
            $summary->problems_correct / $summary->problems_attempted : 0.0000;

        // Update level-specific stats
        if ($difficulty_level >= 1 && $difficulty_level <= 5) {
            $attempts_field = "level_{$difficulty_level}_attempts";
            $correct_field = "level_{$difficulty_level}_correct";
            $summary->$attempts_field += 1;
            if ($is_correct) {
                $summary->$correct_field += 1;
            }
        }

        $summary->timemodified = time();

        // Save or update
        if (isset($summary->id)) {
            $DB->update_record('ai_daily_summary', $summary);
        } else {
            $summary->id = $DB->insert_record('ai_daily_summary', $summary);
        }

        return true;
    }

    /**
     * Get student dashboard data
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Dashboard data
     */
    public static function get_student_dashboard($userid, $courseid) {
        global $DB;

        $metrics = $DB->get_record('ai_student_metrics', [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$metrics) {
            return [
                'overall_stats' => [
                    'total_attempts' => 0,
                    'accuracy' => 0.0000,
                    'total_time_hours' => 0
                ],
                'recent_performance' => [],
                'difficulty_progress' => [],
                'recommendations' => [
                    'optimal_problems' => 10,
                    'suggested_difficulty' => 1,
                    'study_tips' => '학습을 시작해보세요!'
                ]
            ];
        }

        // Overall stats
        $overall_stats = [
            'total_attempts' => (int) $metrics->total_attempts,
            'correct_attempts' => (int) $metrics->correct_attempts,
            'accuracy' => (float) $metrics->accuracy,
            'total_time_hours' => round($metrics->total_time_spent / 3600, 2),
            'avg_time_per_problem' => (int) $metrics->avg_time_per_problem,
            'consecutive_learning_days' => (int) $metrics->consecutive_learning_days,
            'current_difficulty' => (int) $metrics->current_difficulty_level
        ];

        // Recent performance (last 7 days)
        $recent_performance = self::get_recent_performance($userid, $courseid, 7);

        // Difficulty progress
        $difficulty_progress = self::get_difficulty_progress($userid, $courseid);

        // Recommendations
        $recommendations = \local_aiproblemoptimizer\optimizer::get_recommendations($userid, $courseid);

        return [
            'overall_stats' => $overall_stats,
            'recent_performance' => $recent_performance,
            'difficulty_progress' => $difficulty_progress,
            'recommendations' => $recommendations
        ];
    }

    /**
     * Get recent performance data
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $days Number of days
     * @return array Performance data
     */
    private static function get_recent_performance($userid, $courseid, $days) {
        global $DB;

        $since = strtotime("-{$days} days");

        $summaries = $DB->get_records_sql(
            "SELECT *
             FROM {ai_daily_summary}
             WHERE userid = ? AND courseid = ? AND activity_date >= ?
             ORDER BY activity_date DESC",
            [$userid, $courseid, $since]
        );

        $performance = [];
        foreach ($summaries as $summary) {
            $performance[] = [
                'date' => date('Y-m-d', $summary->activity_date),
                'problems_attempted' => (int) $summary->problems_attempted,
                'problems_correct' => (int) $summary->problems_correct,
                'accuracy' => (float) $summary->avg_accuracy,
                'time_spent_minutes' => round($summary->total_time_spent / 60, 1)
            ];
        }

        return $performance;
    }

    /**
     * Get difficulty level progress and mastery
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Difficulty progress
     */
    private static function get_difficulty_progress($userid, $courseid) {
        global $DB;

        $progress = [];

        for ($level = 1; $level <= 5; $level++) {
            $stats = $DB->get_record_sql(
                "SELECT
                    COUNT(*) as attempts,
                    SUM(is_correct) as correct
                 FROM {ai_problem_history}
                 WHERE userid = ? AND courseid = ? AND difficulty_level = ?",
                [$userid, $courseid, $level]
            );

            $attempts = (int) $stats->attempts;
            $correct = (int) $stats->correct;
            $mastery = $attempts > 0 ? $correct / $attempts : 0.0;

            $progress["level_{$level}"] = [
                'attempts' => $attempts,
                'correct' => $correct,
                'mastery' => round($mastery, 4)
            ];
        }

        return $progress;
    }

    /**
     * Get course-wide statistics
     *
     * @param int $courseid Course ID
     * @return array Course statistics
     */
    public static function get_course_statistics($courseid) {
        global $DB;

        $stats = $DB->get_record_sql(
            "SELECT
                COUNT(DISTINCT userid) as total_students,
                AVG(accuracy) as avg_accuracy,
                AVG(recommended_problems) as avg_recommended_problems,
                AVG(current_difficulty_level) as avg_difficulty,
                SUM(total_attempts) as total_attempts,
                SUM(correct_attempts) as total_correct
             FROM {ai_student_metrics}
             WHERE courseid = ?",
            [$courseid]
        );

        return [
            'total_students' => (int) $stats->total_students,
            'avg_accuracy' => round((float) $stats->avg_accuracy, 4),
            'avg_recommended_problems' => round((float) $stats->avg_recommended_problems, 1),
            'avg_difficulty' => round((float) $stats->avg_difficulty, 2),
            'total_attempts' => (int) $stats->total_attempts,
            'total_correct' => (int) $stats->total_correct
        ];
    }
}
