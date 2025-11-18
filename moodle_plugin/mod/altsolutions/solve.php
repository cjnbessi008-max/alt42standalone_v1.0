<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Step solving page - students explore alternatives and solve
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

$id = required_param('id', PARAM_INT); // Course module id.
$stepnum = required_param('step', PARAM_INT); // Step number.

$cm = get_coursemodule_from_id('altsolutions', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$altsolutions = $DB->get_record('altsolutions', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);

$context = context_module::instance($cm->id);
require_capability('mod/altsolutions:submit', $context);

// Get all steps.
$steps = altsolutions_get_steps($altsolutions->id);
if (empty($steps)) {
    print_error('error:nosteps', 'altsolutions');
}

$steps = array_values($steps);
if (!isset($steps[$stepnum - 1])) {
    print_error('Invalid step number');
}

$step = $steps[$stepnum - 1];

// Set up the page.
$PAGE->set_url('/mod/altsolutions/solve.php', array('id' => $cm->id, 'step' => $stepnum));
$PAGE->set_title(format_string($altsolutions->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);
$PAGE->requires->js_call_amd('mod_altsolutions/solve', 'init');

// Handle form submission.
if (data_submitted() && confirm_sesskey()) {
    $data = new stdClass();
    $data->altsolutionsid = $altsolutions->id;
    $data->stepid = $step->id;
    $data->approach = required_param('approach', PARAM_TEXT);
    $data->solution = required_param('solution', PARAM_RAW);
    $data->confidence = optional_param('confidence', 3, PARAM_INT);
    $data->timespent = optional_param('timespent', 0, PARAM_INT);

    // Get alternatives.
    $data->alternatives = array();
    $altcount = optional_param('altcount', 0, PARAM_INT);
    for ($i = 0; $i < $altcount; $i++) {
        $desc = optional_param('alt_desc_' . $i, '', PARAM_TEXT);
        $reason = optional_param('alt_reason_' . $i, '', PARAM_TEXT);
        if (!empty($desc)) {
            $data->alternatives[] = array(
                'description' => $desc,
                'reasoning' => $reason
            );
        }
    }

    // Validate minimum alternatives.
    if (count($data->alternatives) < $altsolutions->minalternatives) {
        $error = get_string('error:notenoughalternatives', 'altsolutions', $altsolutions->minalternatives);
    } else if (empty($data->solution)) {
        $error = get_string('error:nosolution', 'altsolutions');
    } else {
        // Save attempt.
        altsolutions_save_step_attempt($data);

        // Redirect to next step or reflection.
        if ($stepnum < count($steps)) {
            redirect(new moodle_url('/mod/altsolutions/solve.php',
                array('id' => $cm->id, 'step' => $stepnum + 1)));
        } else {
            redirect(new moodle_url('/mod/altsolutions/reflection.php', array('id' => $cm->id)));
        }
    }
}

// Get existing attempt if any.
$attempt = altsolutions_get_user_step_attempt($step->id, $USER->id);
$alternatives = $attempt ? altsolutions_get_alternatives($attempt->id) : array();

echo $OUTPUT->header();

echo $OUTPUT->heading(format_string($altsolutions->name));
echo $OUTPUT->heading(get_string('stepname', 'altsolutions', $stepnum) . ': ' . format_string($step->title), 3);

// Show step description.
if (!empty($step->description)) {
    echo $OUTPUT->box_start('generalbox');
    echo format_text($step->description, FORMAT_HTML);
    echo $OUTPUT->box_end();
}

// Show hint if available.
if (!empty($step->hinttext)) {
    echo $OUTPUT->box_start('generalbox alert alert-info');
    echo html_writer::tag('strong', get_string('stephint', 'altsolutions'));
    echo format_text($step->hinttext, FORMAT_HTML);
    echo $OUTPUT->box_end();
}

// Show error if validation failed.
if (isset($error)) {
    echo $OUTPUT->notification($error, 'notifyproblem');
}

// Start form.
echo html_writer::start_tag('form', array(
    'method' => 'post',
    'action' => $PAGE->url->out(),
    'id' => 'altsolutions_form'
));

echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'timespent', 'id' => 'timespent', 'value' => '0'));
echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'altcount', 'id' => 'altcount', 'value' => '0'));

// Alternative approaches section.
echo $OUTPUT->box_start('generalbox alternatives-box');
echo $OUTPUT->heading(get_string('exploralternatives', 'altsolutions'), 4);

echo html_writer::start_div('alternatives-container', array('id' => 'alternatives-container'));

