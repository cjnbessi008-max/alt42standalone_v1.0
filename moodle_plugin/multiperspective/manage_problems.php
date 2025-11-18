<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Manage problems and perspectives
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
$cmid = required_param('id', PARAM_INT);
$action = optional_param('action', 'list', PARAM_ALPHA);
$problemid = optional_param('problemid', 0, PARAM_INT);
$perspectiveid = optional_param('perspectiveid', 0, PARAM_INT);

// Get course module and related records
$cm = get_coursemodule_from_id('multiperspective', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$multiperspective = $DB->get_record('multiperspective', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, false, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/multiperspective:manage', $context);

// Set up the page
$PAGE->set_url('/mod/multiperspective/manage_problems.php', array('id' => $cmid));
$PAGE->set_title(get_string('manage', 'mod_multiperspective'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Process actions
switch ($action) {
    case 'deleteproblem':
        require_sesskey();
        if ($problemid > 0) {
            $problem = new problem($problemid);
            if ($problem->get_multiperspectiveid() == $multiperspective->id) {
                $problem->delete();
                redirect(new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $cmid)),
                    get_string('problemdeleted', 'mod_multiperspective'),
                    null,
                    \core\output\notification::NOTIFY_SUCCESS);
            }
        }
        break;

    case 'deleteperspective':
        require_sesskey();
        if ($perspectiveid > 0) {
            $perspective = new perspective($perspectiveid);
            $perspective->delete();
            redirect(new moodle_url('/mod/multiperspective/manage_problems.php',
                array('id' => $cmid, 'action' => 'editproblem', 'problemid' => $problemid)),
                get_string('perspectivedeleted', 'mod_multiperspective'),
                null,
                \core\output\notification::NOTIFY_SUCCESS);
        }
        break;
}

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($multiperspective->name));

// Navigation tabs
$tabs = array();
$tabs[] = new tabobject('list', new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $cmid)),
    get_string('problems', 'mod_multiperspective'));
$tabs[] = new tabobject('view', new moodle_url('/mod/multiperspective/view.php', array('id' => $cmid)),
    get_string('view'));

$current_tab = ($action == 'list' || $action == 'editproblem' || $action == 'addproblem') ? 'list' : 'view';
echo $OUTPUT->tabtree($tabs, $current_tab);

// Display content based on action
switch ($action) {
    case 'list':
        display_problem_list($multiperspective, $cmid);
        break;

    case 'addproblem':
    case 'editproblem':
        display_problem_form($multiperspective, $cmid, $problemid);
        break;

    case 'addperspective':
    case 'editperspective':
        display_perspective_form($multiperspective, $cmid, $problemid, $perspectiveid);
        break;
}

echo $OUTPUT->footer();

/**
 * Display list of problems with management options
 */
