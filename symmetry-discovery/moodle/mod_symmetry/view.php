<?php
/**
 * Main view for Symmetry Discovery activity
 *
 * @package    mod_symmetry
 * @copyright  2025 Symmetry Discovery
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = optional_param('id', 0, PARAM_INT);        // Course Module ID
$s  = optional_param('s', 0, PARAM_INT);         // Symmetry instance ID

if ($id) {
    $cm = get_coursemodule_from_id('symmetry', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $symmetry = $DB->get_record('symmetry', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    $symmetry = $DB->get_record('symmetry', array('id' => $s), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $symmetry->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('symmetry', $symmetry->id, $course->id, false, MUST_EXIST);
}

require_course_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/symmetry:view', $context);

// Trigger module viewed event
$event = \mod_symmetry\event\course_module_viewed::create(array(
    'objectid' => $symmetry->id,
    'context' => $context,
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('symmetry', $symmetry);
$event->trigger();

// Setup page
$PAGE->set_url('/mod/symmetry/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($symmetry->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get user session for app
$sessionid = sesskey();
$userid = $USER->id;

// Build app URL with parameters
$appurl = new moodle_url('/mod/symmetry/app/index.html', array(
    'userid' => $userid,
    'session' => $sessionid,
    'courseid' => $course->id,
    'activityid' => $cm->instance
));

// Output starts here
echo $OUTPUT->header();

// Activity title and description
echo $OUTPUT->heading($symmetry->name);

if ($symmetry->intro) {
    echo $OUTPUT->box(format_module_intro('symmetry', $symmetry, $cm->id), 'generalbox', 'intro');
}

// Embed the symmetry discovery app
?>

<div class="symmetry-app-container" style="width: 100%; min-height: 800px; border: none;">
    <iframe
        src="<?php echo $appurl; ?>"
        style="width: 100%; height: 800px; border: none;"
        allowfullscreen
        title="Symmetry Discovery App">
    </iframe>
</div>

<div class="symmetry-info" style="margin-top: 20px;">
    <h3><?php echo get_string('instructions', 'mod_symmetry'); ?></h3>
    <p><?php echo get_string('instructions_text', 'mod_symmetry'); ?></p>
</div>

<?php

// Finish the page
echo $OUTPUT->footer();
