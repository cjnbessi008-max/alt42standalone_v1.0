<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Main library functions
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

use local_missedquestionfeedback\api;
use local_missedquestionfeedback\output\renderer;

/**
 * Add feedback to quiz review page
 *
 * This function is called from mod/quiz/review.php to inject misconception feedback
 * after each question that was answered incorrectly.
 *
 * @param question_attempt $qa Question attempt object
 * @param int $quizattemptid Quiz attempt ID
 * @return string HTML to inject into the review page
 */
function local_missedquestionfeedback_quiz_review_question($qa, $quizattemptid) {
    global $PAGE, $USER;

    // Only show feedback for incorrect answers
    if ($qa->get_state()->is_correct() || $qa->get_state()->is_partially_correct()) {
        return '';
    }

    // Get question and answer details
    $question = $qa->get_question();
    $questionid = $question->id;
    $questionattemptid = $qa->get_database_id();

    // Try to determine selected answer ID (for multiple choice questions)
    $selectedanswerid = null;
    $response = $qa->get_last_qt_data();

    if (isset($response['answer'])) {
        $selectedanswerid = $response['answer'];
    }

    // Get misconception feedback
    $misconception = api::get_feedback_for_attempt($questionattemptid, $questionid, $selectedanswerid);

    if (!$misconception) {
        return '';
    }

    // Log the interaction
    $interactionid = api::log_interaction($USER->id, $questionattemptid, $quizattemptid, $misconception->id);

    // Render the feedback block
    $renderer = $PAGE->get_renderer('local_missedquestionfeedback');
    $output = $renderer->render_feedback_block($misconception, $interactionid);

    // Add JavaScript for tracking resource clicks
    $PAGE->requires->js_call_amd('local_missedquestionfeedback/feedback_tracker', 'init');

    return $output;
}

/**
 * Extend navigation to add menu items
 *
 * @param global_navigation $navigation Navigation object
 */
function local_missedquestionfeedback_extend_navigation(global_navigation $navigation) {
    global $PAGE;

    // Only add for users with manage capability
    if (has_capability('local/missedquestionfeedback:manage', context_system::instance())) {
        $node = $navigation->add(
            get_string('pluginname', 'local_missedquestionfeedback'),
            null,
            navigation_node::TYPE_CUSTOM,
            null,
            'missedquestionfeedback',
            new pix_icon('i/settings', '')
        );

        $node->add(
            get_string('manageconcepts', 'local_missedquestionfeedback'),
            new moodle_url('/local/missedquestionfeedback/admin/concepts.php'),
            navigation_node::TYPE_CUSTOM
        );

        $node->add(
            get_string('managemisconceptions', 'local_missedquestionfeedback'),
            new moodle_url('/local/missedquestionfeedback/admin/misconceptions.php'),
            navigation_node::TYPE_CUSTOM
        );

        $node->add(
            get_string('mapquestions', 'local_missedquestionfeedback'),
            new moodle_url('/local/missedquestionfeedback/admin/mappings.php'),
            navigation_node::TYPE_CUSTOM
        );
    }

    // Add analytics for teachers
    if (has_capability('local/missedquestionfeedback:viewreports', $PAGE->context)) {
        if ($PAGE->course && $PAGE->course->id > 1) {
            $node = $navigation->add(
                get_string('analytics', 'local_missedquestionfeedback'),
                new moodle_url('/local/missedquestionfeedback/analytics.php', ['courseid' => $PAGE->course->id]),
                navigation_node::TYPE_CUSTOM,
                null,
                'missedquestionfeedbackanalytics'
            );
        }
    }
}

/**
 * Serve plugin files
 *
 * @param stdClass $course Course object
 * @param stdClass $cm Course module object
 * @param context $context Context
 * @param string $filearea File area
 * @param array $args Arguments
 * @param bool $forcedownload Force download
 * @param array $options Options
 * @return bool False if file not found
 */
function local_missedquestionfeedback_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = array()) {
    // No file serving for now
    return false;
}
