<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Inject engagement tracker into all course pages
 */
function local_engagementalert_before_footer() {
    global $PAGE, $COURSE, $USER;

    // Only inject on course pages for logged-in users
    if (!isloggedin() || isguestuser()) {
        return;
    }

    // Check if we're in a course context
    if ($PAGE->context->contextlevel != CONTEXT_COURSE && $PAGE->context->contextlevel != CONTEXT_MODULE) {
        return;
    }

    // Check if user has capability
    if (!has_capability('local/engagementalert:view', $PAGE->context)) {
        return;
    }

    // Get course ID
    $courseid = $COURSE->id;
    if ($courseid <= 1) { // Skip site course
        return;
    }

    // Get course module ID if available
    $cmid = 0;
    if ($PAGE->cm) {
        $cmid = $PAGE->cm->id;
    }

    // Get configuration
    $config = [
        'courseId' => $courseid,
        'cmId' => $cmid,
        'userId' => $USER->id,
        'inactiveThreshold' => (int)get_config('local_engagementalert', 'inactive_threshold') ?: 120,
        'unfocusThreshold' => (int)get_config('local_engagementalert', 'unfocus_threshold') ?: 60,
        'trackingInterval' => (int)get_config('local_engagementalert', 'tracking_interval') ?: 30,
        'alertCooldown' => (int)get_config('local_engagementalert', 'alert_cooldown') ?: 300,
        'enableStudentAlerts' => (bool)get_config('local_engagementalert', 'enable_student_alerts'),
        'alertTitle' => get_string('alert_student_title', 'local_engagementalert'),
        'alertMessage' => get_string('alert_student_message', 'local_engagementalert'),
    ];

    // Initialize JavaScript tracker
    $PAGE->requires->js_call_amd('local_engagementalert/tracker', 'init', [$config]);
}

/**
 * Add CSS for engagement alerts
 */
function local_engagementalert_before_standard_html_head() {
    global $PAGE;

    $css = '
    <style>
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .engagement-alert {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
    </style>
    ';

    return $css;
}

/**
 * Serve files from plugin
 *
 * @param stdClass $course Course object
 * @param stdClass $cm Course module object
 * @param context $context Context
 * @param string $filearea File area
 * @param array $args Additional arguments
 * @param bool $forcedownload Whether to force download
 * @param array $options Additional options
 * @return bool False if file not found
 */
function local_engagementalert_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    // No files served by this plugin currently
    return false;
}