function display_problem_list($multiperspective, $cmid) {
    global $OUTPUT;

    $problems = problem::get_problems_by_activity($multiperspective->id);

    // Add new problem button
    $addurl = new moodle_url('/mod/multiperspective/manage_problems.php',
        array('id' => $cmid, 'action' => 'addproblem'));
    echo html_writer::link($addurl, get_string('addproblem', 'mod_multiperspective'),
        array('class' => 'btn btn-primary mb-3'));

    if (empty($problems)) {
        echo $OUTPUT->notification(get_string('noproblems', 'mod_multiperspective'), 'notifyinfo');
        return;
    }

    echo html_writer::start_tag('div', array('class' => 'problem-management-list'));

    foreach ($problems as $problem) {
        echo html_writer::start_tag('div', array('class' => 'problem-management-item card mb-3'));
        echo html_writer::start_tag('div', array('class' => 'card-body'));

        echo html_writer::tag('h4', $problem->get_title(), array('class' => 'card-title'));

        // Problem details
        echo html_writer::tag('p', format_text($problem->get_description()), array('class' => 'card-text'));

        echo html_writer::tag('span',
            get_string('problem_type_' . $problem->get_problem_type(), 'mod_multiperspective'),
            array('class' => 'badge badge-info mr-2'));

        echo html_writer::tag('span',
            get_string('difficulty_' . $problem->get_difficulty_level(), 'mod_multiperspective'),
            array('class' => 'badge badge-secondary'));

        // Perspectives count
        $perspectives = $problem->get_perspectives();
        echo html_writer::tag('p',
            get_string('perspectives', 'mod_multiperspective') . ': ' . count($perspectives),
            array('class' => 'mt-2'));

        // Statistics
        $stats = $problem->get_statistics();
        if ($stats['total_attempts'] > 0) {
            echo html_writer::start_tag('div', array('class' => 'problem-stats'));
            echo html_writer::tag('small',
                sprintf('Attempts: %d | Students: %d | Avg Score: %.1f | Success Rate: %.1f%%',
                    $stats['total_attempts'],
                    $stats['unique_students'],
                    $stats['average_score'],
                    $stats['success_rate']),
                array('class' => 'text-muted'));
            echo html_writer::end_tag('div');
        }

        // Action buttons
        echo html_writer::start_tag('div', array('class' => 'btn-group mt-3', 'role' => 'group'));

        $editurl = new moodle_url('/mod/multiperspective/manage_problems.php',
            array('id' => $cmid, 'action' => 'editproblem', 'problemid' => $problem->get_id()));
        echo html_writer::link($editurl, get_string('edit'), array('class' => 'btn btn-sm btn-secondary'));

        $deleteurl = new moodle_url('/mod/multiperspective/manage_problems.php',
            array('id' => $cmid, 'action' => 'deleteproblem', 'problemid' => $problem->get_id(), 'sesskey' => sesskey()));
        echo html_writer::link($deleteurl, get_string('delete'),
            array('class' => 'btn btn-sm btn-danger',
                  'onclick' => 'return confirm("' . get_string('confirmdelete', 'mod_multiperspective') . '")'));

        echo html_writer::end_tag('div'); // btn-group

        echo html_writer::end_tag('div'); // card-body
        echo html_writer::end_tag('div'); // card
    }

    echo html_writer::end_tag('div');
}

/**
 * Display problem editing form
 */
