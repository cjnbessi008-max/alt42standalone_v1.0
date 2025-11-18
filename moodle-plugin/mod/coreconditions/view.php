<?php
/**
 * Prints a particular instance of coreconditions
 *
 * @package    mod_coreconditions
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID
$n  = optional_param('n', 0, PARAM_INT);  // coreconditions instance ID

if ($id) {
    $cm         = get_coursemodule_from_id('coreconditions', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $coreconditions  = $DB->get_record('coreconditions', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $coreconditions  = $DB->get_record('coreconditions', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $coreconditions->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('coreconditions', $coreconditions->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);

// Trigger module viewed event.
$event = \mod_coreconditions\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $coreconditions);
$event->trigger();

// Print the page header.
$PAGE->set_url('/mod/coreconditions/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($coreconditions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

echo $OUTPUT->header();

echo $OUTPUT->heading($coreconditions->name);

// Display intro.
if ($coreconditions->intro) {
    echo $OUTPUT->box(format_module_intro('coreconditions', $coreconditions, $cm->id), 'generalbox mod_introbox', 'coreconditionsintro');
}

// Get all problems for this activity.
$problems = $DB->get_records('coreconditions_problems', array('coreconditions_id' => $coreconditions->id), 'id ASC');

if (has_capability('mod/coreconditions:manageconditions', $context)) {
    // Teacher view - show management interface
    echo '<div class="coreconditions-teacher-view">';
    echo '<h3>' . get_string('problems', 'coreconditions') . '</h3>';

    echo '<p><a href="' . new moodle_url('/mod/coreconditions/manage_problem.php', array('cmid' => $cm->id)) . '" class="btn btn-primary">'
         . get_string('addproblem', 'coreconditions') . '</a></p>';

    if (empty($problems)) {
        echo '<p>' . get_string('noproblems', 'coreconditions') . '</p>';
    } else {
        echo '<table class="generaltable">';
        echo '<thead><tr>';
        echo '<th>' . get_string('problemname', 'coreconditions') . '</th>';
        echo '<th>' . get_string('problemtype', 'coreconditions') . '</th>';
        echo '<th>' . get_string('difficultylevel', 'coreconditions') . '</th>';
        echo '<th>' . get_string('coreconditions', 'coreconditions') . '</th>';
        echo '<th>Actions</th>';
        echo '</tr></thead><tbody>';

        foreach ($problems as $problem) {
            $conditions = $DB->get_records('coreconditions_conditions',
                array('problem_id' => $problem->id), 'condition_order ASC');
            $conditioncount = count($conditions);

            echo '<tr>';
            echo '<td>' . format_string($problem->name) . '</td>';
            echo '<td>' . format_string($problem->problem_type) . '</td>';
            echo '<td>' . $problem->difficulty_level . '</td>';
            echo '<td>' . $conditioncount . '/3';
            if ($conditioncount != 3) {
                echo ' <span class="badge badge-warning">Incomplete</span>';
            } else {
                echo ' <span class="badge badge-success">Complete</span>';
            }
            echo '</td>';
            echo '<td>';
            echo '<a href="' . new moodle_url('/mod/coreconditions/manage_problem.php',
                array('cmid' => $cm->id, 'problemid' => $problem->id)) . '">Edit</a> | ';
            echo '<a href="' . new moodle_url('/mod/coreconditions/manage_conditions.php',
                array('cmid' => $cm->id, 'problemid' => $problem->id)) . '">Manage Conditions</a> | ';
            echo '<a href="' . new moodle_url('/mod/coreconditions/delete_problem.php',
                array('cmid' => $cm->id, 'problemid' => $problem->id)) . '">Delete</a>';
            echo '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
    }

    echo '</div>';

} else {
    // Student view - show problems to solve
    echo '<div class="coreconditions-student-view">';
    echo '<h3>' . get_string('problems', 'coreconditions') . '</h3>';

    if (empty($problems)) {
        echo '<p>' . get_string('noproblems', 'coreconditions') . '</p>';
    } else {
        foreach ($problems as $problem) {
            echo '<div class="problem-card card mb-3">';
            echo '<div class="card-body">';
            echo '<h4 class="card-title">' . format_string($problem->name) . '</h4>';

            if ($problem->description) {
                echo '<p class="card-text">' . format_text($problem->description) . '</p>';
            }

            // Get conditions for this problem
            $conditions = $DB->get_records('coreconditions_conditions',
                array('problem_id' => $problem->id), 'condition_order ASC');

            if (count($conditions) == 3) {
                echo '<div class="conditions-list">';
                echo '<h5>' . get_string('coreconditions', 'coreconditions') . ':</h5>';
                echo '<ul>';
                foreach ($conditions as $condition) {
                    echo '<li><strong>' . format_string($condition->condition_name) . '</strong>: '
                         . format_text($condition->condition_description) . '</li>';
                }
                echo '</ul>';
                echo '</div>';

                echo '<a href="' . new moodle_url('/mod/coreconditions/attempt.php',
                    array('cmid' => $cm->id, 'problemid' => $problem->id)) . '" class="btn btn-primary mt-2">'
                    . get_string('submit', 'coreconditions') . '</a>';
            } else {
                echo '<p class="text-muted">This problem is not yet complete.</p>';
            }

            echo '</div></div>';
        }
    }

    echo '</div>';
}

// Finish the page.
echo $OUTPUT->footer();
