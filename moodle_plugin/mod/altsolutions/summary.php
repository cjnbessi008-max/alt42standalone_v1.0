<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Summary page - shows student's complete work
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT); // Course module id.

$cm = get_coursemodule_from_id('altsolutions', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$altsolutions = $DB->get_record('altsolutions', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/altsolutions:view', $context);

// Set up the page.
$PAGE->set_url('/mod/altsolutions/summary.php', array('id' => $cm->id));
$PAGE->set_title(format_string($altsolutions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($altsolutions->name));
echo $OUTPUT->heading(get_string('summary', 'altsolutions'), 3);

// Get all steps and attempts.
$steps = altsolutions_get_steps($altsolutions->id);

echo $OUTPUT->box_start('generalbox');

foreach ($steps as $step) {
    echo html_writer::start_div('step-summary mb-4 p-3 border rounded');

    echo html_writer::tag('h4', get_string('stepname', 'altsolutions', $step->stepnumber) . ': ' . format_string($step->title));

    $attempt = altsolutions_get_user_step_attempt($step->id, $USER->id);

    if ($attempt) {
        // Show alternatives explored.
        $alternatives = altsolutions_get_alternatives($attempt->id);

        if (!empty($alternatives)) {
            echo html_writer::tag('h5', get_string('alternativesexplored', 'altsolutions') . ': ' . count($alternatives), array('class' => 'mt-3'));

            echo html_writer::start_tag('ul', array('class' => 'list-group mb-3'));
            foreach ($alternatives as $alt) {
                echo html_writer::start_tag('li', array('class' => 'list-group-item' . ($alt->selected ? ' active' : '')));
                echo html_writer::tag('strong', $alt->description);
                if (!empty($alt->reasoning)) {
                    echo html_writer::tag('p', $alt->reasoning, array('class' => 'mb-0 mt-2 small'));
                }
                if ($alt->selected) {
                    echo html_writer::tag('span', ' ✓ ' . get_string('selected', 'core'), array('class' => 'badge badge-success ml-2'));
                }
                echo html_writer::end_tag('li');
            }
            echo html_writer::end_tag('ul');
        }

        // Show selected approach.
        echo html_writer::tag('h5', get_string('selectapproach', 'altsolutions'));
        echo html_writer::tag('p', nl2br(s($attempt->approach)), array('class' => 'border p-2 bg-light'));

        // Show solution.
        echo html_writer::tag('h5', get_string('yoursolution', 'altsolutions'), array('class' => 'mt-3'));
        echo html_writer::tag('p', nl2br(s($attempt->solution)), array('class' => 'border p-2 bg-light'));

        // Show confidence.
        $confidencelevels = array(
            1 => get_string('verylow', 'altsolutions'),
            2 => get_string('low', 'altsolutions'),
            3 => get_string('medium', 'altsolutions'),
            4 => get_string('high', 'altsolutions'),
            5 => get_string('veryhigh', 'altsolutions')
        );
        echo html_writer::tag('p',
            html_writer::tag('strong', get_string('confidencelevel', 'altsolutions') . ': ') .
            $confidencelevels[$attempt->confidence],
            array('class' => 'mt-2')
        );

        // Show time spent.
        if ($attempt->timespent > 0) {
            $minutes = floor($attempt->timespent / 60);
            $seconds = $attempt->timespent % 60;
            echo html_writer::tag('p',
                html_writer::tag('strong', get_string('timespent', 'altsolutions') . ': ') .
                sprintf('%d:%02d', $minutes, $seconds),
                array('class' => 'text-muted')
            );
        }

    } else {
        echo html_writer::tag('p', get_string('notstarted', 'altsolutions'), array('class' => 'text-muted'));
    }

    echo html_writer::end_div();
}

echo $OUTPUT->box_end();

// Show reflection if completed.
$reflection = $DB->get_record('altsolutions_reflections', array(
    'altsolutionsid' => $altsolutions->id,
    'userid' => $USER->id
));

if ($reflection) {
    echo $OUTPUT->box_start('generalbox mt-4');
    echo $OUTPUT->heading(get_string('reflection', 'altsolutions'), 3);

    echo html_writer::tag('h5', get_string('mosteffective', 'altsolutions'));
    echo html_writer::tag('p', nl2br(s($reflection->mosteffective)), array('class' => 'border p-2 bg-light'));

    echo html_writer::tag('h5', get_string('whatlearned', 'altsolutions'), array('class' => 'mt-3'));
    echo html_writer::tag('p', nl2br(s($reflection->learned)), array('class' => 'border p-2 bg-light'));

    echo html_writer::tag('h5', get_string('whatwouldchange', 'altsolutions'), array('class' => 'mt-3'));
    echo html_writer::tag('p', nl2br(s($reflection->wouldchange)), array('class' => 'border p-2 bg-light'));

    echo $OUTPUT->box_end();
}

// Back button.
echo html_writer::tag('p',
    html_writer::link(new moodle_url('/mod/altsolutions/view.php', array('id' => $cm->id)),
        get_string('back'), array('class' => 'btn btn-secondary'))
);

echo $OUTPUT->footer();