function display_problem_form($multiperspective, $cmid, $problemid) {
    global $OUTPUT;

    $is_edit = ($problemid > 0);
    $problem = $is_edit ? new problem($problemid) : null;

    if ($is_edit && $problem->get_multiperspectiveid() != $multiperspective->id) {
        print_error('invalidproblem', 'mod_multiperspective');
    }

    $heading = $is_edit ? get_string('editproblem', 'mod_multiperspective') : get_string('addproblem', 'mod_multiperspective');
    echo $OUTPUT->heading($heading, 3);

    $formurl = new moodle_url('/mod/multiperspective/save_problem.php');

    echo html_writer::start_tag('form', array('method' => 'post', 'action' => $formurl->out(), 'class' => 'mform'));

    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'id', 'value' => $cmid));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'problemid', 'value' => $problemid));

    // Title
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('problem_title', 'mod_multiperspective'), array('for' => 'title'));
    echo html_writer::empty_tag('input', array(
        'type' => 'text',
        'name' => 'title',
        'id' => 'title',
        'value' => $is_edit ? $problem->get_title() : '',
        'class' => 'form-control',
        'required' => 'required'
    ));
    echo html_writer::end_tag('div');

    // Description
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('problem_description', 'mod_multiperspective'), array('for' => 'description'));
    echo html_writer::tag('textarea', $is_edit ? $problem->get_description() : '', array(
        'name' => 'description',
        'id' => 'description',
        'class' => 'form-control',
        'rows' => 5,
        'required' => 'required'
    ));
    echo html_writer::end_tag('div');

    // Problem type
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('problem_type', 'mod_multiperspective'), array('for' => 'problem_type'));
    echo html_writer::start_tag('select', array('name' => 'problem_type', 'id' => 'problem_type', 'class' => 'form-control'));
    $types = array('open', 'multiple_choice', 'numeric');
    foreach ($types as $type) {
        $selected = ($is_edit && $problem->get_problem_type() == $type) ? 'selected' : '';
        echo html_writer::tag('option', get_string('problem_type_' . $type, 'mod_multiperspective'),
            array('value' => $type, 'selected' => $selected));
    }
    echo html_writer::end_tag('select');
    echo html_writer::end_tag('div');

    // Correct answer
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('correct_answer', 'mod_multiperspective') . ' (optional)', array('for' => 'correct_answer'));
    echo html_writer::empty_tag('input', array(
        'type' => 'text',
        'name' => 'correct_answer',
        'id' => 'correct_answer',
        'value' => $is_edit ? $problem->get_correct_answer() : '',
        'class' => 'form-control'
    ));
    echo html_writer::end_tag('div');

    // Difficulty level
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('difficulty_level', 'mod_multiperspective'), array('for' => 'difficulty_level'));
    echo html_writer::start_tag('select', array('name' => 'difficulty_level', 'id' => 'difficulty_level', 'class' => 'form-control'));
    for ($i = 1; $i <= 5; $i++) {
        $selected = ($is_edit && $problem->get_difficulty_level() == $i) ? 'selected' : '';
        echo html_writer::tag('option', get_string('difficulty_' . $i, 'mod_multiperspective'),
            array('value' => $i, 'selected' => $selected));
    }
    echo html_writer::end_tag('select');
    echo html_writer::end_tag('div');

    // Submit buttons
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::empty_tag('input', array(
        'type' => 'submit',
        'value' => get_string('save', 'mod_multiperspective'),
        'class' => 'btn btn-primary'
    ));
    $cancelurl = new moodle_url('/mod/multiperspective/manage_problems.php', array('id' => $cmid));
    echo ' ' . html_writer::link($cancelurl, get_string('cancel'), array('class' => 'btn btn-secondary'));
    echo html_writer::end_tag('div');

    echo html_writer::end_tag('form');

    // If editing, show perspectives
    if ($is_edit) {
        echo html_writer::tag('hr', '');
        echo $OUTPUT->heading(get_string('perspectives', 'mod_multiperspective'), 3);

        $addperspurl = new moodle_url('/mod/multiperspective/manage_problems.php',
            array('id' => $cmid, 'action' => 'addperspective', 'problemid' => $problemid));
        echo html_writer::link($addperspurl, get_string('addperspective', 'mod_multiperspective'),
            array('class' => 'btn btn-primary mb-3'));

        $perspectives = $problem->get_perspectives();
        if (empty($perspectives)) {
            echo $OUTPUT->notification(get_string('noperspectives', 'mod_multiperspective'), 'notifyinfo');
        } else {
            echo html_writer::start_tag('div', array('class' => 'perspective-list'));
            foreach ($perspectives as $persp) {
                echo html_writer::start_tag('div', array('class' => 'perspective-item card mb-2'));
                echo html_writer::start_tag('div', array('class' => 'card-body'));

                echo html_writer::tag('h5', $persp->get_perspective_name(), array('class' => 'card-title'));
                echo html_writer::tag('span', $persp->get_perspective_type(), array('class' => 'badge badge-info'));

                // Action buttons
                echo html_writer::start_tag('div', array('class' => 'btn-group mt-2', 'role' => 'group'));

                $editurl = new moodle_url('/mod/multiperspective/manage_problems.php',
                    array('id' => $cmid, 'action' => 'editperspective', 'problemid' => $problemid, 'perspectiveid' => $persp->get_id()));
                echo html_writer::link($editurl, get_string('edit'), array('class' => 'btn btn-sm btn-secondary'));

                $deleteurl = new moodle_url('/mod/multiperspective/manage_problems.php',
                    array('id' => $cmid, 'action' => 'deleteperspective', 'problemid' => $problemid,
                          'perspectiveid' => $persp->get_id(), 'sesskey' => sesskey()));
                echo html_writer::link($deleteurl, get_string('delete'),
                    array('class' => 'btn btn-sm btn-danger',
                          'onclick' => 'return confirm("' . get_string('confirmdelete', 'mod_multiperspective') . '")'));

                echo html_writer::end_tag('div'); // btn-group

                echo html_writer::end_tag('div'); // card-body
                echo html_writer::end_tag('div'); // card
            }
            echo html_writer::end_tag('div');
        }
    }
}

