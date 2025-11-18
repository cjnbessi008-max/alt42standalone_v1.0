<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

namespace local_dmnrest;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/dmnrest/lib.php');

/**
 * Event observer for quiz events
 */
class observer {

    /**
     * Handle quiz attempt started event
     * @param \mod_quiz\event\attempt_started $event
     */
    public static function quiz_attempt_started(\mod_quiz\event\attempt_started $event) {
        if (!local_dmnrest_is_enabled()) {
            return;
        }

        // Store session start time
        $_SESSION['dmn_session_start'] = time();
        $_SESSION['dmn_problems_attempted'] = 0;
        $_SESSION['dmn_problems_correct'] = 0;
        $_SESSION['dmn_last_rest_time'] = time();
    }

    /**
     * Handle question viewed event - trigger BEFORE problem
     * @param \mod_quiz\event\question_viewed $event
     */
    public static function question_viewed(\mod_quiz\event\question_viewed $event) {
        global $USER, $DB, $PAGE;

        if (!local_dmnrest_is_enabled()) {
            return;
        }

        $config = local_dmnrest_get_config();

        // Check if we should suggest a rest routine
        if (!self::should_suggest_rest('before', $config)) {
            return;
        }

        // Get question details
        $question = $DB->get_record('question', ['id' => $event->objectid]);
        if (!$question) {
            return;
        }

        // Calculate complexity
        $complexity = local_dmnrest_calculate_complexity($question);

        // Build context for API
        $context = self::build_context(
            $USER->id,
            $event->contextinstanceid,
            $event->objectid,
            $complexity,
            'before'
        );

        // Get suggestion from API
        $api = new api_client();
        $result = $api->get_suggestion($context);

        if ($result && isset($result->success) && $result->success && isset($result->routine)) {
            // Store event ID for completion tracking
            $_SESSION['dmn_current_event_id'] = $result->event_id;
            $_SESSION['dmn_routine_start_time'] = time();

            // Inject rest routine into page
            $PAGE->requires->js_call_amd('local_dmnrest/routine', 'init', [
                'routine' => $result->routine,
                'event_id' => $result->event_id,
                'allow_skip' => $config->allow_skip,
                'trigger_point' => 'before'
            ]);
        }
    }

    /**
     * Handle question answered event - trigger AFTER problem
     * @param \mod_quiz\event\question_answered $event
     */
    public static function question_answered(\mod_quiz\event\question_answered $event) {
        global $USER, $DB, $PAGE;

        if (!local_dmnrest_is_enabled()) {
            return;
        }

        // Update session stats
        if (!isset($_SESSION['dmn_problems_attempted'])) {
            $_SESSION['dmn_problems_attempted'] = 0;
        }
        $_SESSION['dmn_problems_attempted']++;

        // Check if answer was correct (simplified - may need enhancement)
        // This would need to check the actual grading

        $config = local_dmnrest_get_config();

        // Check if we should suggest a rest routine
        if (!self::should_suggest_rest('after', $config)) {
            return;
        }

        // Get question details
        $question = $DB->get_record('question', ['id' => $event->objectid]);
        if (!$question) {
            return;
        }

        // Calculate complexity
        $complexity = local_dmnrest_calculate_complexity($question);

        // Build context for API
        $context = self::build_context(
            $USER->id,
            $event->contextinstanceid,
            $event->objectid,
            $complexity,
            'after'
        );

        // Get suggestion from API
        $api = new api_client();
        $result = $api->get_suggestion($context);

        if ($result && isset($result->success) && $result->success && isset($result->routine)) {
            // Store event ID for completion tracking
            $_SESSION['dmn_current_event_id'] = $result->event_id;
            $_SESSION['dmn_routine_start_time'] = time();

            // Inject rest routine into page
            $PAGE->requires->js_call_amd('local_dmnrest/routine', 'init', [
                'routine' => $result->routine,
                'event_id' => $result->event_id,
                'allow_skip' => $config->allow_skip,
                'trigger_point' => 'after'
            ]);

            // Update last rest time
            $_SESSION['dmn_last_rest_time'] = time();
        }
    }

    /**
     * Determine if we should suggest a rest routine
     * @param string $trigger_point 'before' or 'after'
     * @param object $config Plugin configuration
     * @return bool
     */
    private static function should_suggest_rest($trigger_point, $config) {
        $strategy = $config->trigger_strategy;

        // Check minimum interval
        $min_interval = intval($config->min_rest_interval) * 60; // Convert to seconds
        $time_since_last_rest = isset($_SESSION['dmn_last_rest_time'])
            ? time() - $_SESSION['dmn_last_rest_time']
            : PHP_INT_MAX;

        if ($time_since_last_rest < $min_interval) {
            return false;
        }

        switch ($strategy) {
            case 'every_problem':
                return true;

            case 'complex_only':
                // This will be checked later based on actual complexity
                return true;

            case 'every_n_problems':
                $problems_per_interval = intval(get_config('local_dmnrest', 'problems_per_interval'));
                $problems_attempted = isset($_SESSION['dmn_problems_attempted'])
                    ? $_SESSION['dmn_problems_attempted']
                    : 0;
                return ($problems_attempted % $problems_per_interval) === 0;

            case 'fatigue_based':
                // Let the API decide based on fatigue score
                return true;

            default:
                return false;
        }
    }

    /**
     * Build context array for API request
     * @param int $user_id User ID
     * @param int $module_id Course module ID
     * @param int $question_id Question ID
     * @param int $complexity Question complexity
     * @param string $trigger_point 'before' or 'after'
     * @return array
     */
    private static function build_context($user_id, $module_id, $question_id, $complexity, $trigger_point) {
        $session_start = isset($_SESSION['dmn_session_start']) ? $_SESSION['dmn_session_start'] : time();
        $active_time_minutes = (time() - $session_start) / 60;

        $last_rest_time = isset($_SESSION['dmn_last_rest_time']) ? $_SESSION['dmn_last_rest_time'] : $session_start;
        $time_since_last_rest = (time() - $last_rest_time) / 60;

        $problems_attempted = isset($_SESSION['dmn_problems_attempted']) ? $_SESSION['dmn_problems_attempted'] : 0;
        $problems_correct = isset($_SESSION['dmn_problems_correct']) ? $_SESSION['dmn_problems_correct'] : 0;

        return [
            'student_id' => strval($user_id),
            'module_id' => 'moodle-cm-' . $module_id,
            'problem_id' => 'moodle-q-' . $question_id,
            'problem_complexity' => $complexity,
            'trigger_point' => $trigger_point,
            'session_context' => [
                'problems_attempted' => $problems_attempted,
                'problems_correct' => $problems_correct,
                'active_time_minutes' => round($active_time_minutes, 2),
                'time_since_last_rest' => round($time_since_last_rest, 2),
            ]
        ];
    }
}
