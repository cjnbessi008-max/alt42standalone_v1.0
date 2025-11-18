<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

/**
 * DMN Rest Routine library functions
 */

/**
 * Get plugin configuration
 * @return object Configuration settings
 */
function local_dmnrest_get_config() {
    return (object)[
        'enabled' => get_config('local_dmnrest', 'enabled'),
        'api_endpoint' => get_config('local_dmnrest', 'api_endpoint'),
        'api_key' => get_config('local_dmnrest', 'api_key'),
        'trigger_strategy' => get_config('local_dmnrest', 'trigger_strategy'),
        'allow_skip' => get_config('local_dmnrest', 'allow_skip'),
        'min_rest_interval' => get_config('local_dmnrest', 'min_rest_interval'),
        'complexity_threshold' => get_config('local_dmnrest', 'complexity_threshold'),
    ];
}

/**
 * Check if DMN rest routines are enabled
 * @return bool
 */
function local_dmnrest_is_enabled() {
    return (bool)get_config('local_dmnrest', 'enabled');
}

/**
 * Inject DMN rest routine display into page
 * @param object $routine The routine data from API
 * @return string HTML for routine display
 */
function local_dmnrest_render_routine($routine) {
    global $OUTPUT;

    $context = [
        'routine' => $routine,
        'allow_skip' => get_config('local_dmnrest', 'allow_skip'),
    ];

    return $OUTPUT->render_from_template('local_dmnrest/routine_display', $context);
}

/**
 * Calculate problem complexity based on question data
 * @param object $question Question object
 * @return int Complexity level 1-5
 */
function local_dmnrest_calculate_complexity($question) {
    // Simple heuristic - can be enhanced
    $complexity = 1;

    // Check question type
    if (isset($question->qtype)) {
        switch ($question->qtype) {
            case 'multichoice':
                $complexity = 2;
                break;
            case 'calculated':
            case 'essay':
                $complexity = 3;
                break;
            case 'match':
            case 'ordering':
                $complexity = 4;
                break;
            default:
                $complexity = 2;
        }
    }

    // Adjust based on question difficulty tag if available
    if (isset($question->tags)) {
        foreach ($question->tags as $tag) {
            if (strpos($tag->rawname, 'difficulty:') === 0) {
                $difficulty = str_replace('difficulty:', '', $tag->rawname);
                if (is_numeric($difficulty)) {
                    $complexity = min(5, max(1, intval($difficulty)));
                }
            }
        }
    }

    return $complexity;
}
