<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Library functions for Anxiety Detection Plugin
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Inject anxiety tracker into all course pages
 *
 * @return string HTML/JavaScript to inject
 */
function local_anxiety_before_footer() {
    global $PAGE, $USER, $COURSE;

    // Only track on course pages
    if ($PAGE->context->contextlevel != CONTEXT_COURSE) {
        return '';
    }

    // Only track for logged-in users
    if (!isloggedin() || isguestuser()) {
        return '';
    }

    // Don't track on dashboard page itself
    if (strpos($PAGE->url->get_path(), '/local/anxiety/dashboard.php') !== false) {
        return '';
    }

    // Check if user has view capability
    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/anxiety:view', $context)) {
        return '';
    }

    // Get course module ID if available
    $cmid = $PAGE->cm ? $PAGE->cm->id : null;

    // Initialize tracker
    $PAGE->requires->js_call_amd('local_anxiety/tracker', 'init', [
        $USER->id,
        $COURSE->id,
        $cmid,
        sesskey()
    ]);

    return '';
}

/**
 * Add anxiety dashboard link to navigation
 *
 * @param navigation_node $navigation Navigation node
 */
function local_anxiety_extend_navigation_course($navigation, $course, $context) {
    // Check if user has view capability
    if (!has_capability('local/anxiety:view', $context)) {
        return;
    }

    // Add dashboard link
    $url = new moodle_url('/local/anxiety/dashboard.php', ['courseid' => $course->id]);
    $node = navigation_node::create(
        get_string('dashboard', 'local_anxiety'),
        $url,
        navigation_node::TYPE_CUSTOM,
        null,
        'anxiety_dashboard',
        new pix_icon('i/report', '')
    );

    $navigation->add_node($node);
}

/**
 * Serve plugin files
 *
 * @param stdClass $course Course object
 * @param stdClass $cm Course module object
 * @param context $context Context object
 * @param string $filearea File area
 * @param array $args Additional arguments
 * @param bool $forcedownload Force download
 * @param array $options Additional options
 * @return bool False if file not found
 */
function local_anxiety_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = array()) {
    // No files currently served
    return false;
}

/**
 * Scheduled task to cleanup old data
 *
 * @return bool Success
 */
function local_anxiety_cleanup_task() {
    require_once(__DIR__ . '/classes/collector.php');

    // Clean up data older than 90 days
    $count = \local_anxiety\collector::cleanup_old_data(90);

    mtrace('Cleaned up ' . $count . ' old anxiety metrics records');

    return true;
}
