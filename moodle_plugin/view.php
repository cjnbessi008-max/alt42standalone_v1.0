<?php
// View page for Dot Collector activity

require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course Module ID

$cm = get_coursemodule_from_id('dotcollector', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$dotcollector = $DB->get_record('dotcollector', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/dotcollector:view', $context);

// Trigger course_module_viewed event
$event = \mod_dotcollector\event\course_module_viewed::create(array(
    'objectid' => $dotcollector->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('dotcollector', $dotcollector);
$event->trigger();

// Create session for user
$sessiontoken = dotcollector_create_session($USER->id, $course->id);

// Page setup
$PAGE->set_url('/mod/dotcollector/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($dotcollector->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output
echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($dotcollector->name));

if ($dotcollector->intro) {
    echo $OUTPUT->box(format_module_intro('dotcollector', $dotcollector, $cm->id), 'generalbox', 'intro');
}

// Embed webapp iframe
?>
<div class="dotcollector-container" style="margin-top: 20px;">
    <div id="dotcollector-app">
        <p><?php echo get_string('loadingapp', 'dotcollector'); ?></p>
        <iframe
            id="dotcollector-iframe"
            src="<?php echo new moodle_url('/mod/dotcollector/webapp/index.html', array('token' => $sessiontoken)); ?>"
            style="width: 100%; height: 700px; border: 2px solid #ddd; border-radius: 8px;"
            frameborder="0"
            allowfullscreen>
        </iframe>
    </div>
</div>

<?php
echo $OUTPUT->footer();
