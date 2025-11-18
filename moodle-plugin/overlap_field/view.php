<?php
/**
 * Prints a particular instance of overlap_field
 *
 * @package    mod_overlap_field
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID

if ($id) {
    $cm             = get_coursemodule_from_id('overlap_field', $id, 0, false, MUST_EXIST);
    $course         = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $overlap_field  = $DB->get_record('overlap_field', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    error('You must specify a course_module ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger course_module_viewed event
$event = \mod_overlap_field\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $overlap_field);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/overlap_field/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($overlap_field->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get problem data
$problem_data = overlap_field_get_problem_data($overlap_field->id);

// Output starts here
echo $OUTPUT->header();

// Conditions to show the intro can change to look for own settings or whatever
if ($overlap_field->intro) {
    echo $OUTPUT->box(format_module_intro('overlap_field', $overlap_field, $cm->id), 'generalbox mod_introbox', 'overlap_fieldintro');
}

// Display instructions
echo html_writer::tag('p', get_string('view_instructions', 'overlap_field'));

// Embed the webapp
$webapp_url = new moodle_url('/mod/overlap_field/webapp/index.html');
$webapp_data = json_encode($problem_data);

echo html_writer::start_div('overlap-field-container');
echo html_writer::tag('h3', get_string('smartphone_view', 'overlap_field'));

// Embedded iframe for the webapp
echo html_writer::start_div('webapp-frame');
echo html_writer::tag('iframe', '', array(
    'id' => 'overlap-field-webapp',
    'src' => $webapp_url->out(false),
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0',
    'style' => 'border: none; display: block;'
));
echo html_writer::end_div();

echo html_writer::end_div();

// Pass data to webapp via JavaScript
echo html_writer::start_tag('script');
echo "
    window.addEventListener('load', function() {
        var iframe = document.getElementById('overlap-field-webapp');
        iframe.addEventListener('load', function() {
            iframe.contentWindow.postMessage({
                type: 'PROBLEM_DATA',
                data: {$webapp_data}
            }, '*');
        });
    });
";
echo html_writer::end_tag('script');

// Add CSS for responsive layout
echo html_writer::start_tag('style');
echo "
    .overlap-field-container {
        max-width: 1200px;
        margin: 20px auto;
        padding: 20px;
    }
    .webapp-frame {
        position: relative;
        background: #f5f5f5;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
";
echo html_writer::end_tag('style');

// Finish the page
echo $OUTPUT->footer();
