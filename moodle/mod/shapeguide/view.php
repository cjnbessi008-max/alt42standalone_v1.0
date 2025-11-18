<?php
/**
 * View page for Shape Guide Lines Generator
 * Moodle 3.7 compatible
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course module ID

if ($id) {
    $cm         = get_coursemodule_from_id('shapeguide', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $shapeguide = $DB->get_record('shapeguide', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    error('You must specify a course_module ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Log view
$event = \mod_shapeguide\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $shapeguide);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/shapeguide/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($shapeguide->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add external app resources
$PAGE->requires->css('/path/to/shapeguide/public/styles.css');
$PAGE->requires->js('/path/to/shapeguide/public/shape-engine.js', true);
$PAGE->requires->js('/path/to/shapeguide/public/app.js', true);

// Pass Moodle context to JavaScript
$PAGE->requires->js_init_call('M.mod_shapeguide.init', array(
    'courseId' => $course->id,
    'cmId' => $cm->id,
    'userId' => $USER->id,
    'canEdit' => has_capability('mod/shapeguide:addinstance', $context),
    'settings' => array(
        'autoparallel' => $shapeguide->autoparallel,
        'autoperpendicular' => $shapeguide->autoperpendicular,
        'showlabels' => $shapeguide->showlabels,
        'parallelcolor' => $shapeguide->parallelcolor,
        'perpendicularcolor' => $shapeguide->perpendicularcolor,
    )
));

echo $OUTPUT->header();

// Display activity name and intro
echo $OUTPUT->heading(format_string($shapeguide->name));

if ($shapeguide->intro) {
    echo $OUTPUT->box(format_module_intro('shapeguide', $shapeguide, $cm->id), 'generalbox mod_introbox', 'shapeguideintro');
}

// Include the main app HTML
?>
<div class="shapeguide-app-container">
    <iframe
        src="/path/to/shapeguide/public/index.html?course_id=<?php echo $course->id; ?>&activity_id=<?php echo $cm->id; ?>"
        width="100%"
        height="900px"
        frameborder="0"
        style="border: none; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    </iframe>
</div>

<?php
echo $OUTPUT->footer();
