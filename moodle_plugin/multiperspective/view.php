<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Main view page for students
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once(__DIR__ . '/classes/problem.php');
require_once(__DIR__ . '/classes/perspective.php');

use mod_multiperspective\problem;
use mod_multiperspective\perspective;

// Get parameters
$id = optional_param('id', 0, PARAM_INT); // Course module ID
$p = optional_param('p', 0, PARAM_INT); // Problem ID to view
$perspectiveid = optional_param('perspectiveid', 0, PARAM_INT); // Perspective to display

// Get course module and related records
if ($id) {
    $cm = get_coursemodule_from_id('multiperspective', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $multiperspective = $DB->get_record('multiperspective', array('id' => $cm->instance), '*', MUST_EXIST);
} else {
    print_error('missingparameter');
}

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/multiperspective:view', $context);

// Log the view
$event = \mod_multiperspective\event\course_module_viewed::create(array(
    'objectid' => $multiperspective->id,
    'context' => $context,
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('multiperspective', $multiperspective);
$event->trigger();

// Completion
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Set up the page
$PAGE->set_url('/mod/multiperspective/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($multiperspective->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Add CSS for the module
$PAGE->requires->css('/mod/multiperspective/styles.css');

// Add JavaScript for perspective switching and time tracking
$PAGE->requires->js_call_amd('mod_multiperspective/view', 'init', array($cm->id));

echo $OUTPUT->header();

// Display activity introduction
echo $OUTPUT->heading(format_string($multiperspective->name));

if ($multiperspective->intro) {
    echo $OUTPUT->box(format_module_intro('multiperspective', $multiperspective, $cm->id), 'generalbox mod_introbox');
}

// Get all problems for this activity
$problems = problem::get_problems_by_activity($multiperspective->id);

if (empty($problems)) {
    echo $OUTPUT->notification(get_string('noproblems', 'mod_multiperspective'), 'notifywarning');

    if (has_capability('mod/multiperspective:manage', $context)) {
        $manageurl = new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $cm->id));
        echo html_writer::link($manageurl, get_string('addproblem', 'mod_multiperspective'),
            array('class' => 'btn btn-primary'));
    }
} else {
    // Display problem list or specific problem
    if ($p > 0) {
        // Display specific problem
        $problem_obj = new problem($p);
        display_problem($problem_obj, $multiperspective, $cm, $context, $perspectiveid);
    } else {
        // Display problem list
        display_problem_list($problems, $multiperspective, $cm, $context);
    }
}

echo $OUTPUT->footer();

/**
 * Display list of problems
 */
function display_problem_list($problems, $multiperspective, $cm, $context) {
    global $OUTPUT, $USER, $DB;

    echo html_writer::start_tag('div', array('class' => 'problem-list'));

    foreach ($problems as $problem) {
        $problemurl = new moodle_url('/mod/multiperspective/view.php', array(
            'id' => $cm->id,
            'p' => $problem->get_id()
        ));

        // Get user's best attempt
        $bestattempt = $DB->get_record_sql(
            "SELECT MAX(score) as best_score, COUNT(*) as attempt_count
             FROM {multiperspective_attempts}
             WHERE problemid = ? AND userid = ?",
            array($problem->get_id(), $USER->id)
        );

        $statusclass = '';
        $statustext = '';
        if ($bestattempt && $bestattempt->attempt_count > 0) {
            if ($bestattempt->best_score >= 100) {
                $statusclass = 'problem-completed';
                $statustext = get_string('correct', 'mod_multiperspective');
            } else {
                $statusclass = 'problem-attempted';
                $statustext = get_string('attemptnumber', 'mod_multiperspective', $bestattempt->attempt_count);
            }
        }

        echo html_writer::start_tag('div', array('class' => 'problem-item ' . $statusclass));
        echo html_writer::tag('h3', html_writer::link($problemurl, $problem->get_title()));

        if ($statustext) {
            echo html_writer::tag('span', $statustext, array('class' => 'problem-status'));
        }

        // Show difficulty level
        $difficulty = $problem->get_difficulty_level();
        $difficultytext = get_string('difficulty_' . $difficulty, 'mod_multiperspective');
        echo html_writer::tag('span', $difficultytext, array('class' => 'difficulty-badge difficulty-' . $difficulty));

        echo html_writer::end_tag('div');
    }

    echo html_writer::end_tag('div');
}

/**
 * Display a specific problem with perspectives
 */
function display_problem($problem, $multiperspective, $cm, $context, $perspectiveid) {
    global $OUTPUT, $USER, $DB, $PAGE;

    $problemid = $problem->get_id();

    // Get all perspectives for this problem
    $perspectives = $problem->get_perspectives();

    if (empty($perspectives)) {
        echo $OUTPUT->notification(get_string('noperspectives', 'mod_multiperspective'), 'notifywarning');
        if (has_capability('mod/multiperspective:manage', $context)) {
            $manageurl = new moodle_url('/mod/multiperspective/manage_problems.php', array(
                'id' => $cm->id,
                'problemid' => $problemid
            ));
            echo html_writer::link($manageurl, get_string('addperspective', 'mod_multiperspective'),
                array('class' => 'btn btn-primary'));
        }
        return;
    }

    // Determine which perspective to show
    if ($perspectiveid > 0) {
        $current_perspective = null;
        foreach ($perspectives as $persp) {
            if ($persp->get_id() == $perspectiveid) {
                $current_perspective = $persp;
                break;
            }
        }
        if (!$current_perspective) {
            $current_perspective = $perspectives[0];
        }
    } else {
        $current_perspective = $perspectives[0];
    }

    // Record perspective view
    $current_perspective->record_view($USER->id);

    // Get perspectives viewed by this user
    $sql = "SELECT perspectiveid FROM {multiperspective_views}
            WHERE problemid = ? AND userid = ?";
    $viewed_records = $DB->get_records_sql($sql, array($problemid, $USER->id));
    $viewed_perspective_ids = array_keys($viewed_records);
    $perspectives_viewed_count = count($viewed_perspective_ids);
    $total_perspectives = count($perspectives);

    // Check if user can submit
    $can_submit = true;
    $submit_warning = '';

    if ($multiperspective->require_all_perspectives && $perspectives_viewed_count < $total_perspectives) {
        $can_submit = false;
        $submit_warning = get_string('allperspectiveswarning', 'mod_multiperspective');
    } elseif ($perspectives_viewed_count < $multiperspective->min_perspectives) {
        $can_submit = false;
        $submit_warning = get_string('minperspectiveswarning', 'mod_multiperspective', $multiperspective->min_perspectives);
    }

    // Check attempt limits
    $attempt_count = $DB->count_records('multiperspective_attempts', array(
        'problemid' => $problemid,
        'userid' => $USER->id
    ));

    $attempts_remaining = '';
    if ($multiperspective->max_attempts > 0) {
        $remaining = $multiperspective->max_attempts - $attempt_count;
        if ($remaining <= 0) {
            $can_submit = false;
            $submit_warning = get_string('no_attempts_remaining', 'mod_multiperspective');
        } else {
            $attempts_remaining = get_string('attempts_remaining', 'mod_multiperspective', $remaining);
        }
    }

    // Display problem
    echo html_writer::start_tag('div', array('class' => 'multiperspective-problem'));

    // Breadcrumb navigation
    $backurl = new moodle_url('/mod/multiperspective/view.php', array('id' => $cm->id));
    echo html_writer::link($backurl, '← ' . get_string('back'), array('class' => 'back-link'));

    echo html_writer::tag('h2', $problem->get_title());
    echo html_writer::tag('div', format_text($problem->get_description()), array('class' => 'problem-description'));

    // Perspective navigation tabs
    echo html_writer::start_tag('div', array('class' => 'perspective-tabs'));
    foreach ($perspectives as $persp) {
        $is_active = ($persp->get_id() == $current_perspective->get_id());
        $is_viewed = in_array($persp->get_id(), $viewed_perspective_ids);

        $taburl = new moodle_url('/mod/multiperspective/view.php', array(
            'id' => $cm->id,
            'p' => $problemid,
            'perspectiveid' => $persp->get_id()
        ));

        $classes = array('perspective-tab');
        if ($is_active) {
            $classes[] = 'active';
        }
        if ($is_viewed) {
            $classes[] = 'viewed';
        }

        $tabhtml = html_writer::tag('span', $persp->get_perspective_name());
        if ($is_viewed) {
            $tabhtml .= ' ✓';
        }

        echo html_writer::link($taburl, $tabhtml, array('class' => implode(' ', $classes)));
    }
    echo html_writer::end_tag('div');

    // Progress indicator
    echo html_writer::tag('div',
        get_string('perspectivesviewed', 'mod_multiperspective', array(
            'viewed' => $perspectives_viewed_count,
            'total' => $total_perspectives
        )),
        array('class' => 'perspective-progress')
    );

    // Display current perspective content
    echo html_writer::start_tag('div', array('class' => 'perspective-content', 'id' => 'perspective-content'));

    echo html_writer::tag('h3', $current_perspective->get_perspective_name());
    echo html_writer::tag('div',
        html_writer::tag('span', $current_perspective->get_perspective_type(), array('class' => 'perspective-type-badge')),
        array('class' => 'perspective-type')
    );

    // Display media if available
    if ($current_perspective->get_media_url()) {
        $mediaurl = $current_perspective->get_media_url();
        // Simple check for image vs video
        if (preg_match('/\.(jpg|jpeg|png|gif|svg)$/i', $mediaurl)) {
            echo html_writer::empty_tag('img', array(
                'src' => $mediaurl,
                'alt' => $current_perspective->get_perspective_name(),
                'class' => 'perspective-media'
            ));
        } else {
            echo html_writer::link($mediaurl, get_string('viewmedia', 'mod_multiperspective'),
                array('target' => '_blank', 'class' => 'btn btn-secondary'));
        }
    }

    echo html_writer::tag('div', format_text($current_perspective->get_content(), $current_perspective->get_content_format()),
        array('class' => 'perspective-text'));

    // Display hints if available
    if ($current_perspective->get_hints()) {
        echo html_writer::start_tag('div', array('class' => 'perspective-hints collapsible'));
        echo html_writer::tag('button', get_string('hints', 'mod_multiperspective') . ' ▼',
            array('class' => 'hint-toggle btn btn-sm btn-secondary', 'type' => 'button',
                  'onclick' => 'this.nextElementSibling.classList.toggle("hidden")'));
        echo html_writer::tag('div', format_text($current_perspective->get_hints()),
            array('class' => 'hint-content hidden'));
        echo html_writer::end_tag('div');
    }

    echo html_writer::end_tag('div'); // perspective-content

    // Answer submission form (if student can submit)
    if (has_capability('mod/multiperspective:submit', $context)) {
        echo html_writer::start_tag('div', array('class' => 'answer-section'));

        if ($submit_warning) {
            echo $OUTPUT->notification($submit_warning, $can_submit ? 'notifywarning' : 'notifyerror');
        }

        if ($attempts_remaining) {
            echo html_writer::tag('p', $attempts_remaining, array('class' => 'attempts-info'));
        }

        $submiturl = new moodle_url('/mod/multiperspective/submit.php');
        echo html_writer::start_tag('form', array(
            'method' => 'post',
            'action' => $submiturl->out(),
            'class' => 'answer-form'
        ));

        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'sesskey',
            'value' => sesskey()
        ));
        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'id',
            'value' => $cm->id
        ));
        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'problemid',
            'value' => $problemid
        ));
        echo html_writer::empty_tag('input', array(
            'type' => 'hidden',
            'name' => 'perspectives_viewed',
            'value' => json_encode($viewed_perspective_ids),
            'id' => 'perspectives_viewed'
        ));

        echo html_writer::tag('label', get_string('youranswer', 'mod_multiperspective'),
            array('for' => 'answer'));
        echo html_writer::tag('textarea', '', array(
            'name' => 'answer',
            'id' => 'answer',
            'rows' => 4,
            'required' => 'required',
            'class' => 'form-control'
        ));

        echo html_writer::empty_tag('input', array(
            'type' => 'submit',
            'value' => get_string('submitanswer', 'mod_multiperspective'),
            'class' => 'btn btn-primary',
            'disabled' => !$can_submit
        ));

        echo html_writer::end_tag('form');

        // Display previous attempts
        $attempts = $DB->get_records('multiperspective_attempts',
            array('problemid' => $problemid, 'userid' => $USER->id),
            'timecreated DESC');

        if (!empty($attempts)) {
            echo html_writer::tag('h3', get_string('previousattempts', 'mod_multiperspective'));
            echo html_writer::start_tag('div', array('class' => 'previous-attempts'));

            foreach ($attempts as $attempt) {
                $attemptclass = $attempt->is_correct ? 'attempt-correct' : 'attempt-incorrect';
                echo html_writer::start_tag('div', array('class' => 'attempt-item ' . $attemptclass));

                echo html_writer::tag('div',
                    get_string('attemptnumber', 'mod_multiperspective', $attempt->attempt_number),
                    array('class' => 'attempt-number')
                );

                echo html_writer::tag('div', get_string('score', 'mod_multiperspective') . ': ' . round($attempt->score, 2),
                    array('class' => 'attempt-score'));

                echo html_writer::tag('div', userdate($attempt->timecreated),
                    array('class' => 'attempt-time'));

                if ($attempt->feedback) {
                    echo html_writer::tag('div', $attempt->feedback, array('class' => 'attempt-feedback'));
                }

                echo html_writer::end_tag('div');
            }

            echo html_writer::end_tag('div');
        }

        echo html_writer::end_tag('div'); // answer-section
    }

    echo html_writer::end_tag('div'); // multiperspective-problem
}
