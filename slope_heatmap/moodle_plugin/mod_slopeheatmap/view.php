<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Prints a particular instance of slopeheatmap
 *
 * @package    mod_slopeheatmap
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // slopeheatmap instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('slopeheatmap', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $slopeheatmap  = $DB->get_record('slopeheatmap', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $slopeheatmap  = $DB->get_record('slopeheatmap', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $slopeheatmap->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('slopeheatmap', $slopeheatmap->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$event = \mod_slopeheatmap\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $slopeheatmap);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/slopeheatmap/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($slopeheatmap->name));
$PAGE->set_heading(format_string($course->fullname));

// Get problems for this activity
$problems = $DB->get_records('slopeheatmap_problems', array('slopeheatmap_id' => $slopeheatmap->id));

// Get user's sessions
$sessions = $DB->get_records('slopeheatmap_sessions',
    array('slopeheatmap_id' => $slopeheatmap->id, 'user_id' => $USER->id),
    'session_start DESC');

// Output starts here
echo $OUTPUT->header();

// Show activity description
echo $OUTPUT->heading($slopeheatmap->name);

if ($slopeheatmap->intro) {
    echo $OUTPUT->box(format_module_intro('slopeheatmap', $slopeheatmap, $cm->id), 'generalbox mod_introbox', 'slopeheatmapintro');
}

// Include the webapp
$webapp_url = new moodle_url('/mod/slopeheatmap/webapp/index.html', array(
    'cmid' => $cm->id,
    'userid' => $USER->id,
    'sesskey' => sesskey()
));

echo html_writer::tag('div', '', array('id' => 'slopeheatmap-container', 'class' => 'slopeheatmap-webapp'));

// Add JavaScript to load the webapp
$PAGE->requires->js_call_amd('mod_slopeheatmap/app', 'init', array(
    'cmid' => $cm->id,
    'userid' => $USER->id,
    'problems' => array_values($problems),
    'sesskey' => sesskey()
));

// Show previous sessions
if ($sessions) {
    echo $OUTPUT->heading(get_string('previoussessions', 'mod_slopeheatmap'), 3);
    echo html_writer::start_tag('table', array('class' => 'generaltable'));
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', get_string('date'));
    echo html_writer::tag('th', get_string('problem', 'mod_slopeheatmap'));
    echo html_writer::tag('th', get_string('score', 'mod_slopeheatmap'));
    echo html_writer::tag('th', get_string('duration', 'mod_slopeheatmap'));
    echo html_writer::tag('th', get_string('actions'));
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');
    echo html_writer::start_tag('tbody');

    foreach ($sessions as $session) {
        echo html_writer::start_tag('tr');
        echo html_writer::tag('td', userdate($session->session_start));
        echo html_writer::tag('td', $session->problem_id);
        echo html_writer::tag('td', $session->score ? round($session->score, 2) . '%' : '-');
        $duration = $session->session_end ? ($session->session_end - $session->session_start) : 0;
        echo html_writer::tag('td', format_time($duration));
        $view_url = new moodle_url('/mod/slopeheatmap/view_session.php', array('id' => $session->id));
        echo html_writer::tag('td', html_writer::link($view_url, get_string('viewheatmap', 'mod_slopeheatmap')));
        echo html_writer::end_tag('tr');
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
}

// Finish the page
echo $OUTPUT->footer();
