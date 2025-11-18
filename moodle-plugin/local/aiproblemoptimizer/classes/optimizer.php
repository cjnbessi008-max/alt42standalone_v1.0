<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * AI Problem Optimizer - Core Optimization Algorithm
 *
 * @package    local_aiproblemoptimizer
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_aiproblemoptimizer;

defined('MOODLE_INTERNAL') || die();

/**
 * Optimizer class - 학생별 최적 문제 수량 계산
 */
class optimizer {

    /**
     * Calculate optimal number of problems for a student
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Optimization result with recommended problems and factors
     */
    public static function calculate_optimal_problems($userid, $courseid) {
        global $DB;

        // Get student metrics
        $metrics = $DB->get_record('ai_student_metrics', [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$metrics) {
            // Initialize metrics if not exists
            $metrics = self::initialize_student_metrics($userid, $courseid);
        }

        // Get course configuration
        $config = $DB->get_record('ai_problem_config', ['courseid' => $courseid]);
        if (!$config) {
            $config = self::get_default_config($courseid);
        }

        // Extract values
        $accuracy = (float) $metrics->accuracy;
        $avg_time = (int) $metrics->avg_time_per_problem;
        $consistency_days = (int) $metrics->consecutive_learning_days;
        $difficulty_level = (int) $metrics->current_difficulty_level;

        // Calculate factors
        $accuracy_factor = self::calculate_accuracy_factor($accuracy, $config);
        $speed_factor = self::calculate_speed_factor($avg_time, $config);
        $consistency_factor = self::calculate_consistency_factor($consistency_days, $config);

        // Base calculation
        $base_problems = (int) $config->base_problems;
        $recommended = round($base_problems * $accuracy_factor * $speed_factor * $consistency_factor);

        // Apply constraints
        $recommended = max((int) $config->min_problems, min($recommended, (int) $config->max_problems));

        // Update metrics
        $metrics->recommended_problems = $recommended;
        $metrics->last_calculated = time();
        $metrics->timemodified = time();
        $DB->update_record('ai_student_metrics', $metrics);

        // Log calculation
        self::log_optimization($userid, $courseid, [
            'accuracy' => $accuracy,
            'avg_time' => $avg_time,
            'consistency_days' => $consistency_days,
            'difficulty_level' => $difficulty_level,
            'accuracy_factor' => $accuracy_factor,
            'speed_factor' => $speed_factor,
            'consistency_factor' => $consistency_factor,
            'recommended_problems' => $recommended
        ]);

        return [
            'success' => true,
            'userid' => $userid,
            'courseid' => $courseid,
            'recommended_problems' => $recommended,
            'factors' => [
                'accuracy' => $accuracy,
                'accuracy_factor' => $accuracy_factor,
                'speed_factor' => $speed_factor,
                'consistency_factor' => $consistency_factor
            ],
            'metrics' => [
                'accuracy' => $accuracy,
                'avg_time' => $avg_time,
                'consistency_days' => $consistency_days,
                'difficulty_level' => $difficulty_level
            ],
            'last_calculated' => $metrics->last_calculated
        ];
    }

    /**
     * Calculate accuracy factor based on student's accuracy
     *
     * @param float $accuracy Student's accuracy (0.0 - 1.0)
     * @param object $config Course configuration
     * @return float Accuracy factor
     */
    private static function calculate_accuracy_factor($accuracy, $config) {
        if ($accuracy >= 0.9000) {
            // High accuracy - give more problems to maintain engagement
            return 1.3;
        } else if ($accuracy >= 0.7000) {
            // Good accuracy - normal load
            return 1.0;
        } else {
            // Low accuracy - reduce problems for focused learning
            return 0.7;
        }
    }

    /**
     * Calculate speed factor based on average solving time
     *
     * @param int $avg_time Average time per problem in seconds
     * @param object $config Course configuration
     * @return float Speed factor
     */
    private static function calculate_speed_factor($avg_time, $config) {
        $fast_threshold = (int) $config->fast_time_threshold;
        $slow_threshold = (int) $config->slow_time_threshold;

        if ($avg_time < $fast_threshold) {
            // Fast solver - can handle more problems
            return 1.2;
        } else if ($avg_time < $slow_threshold) {
            // Normal speed - standard load
            return 1.0;
        } else {
            // Slow solver - reduce problems to avoid fatigue
            return 0.8;
        }
    }

    /**
     * Calculate consistency factor based on learning streak
     *
     * @param int $consistency_days Consecutive learning days
     * @param object $config Course configuration
     * @return float Consistency factor
     */
    private static function calculate_consistency_factor($consistency_days, $config) {
        $high_consistency = (int) $config->high_consistency_days;

        if ($consistency_days >= $high_consistency) {
            // High consistency - reward with slight increase
            return 1.1;
        } else {
            // Building consistency - keep standard
            return 1.0;
        }
    }

    /**
     * Check and adjust difficulty level based on performance
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Difficulty adjustment result
     */
    public static function adjust_difficulty_level($userid, $courseid) {
        global $DB;

        $metrics = $DB->get_record('ai_student_metrics', [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$metrics) {
            return ['adjusted' => false, 'reason' => 'No metrics found'];
        }

        $config = $DB->get_record('ai_problem_config', ['courseid' => $courseid]);
        if (!$config || !$config->auto_adjust_difficulty) {
            return ['adjusted' => false, 'reason' => 'Auto-adjustment disabled'];
        }

        // Get recent performance (last 10 problems)
        $recent_problems = $DB->get_records_sql(
            "SELECT is_correct
             FROM {ai_problem_history}
             WHERE userid = ? AND courseid = ?
             ORDER BY timecreated DESC
             LIMIT 10",
            [$userid, $courseid]
        );

        if (count($recent_problems) < 10) {
            return ['adjusted' => false, 'reason' => 'Insufficient data'];
        }

        // Calculate recent accuracy
        $correct_count = 0;
        foreach ($recent_problems as $problem) {
            if ($problem->is_correct) {
                $correct_count++;
            }
        }
        $recent_accuracy = $correct_count / 10;

        $old_level = $metrics->current_difficulty_level;
        $new_level = $old_level;
        $reason = '';

        // Check for difficulty increase
        if ($recent_accuracy >= $config->difficulty_up_threshold && $old_level < 5) {
            $new_level = $old_level + 1;
            $reason = 'High accuracy - increased difficulty';
        }
        // Check for difficulty decrease
        else if ($recent_accuracy < $config->difficulty_down_threshold && $old_level > 1) {
            $new_level = $old_level - 1;
            $reason = 'Low accuracy - decreased difficulty';
        }

        if ($new_level != $old_level) {
            $metrics->current_difficulty_level = $new_level;
            $metrics->timemodified = time();
            $DB->update_record('ai_student_metrics', $metrics);

            return [
                'adjusted' => true,
                'old_level' => $old_level,
                'new_level' => $new_level,
                'recent_accuracy' => $recent_accuracy,
                'reason' => $reason
            ];
        }

        return [
            'adjusted' => false,
            'current_level' => $old_level,
            'recent_accuracy' => $recent_accuracy,
            'reason' => 'Performance within optimal range'
        ];
    }

    /**
     * Initialize student metrics record
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return object Initialized metrics object
     */
    private static function initialize_student_metrics($userid, $courseid) {
        global $DB;

        $metrics = new \stdClass();
        $metrics->userid = $userid;
        $metrics->courseid = $courseid;
        $metrics->total_attempts = 0;
        $metrics->correct_attempts = 0;
        $metrics->accuracy = 0.0000;
        $metrics->avg_time_per_problem = 0;
        $metrics->total_time_spent = 0;
        $metrics->consecutive_learning_days = 0;
        $metrics->last_activity_date = time();
        $metrics->current_difficulty_level = 1;
        $metrics->difficulty_adaptation_score = 0.5000;
        $metrics->recommended_problems = 10;
        $metrics->last_calculated = time();
        $metrics->timecreated = time();
        $metrics->timemodified = time();

        $metrics->id = $DB->insert_record('ai_student_metrics', $metrics);

        return $metrics;
    }

    /**
     * Get default configuration
     *
     * @param int $courseid Course ID
     * @return object Default configuration
     */
    private static function get_default_config($courseid) {
        global $DB;

        $config = new \stdClass();
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

        $config->id = $DB->insert_record('ai_problem_config', $config);

        return $config;
    }

    /**
     * Log optimization calculation
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $data Calculation data
     * @return int Log ID
     */
    private static function log_optimization($userid, $courseid, $data) {
        global $DB;

        $log = new \stdClass();
        $log->userid = $userid;
        $log->courseid = $courseid;
        $log->accuracy = $data['accuracy'];
        $log->avg_time = $data['avg_time'];
        $log->consistency_days = $data['consistency_days'];
        $log->difficulty_level = $data['difficulty_level'];
        $log->accuracy_factor = $data['accuracy_factor'];
        $log->speed_factor = $data['speed_factor'];
        $log->consistency_factor = $data['consistency_factor'];
        $log->recommended_problems = $data['recommended_problems'];
        $log->calculation_version = '1.0';
        $log->timecreated = time();

        return $DB->insert_record('ai_optimization_log', $log);
    }

    /**
     * Get student recommendations with study tips
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return array Recommendations
     */
    public static function get_recommendations($userid, $courseid) {
        global $DB;

        $metrics = $DB->get_record('ai_student_metrics', [
            'userid' => $userid,
            'courseid' => $courseid
        ]);

        if (!$metrics) {
            return [
                'recommended_problems' => 10,
                'difficulty_level' => 1,
                'study_tip' => '학습을 시작해보세요!'
            ];
        }

        $accuracy = (float) $metrics->accuracy;
        $difficulty = (int) $metrics->current_difficulty_level;
        $recommended = (int) $metrics->recommended_problems;

        // Generate study tips
        $study_tip = self::generate_study_tip($accuracy, $difficulty, $metrics->consecutive_learning_days);

        return [
            'recommended_problems' => $recommended,
            'difficulty_level' => $difficulty,
            'accuracy' => $accuracy,
            'study_tip' => $study_tip
        ];
    }

    /**
     * Generate personalized study tip
     *
     * @param float $accuracy Student accuracy
     * @param int $difficulty Current difficulty level
     * @param int $consistency_days Consecutive learning days
     * @return string Study tip in Korean
     */
    private static function generate_study_tip($accuracy, $difficulty, $consistency_days) {
        if ($accuracy >= 0.9 && $difficulty < 5) {
            return '훌륭합니다! 더 어려운 문제에 도전해보세요.';
        } else if ($accuracy >= 0.9) {
            return '완벽합니다! 이 수준을 유지하세요.';
        } else if ($accuracy >= 0.7) {
            return '잘 하고 있습니다. 꾸준히 연습하세요.';
        } else if ($accuracy >= 0.5) {
            return '조금 더 집중해서 풀어보세요. 천천히 해도 괜찮습니다.';
        } else {
            return '기초부터 차근차근 다시 연습해봅시다.';
        }
    }
}
