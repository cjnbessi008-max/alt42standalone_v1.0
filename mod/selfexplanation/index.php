<?php
/**
 * List of all selfexplanation activities in a course
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = required_param('id', PARAM_INT); // Course ID

$course = $DB->get_record('course', array('id' => $id), '*', MUST_EXIST);

require_course_login($course);

$PAGE->set_url('/mod/selfexplanation/index.php', array('id' => $id));
$PAGE->set_title(format_string($course->fullname));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context(context_course::instance($course->id));

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('modulenameplural', 'selfexplanation'));

// Get all selfexplanation activities in this course
$modinfo = get_fast_modinfo($course);
$selfexplanations = array();

foreach ($modinfo->get_instances_of('selfexplanation') as $cm) {
    if (!$cm->uservisible) {
        continue;
    }
    $selfexplanations[] = $cm;
}

if (empty($selfexplanations)) {
    notice(get_string('thereareno', 'moodle', get_string('modulenameplural', 'selfexplanation')),
        new moodle_url('/course/view.php', array('id' => $course->id)));
}

$table = new html_table();
$table->head = array(
    get_string('selfexplanationname', 'selfexplanation'),
    get_string('status', 'selfexplanation')
);
$table->attributes['class'] = 'generaltable';

foreach ($selfexplanations as $cm) {
    $selfexplanation = $DB->get_record('selfexplanation', array('id' => $cm->instance));

    // Get user's response status
    $response = selfexplanation_get_user_response($selfexplanation->id, $USER->id);
    $status = $response ? get_string($response->status, 'selfexplanation') : get_string('noresponseyet', 'selfexplanation');

    $table->data[] = array(
        html_writer::link(
            new moodle_url('/mod/selfexplanation/view.php', array('id' => $cm->id)),
            format_string($cm->name)
        ),
        $status
    );
}

echo html_writer::table($table);
echo $OUTPUT->footer();