/**
 * Display perspective editing form
 */
function display_perspective_form($multiperspective, $cmid, $problemid, $perspectiveid) {
    global $OUTPUT;

    $is_edit = ($perspectiveid > 0);
    $perspective = $is_edit ? new perspective($perspectiveid) : null;

    $heading = $is_edit ? get_string('editperspective', 'mod_multiperspective') : get_string('addperspective', 'mod_multiperspective');
    echo $OUTPUT->heading($heading, 3);

    $formurl = new moodle_url('/mod/multiperspective/save_perspective.php');

    echo html_writer::start_tag('form', array('method' => 'post', 'action' => $formurl->out(), 'class' => 'mform'));

    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'id', 'value' => $cmid));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'problemid', 'value' => $problemid));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'perspectiveid', 'value' => $perspectiveid));

    // Name
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('perspective_name', 'mod_multiperspective'), array('for' => 'perspective_name'));
    echo html_writer::empty_tag('input', array(
        'type' => 'text',
        'name' => 'perspective_name',
        'id' => 'perspective_name',
        'value' => $is_edit ? $perspective->get_perspective_name() : '',
        'class' => 'form-control',
        'required' => 'required'
    ));
    echo html_writer::end_tag('div');

    // Type
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('perspective_type', 'mod_multiperspective'), array('for' => 'perspective_type'));
    echo html_writer::start_tag('select', array('name' => 'perspective_type', 'id' => 'perspective_type', 'class' => 'form-control'));
    $types = perspective::get_perspective_types();
    foreach ($types as $key => $value) {
        $selected = ($is_edit && $perspective->get_perspective_type() == $key) ? 'selected' : '';
        echo html_writer::tag('option', $value, array('value' => $key, 'selected' => $selected));
    }
    echo html_writer::end_tag('select');
    echo html_writer::end_tag('div');

    // Content
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('perspective_content', 'mod_multiperspective'), array('for' => 'content'));
    echo html_writer::tag('textarea', $is_edit ? $perspective->get_content() : '', array(
        'name' => 'content',
        'id' => 'content',
        'class' => 'form-control',
        'rows' => 8,
        'required' => 'required'
    ));
    echo html_writer::end_tag('div');

    // Hints
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('perspective_hints', 'mod_multiperspective') . ' (optional)', array('for' => 'hints'));
    echo html_writer::tag('textarea', $is_edit ? $perspective->get_hints() : '', array(
        'name' => 'hints',
        'id' => 'hints',
        'class' => 'form-control',
        'rows' => 3
    ));
    echo html_writer::end_tag('div');

    // Media URL
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::tag('label', get_string('media_url', 'mod_multiperspective') . ' (optional)', array('for' => 'media_url'));
    echo html_writer::empty_tag('input', array(
        'type' => 'url',
        'name' => 'media_url',
        'id' => 'media_url',
        'value' => $is_edit ? $perspective->get_media_url() : '',
        'class' => 'form-control'
    ));
    echo html_writer::end_tag('div');

    // Submit buttons
    echo html_writer::start_tag('div', array('class' => 'form-group'));
    echo html_writer::empty_tag('input', array(
        'type' => 'submit',
        'value' => get_string('save', 'mod_multiperspective'),
        'class' => 'btn btn-primary'
    ));
    $cancelurl = new moodle_url('/mod/multiperspective/manage_problems.php',
        array('id' => $cmid, 'action' => 'editproblem', 'problemid' => $problemid));
    echo ' ' . html_writer::link($cancelurl, get_string('cancel'), array('class' => 'btn btn-secondary'));
    echo html_writer::end_tag('div');

    echo html_writer::end_tag('form');
}
