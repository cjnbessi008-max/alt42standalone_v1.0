<?php
/**
 * View page for Case Timeline activity module
 *
 * @package    mod_casetimeline
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))) . '/config.php');
require_once(dirname(__FILE__) . '/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID

if ($id) {
    $cm             = get_coursemodule_from_id('casetimeline', $id, 0, false, MUST_EXIST);
    $course         = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $casetimeline   = $DB->get_record('casetimeline', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger course_module_viewed event
$event = \mod_casetimeline\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $casetimeline);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/casetimeline/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($casetimeline->name));
$PAGE->set_heading(format_string($course->fullname));

echo $OUTPUT->header();

// Display intro/description
if (trim(strip_tags($casetimeline->intro))) {
    echo $OUTPUT->box_start('mod_introbox', 'casetimelineintro');
    echo format_module_intro('casetimeline', $casetimeline, $cm->id);
    echo $OUTPUT->box_end();
}

// Get Case Timeline app URL
// Adjust this URL to match your installation
$app_base_url = '/case-timeline/frontend/app/index.html';
$case_id = $casetimeline->case_id ?? 1;
$user_id = $USER->id;
$course_id = $course->id;

$app_url = $app_base_url . '?case_id=' . $case_id . '&user_id=' . $user_id . '&course_id=' . $course_id;

// Display Case Timeline app in iframe
echo '<div class="casetimeline-container" style="width: 100%; height: 100vh; display: flex; justify-content: flex-end; align-items: flex-end; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">';
echo '<iframe src="' . $app_url . '" style="width: 375px; height: 667px; border: none; border-radius: 40px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);"></iframe>';
echo '</div>';

// Add custom CSS
echo '<style>
.casetimeline-container {
    margin: -20px;
    margin-top: 20px;
}
</style>';

// Finish the page
echo $OUTPUT->footer();