// Pre-populate with existing alternatives or show minimum required.
$minalt = max($altsolutions->minalternatives, count($alternatives));
for ($i = 0; $i < $minalt; $i++) {
    $altnum = $i + 1;
    $alt = isset($alternatives[$i]) ? $alternatives[$i] : null;

    echo html_writer::start_div('alternative-item card mb-3');
    echo html_writer::start_div('card-body');
    echo html_writer::tag('h5', get_string('alternativeapproach', 'altsolutions', $altnum), array('class' => 'card-title'));

    echo html_writer::tag('label', get_string('describeapproach', 'altsolutions'), array('for' => 'alt_desc_' . $i));
    echo html_writer::tag('textarea', $alt ? $alt->description : '', array(
        'name' => 'alt_desc_' . $i,
        'id' => 'alt_desc_' . $i,
        'rows' => 3,
        'class' => 'form-control mb-2',
        'required' => $i < $altsolutions->minalternatives ? 'required' : null
    ));

    echo html_writer::tag('label', get_string('explainreasoning', 'altsolutions'), array('for' => 'alt_reason_' . $i));
    echo html_writer::tag('textarea', $alt ? $alt->reasoning : '', array(
        'name' => 'alt_reason_' . $i,
        'id' => 'alt_reason_' . $i,
        'rows' => 2,
        'class' => 'form-control',
        'placeholder' => get_string('explainreasoning', 'altsolutions')
    ));

    echo html_writer::end_div();
    echo html_writer::end_div();
}

echo html_writer::end_div(); // alternatives-container

echo html_writer::tag('button', get_string('addanother', 'altsolutions'), array(
    'type' => 'button',
    'id' => 'add-alternative',
    'class' => 'btn btn-secondary mb-3'
));

echo $OUTPUT->box_end();

// Selected approach.
echo $OUTPUT->box_start('generalbox');
echo $OUTPUT->heading(get_string('selectapproach', 'altsolutions'), 4);
echo html_writer::tag('textarea', $attempt ? $attempt->approach : '', array(
    'name' => 'approach',
    'id' => 'approach',
    'rows' => 3,
    'class' => 'form-control',
    'required' => 'required',
    'placeholder' => get_string('selectapproach', 'altsolutions')
));
echo $OUTPUT->box_end();

// Solution.
echo $OUTPUT->box_start('generalbox');
echo $OUTPUT->heading(get_string('yoursolution', 'altsolutions'), 4);
echo html_writer::tag('textarea', $attempt ? $attempt->solution : '', array(
    'name' => 'solution',
    'id' => 'solution',
    'rows' => 6,
    'class' => 'form-control',
    'required' => 'required',
    'placeholder' => get_string('yoursolution', 'altsolutions')
));
echo $OUTPUT->box_end();

// Confidence level.
echo $OUTPUT->box_start('generalbox');
echo $OUTPUT->heading(get_string('confidencelevel', 'altsolutions'), 4);
$confidencelevels = array(
    1 => get_string('verylow', 'altsolutions'),
    2 => get_string('low', 'altsolutions'),
    3 => get_string('medium', 'altsolutions'),
    4 => get_string('high', 'altsolutions'),
    5 => get_string('veryhigh', 'altsolutions')
);
echo html_writer::start_div('form-group');
foreach ($confidencelevels as $value => $label) {
    $checked = ($attempt && $attempt->confidence == $value) || (!$attempt && $value == 3);
    echo html_writer::start_div('form-check form-check-inline');
    echo html_writer::empty_tag('input', array(
        'type' => 'radio',
        'name' => 'confidence',
        'id' => 'confidence_' . $value,
        'value' => $value,
        'class' => 'form-check-input',
        'checked' => $checked ? 'checked' : null
    ));
    echo html_writer::tag('label', $label, array(
        'for' => 'confidence_' . $value,
        'class' => 'form-check-label'
    ));
    echo html_writer::end_div();
}
echo html_writer::end_div();
echo $OUTPUT->box_end();

// Navigation buttons.
echo html_writer::start_div('form-group mt-3');
if ($stepnum > 1) {
    $prevurl = new moodle_url('/mod/altsolutions/solve.php', array('id' => $cm->id, 'step' => $stepnum - 1));
    echo html_writer::link($prevurl, get_string('previousstep', 'altsolutions'), array('class' => 'btn btn-secondary'));
    echo ' ';
}
echo html_writer::tag('button', get_string('savestep', 'altsolutions'), array(
    'type' => 'submit',
    'class' => 'btn btn-primary'
));
echo html_writer::end_div();

echo html_writer::end_tag('form');

echo $OUTPUT->footer();

// Inline JavaScript for time tracking and dynamic alternatives.
?>
<script>
var startTime = Date.now();
window.addEventListener('beforeunload', function() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timespent').value = elapsed;
});

// Initialize altcount
document.getElementById('altcount').value = document.querySelectorAll('.alternative-item').length;

// Add alternative button
document.getElementById('add-alternative').addEventListener('click', function() {
    var container = document.getElementById('alternatives-container');
    var count = container.querySelectorAll('.alternative-item').length;
    var newAlt = document.createElement('div');
    newAlt.className = 'alternative-item card mb-3';
    newAlt.innerHTML = `
        <div class="card-body">
            <h5 class="card-title"><?php echo get_string('alternativeapproach', 'altsolutions', '${count + 1}'); ?></h5>
            <label for="alt_desc_${count}"><?php echo get_string('describeapproach', 'altsolutions'); ?></label>
            <textarea name="alt_desc_${count}" id="alt_desc_${count}" rows="3" class="form-control mb-2"></textarea>
            <label for="alt_reason_${count}"><?php echo get_string('explainreasoning', 'altsolutions'); ?></label>
            <textarea name="alt_reason_${count}" id="alt_reason_${count}" rows="2" class="form-control"></textarea>
        </div>
    `;
    container.appendChild(newAlt);
    document.getElementById('altcount').value = count + 1;
});
</script>
