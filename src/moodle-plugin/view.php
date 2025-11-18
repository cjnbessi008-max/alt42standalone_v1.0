<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Geo Spiral visualization view page
 *
 * @package    block_geospiral
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

$courseid = required_param('courseid', PARAM_INT);
$userid = optional_param('userid', $USER->id, PARAM_INT);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_capability('block/geospiral:view', $context);

$PAGE->set_url('/blocks/geospiral/view.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('pagetitle', 'block_geospiral'));
$PAGE->set_heading($course->fullname);

// Load sequences
$sequences = $DB->get_records('block_geospiral_sequences', null, 'name ASC');

// Load user progress
$progress = array();
if ($sequences) {
    foreach ($sequences as $seq) {
        $userProgress = $DB->get_record('block_geospiral_progress', array(
            'userid' => $userid,
            'sequenceid' => $seq->id,
            'courseid' => $courseid
        ));
        $progress[$seq->id] = $userProgress ?: null;
    }
}

// Output header
echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('pagetitle', 'block_geospiral'));

// Check if there are sequences
if (empty($sequences)) {
    echo html_writer::tag('p', get_string('nosequences', 'block_geospiral'), array('class' => 'alert alert-warning'));
} else {
    // Output sequence list
    echo html_writer::start_div('geospiral-sequences-container');
    echo html_writer::tag('h3', get_string('sequencelist', 'block_geospiral'));

    echo html_writer::start_tag('ul', array('class' => 'geospiral-sequence-list'));
    foreach ($sequences as $sequence) {
        $progressData = $progress[$sequence->id];
        $status = $progressData ? $progressData->completion_status : 'not_started';
        $statusClass = 'status-' . $status;

        echo html_writer::start_tag('li', array('class' => 'sequence-item ' . $statusClass));
        echo html_writer::tag('strong', $sequence->name);
        echo html_writer::tag('p', $sequence->description);

        $details = array();
        $details[] = get_string('sequencetype:' . $sequence->sequence_type, 'block_geospiral');
        $details[] = get_string('spiraltype:' . $sequence->spiral_type, 'block_geospiral');
        if ($sequence->common_ratio) {
            $details[] = "공비: " . $sequence->common_ratio;
        }
        $details[] = "항수: " . $sequence->num_terms;

        echo html_writer::tag('p', implode(' | ', $details), array('class' => 'sequence-details'));

        // View button
        $viewUrl = new moodle_url('/blocks/geospiral/visualize.php', array(
            'sequenceid' => $sequence->id,
            'courseid' => $courseid
        ));
        echo html_writer::link($viewUrl, '시각화 보기', array('class' => 'btn btn-primary btn-sm'));

        echo html_writer::end_tag('li');
    }
    echo html_writer::end_tag('ul');
    echo html_writer::end_div();
}

// Output footer
echo $OUTPUT->footer();
