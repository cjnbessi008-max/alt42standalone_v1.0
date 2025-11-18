<?php
/**
 * Prints a particular instance of Area Recombination activity
 *
 * @package    mod_arearecom
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Course module ID
$id = optional_param('id', 0, PARAM_INT);

// Activity instance ID
$a = optional_param('a', 0, PARAM_INT);

if ($id) {
    $cm = get_coursemodule_from_id('arearecom', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $arearecom = $DB->get_record('arearecom', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    $arearecom = $DB->get_record('arearecom', array('id' => $a), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $arearecom->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('arearecom', $arearecom->id, $course->id, false, MUST_EXIST);
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger module viewed event
$event = \mod_arearecom\event\course_module_viewed::create(array(
    'objectid' => $arearecom->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('arearecom', $arearecom);
$event->trigger();

// Print the page header
$PAGE->set_url('/mod/arearecom/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($arearecom->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Output starts here
echo $OUTPUT->header();

// Display activity name and description
echo $OUTPUT->heading($arearecom->name);

if ($arearecom->intro) {
    echo $OUTPUT->box(format_module_intro('arearecom', $arearecom, $cm->id), 'generalbox mod_introbox', 'arearec_intro');
}

// Get user ID and course ID for the app
$userid = $USER->id;
$courseid = $course->id;

// Build iframe URL with parameters
$app_url = new moodle_url('/mod/arearecom/app/index.html', array(
    'user_id' => $userid,
    'course_id' => $courseid,
    'cm_id' => $cm->id,
    'difficulty' => $arearecom->difficulty_level,
    'max_attempts' => $arearecom->max_attempts,
    'enable_hints' => $arearecom->enable_hints,
    'enable_sound' => $arearecom->enable_sound
));

// Display the app in an iframe
echo html_writer::start_div('arearecom-container');
echo html_writer::tag('iframe', '', array(
    'src' => $app_url,
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0',
    'class' => 'arearecom-iframe',
    'allowfullscreen' => 'allowfullscreen'
));
echo html_writer::end_div();

// Add custom CSS
echo html_writer::start_tag('style');
echo '
.arearecom-container {
    margin: 20px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.arearecom-iframe {
    display: block;
    border: none;
}

@media (max-width: 768px) {
    .arearecom-iframe {
        height: 600px;
    }
}
';
echo html_writer::end_tag('style');

// Add JavaScript for communication with iframe
echo html_writer::start_tag('script');
echo '
// Listen for messages from the iframe (grade updates)
window.addEventListener("message", function(event) {
    // Verify origin for security
    if (event.origin !== window.location.origin) {
        return;
    }

    if (event.data.type === "grade_update") {
        // Handle grade update
        console.log("Grade updated:", event.data.grade);

        // Send grade to Moodle gradebook
        fetch("' . new moodle_url('/mod/arearecom/ajax/update_grade.php') . '", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cm_id: ' . $cm->id . ',
                user_id: ' . $userid . ',
                grade: event.data.grade,
                sesskey: M.cfg.sesskey
            })
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            if (data.success) {
                console.log("Grade saved successfully");
            }
        }).catch(function(error) {
            console.error("Error saving grade:", error);
        });
    }
});
';
echo html_writer::end_tag('script');

// Finish the page
echo $OUTPUT->footer();
