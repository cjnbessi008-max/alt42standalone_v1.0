<?php
/**
 * Instant Speed Ball - Moodle Activity Module
 * View page
 *
 * @package    mod_instantspeedball
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once('lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course Module ID
$i = optional_param('i', 0, PARAM_INT);   // Instance ID
$problem = optional_param('problem', 1, PARAM_INT); // Problem ID

if ($id) {
    $cm = get_coursemodule_from_id('instantspeedball', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $instantspeedball = $DB->get_record('instantspeedball', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($i) {
    $instantspeedball = $DB->get_record('instantspeedball', array('id' => $i), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $instantspeedball->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('instantspeedball', $instantspeedball->id, $course->id, false, MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger module viewed event
$event = \mod_instantspeedball\event\course_module_viewed::create(array(
    'objectid' => $instantspeedball->id,
    'context' => $context,
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('instantspeedball', $instantspeedball);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/instantspeedball/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($instantspeedball->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output starts here
echo $OUTPUT->header();

echo $OUTPUT->heading($instantspeedball->name);

// Display intro
if ($instantspeedball->intro) {
    echo $OUTPUT->box(format_module_intro('instantspeedball', $instantspeedball, $cm->id), 'generalbox', 'intro');
}

// Get webapp URL (adjust path as needed)
$webappurl = new moodle_url('/mod/instantspeedball/webapp/index.html', array('problem' => $problem));

// Embed the webapp in an iframe
echo html_writer::tag('iframe', '', array(
    'src' => $webappurl,
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0',
    'style' => 'border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
));

// Problem selector (optional)
echo html_writer::start_tag('div', array('class' => 'problem-selector', 'style' => 'margin-top: 20px;'));
echo html_writer::tag('h3', get_string('selectproblem', 'mod_instantspeedball'));

// Get problems from database
$problems = $DB->get_records('isb_problems', null, 'difficulty_level ASC, id ASC');

if ($problems) {
    echo html_writer::start_tag('ul', array('class' => 'problem-list'));
    foreach ($problems as $p) {
        $url = new moodle_url('/mod/instantspeedball/view.php', array('id' => $cm->id, 'problem' => $p->id));
        $active = ($p->id == $problem) ? ' (현재)' : '';
        echo html_writer::tag('li',
            html_writer::link($url, $p->title . $active),
            array('class' => ($p->id == $problem) ? 'active' : '')
        );
    }
    echo html_writer::end_tag('ul');
}

echo html_writer::end_tag('div');

// Finish the page
echo $OUTPUT->footer();
