<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Geo Spiral visualization full page
 *
 * @package    block_geospiral
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

$sequenceid = required_param('sequenceid', PARAM_INT);
$courseid = required_param('courseid', PARAM_INT);

$course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
$sequence = $DB->get_record('block_geospiral_sequences', array('id' => $sequenceid), '*', MUST_EXIST);
$context = context_course::instance($courseid);

require_login($course);
require_capability('block/geospiral:view', $context);

$PAGE->set_url('/blocks/geospiral/visualize.php', array('sequenceid' => $sequenceid, 'courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_title($sequence->name);
$PAGE->set_heading($sequence->name);
$PAGE->set_pagelayout('embedded');

// Include CSS and JavaScript
$PAGE->requires->css('/blocks/geospiral/styles/geospiral.css');

// Output
echo $OUTPUT->header();

// Embed frontend app
$frontendUrl = $CFG->wwwroot . '/blocks/geospiral/frontend/index.html';
echo html_writer::start_div('geospiral-embed-container');
echo html_writer::tag('iframe', '', array(
    'src' => $frontendUrl . '?sequenceid=' . $sequenceid . '&courseid=' . $courseid,
    'class' => 'geospiral-embed-frame',
    'width' => '100%',
    'height' => '800px',
    'frameborder' => '0'
));
echo html_writer::end_div();

echo $OUTPUT->footer();
