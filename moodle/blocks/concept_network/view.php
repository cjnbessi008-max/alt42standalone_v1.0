<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/blocks/concept_network/classes/network_generator.php');

$courseid = required_param('courseid', PARAM_INT);
$studentid = optional_param('studentid', $USER->id, PARAM_INT);

require_login($courseid);

$context = context_course::instance($courseid);
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/blocks/concept_network/view.php', array(
    'courseid' => $courseid,
    'studentid' => $studentid
)));
$PAGE->set_title(get_string('pluginname', 'block_concept_network'));
$PAGE->set_heading(get_string('pluginname', 'block_concept_network'));

// Check capabilities
$canview = has_capability('block/concept_network:view', $context);
$canviewall = has_capability('block/concept_network:viewall', $context);

if (!$canview && !$canviewall) {
    print_error('error_nocapability', 'block_concept_network');
}

// Students can only view their own network
if (!$canviewall && $studentid != $USER->id) {
    print_error('error_nocapability', 'block_concept_network');
}

// Load JavaScript
$PAGE->requires->js_call_amd('block_concept_network/network_visualizer', 'init', array(
    'courseid' => $courseid,
    'studentid' => $studentid,
    'blockid' => 'fullpage'
));

// Get student info
$student = $DB->get_record('user', array('id' => $studentid), '*', MUST_EXIST);

echo $OUTPUT->header();

echo html_writer::start_div('concept-network-full');

// Header with student info
echo html_writer::tag('h2',
    get_string('pluginname', 'block_concept_network') . ' - ' . fullname($student)
);

// Get network data for stats
$generator = new \block_concept_network\network_generator($courseid, $studentid);
$network = $generator->get_or_generate_network();

// Display statistics
if ($network && isset($network->stats)) {
    echo html_writer::start_div('concept-network-stats card p-3 mb-3');
    echo html_writer::tag('h4', get_string('statistics', 'block_concept_network'));

    $table = new html_table();
    $table->attributes['class'] = 'table table-sm';
    $table->data = array(
        array(get_string('totalconcepts', 'block_concept_network', ''), $network->stats->total_concepts),
        array(get_string('totalrelationships', 'block_concept_network'), $network->stats->total_relationships),
        array(get_string('avgmastery', 'block_concept_network', ''), round($network->stats->avg_mastery, 1) . '%'),
        array(get_string('minmastery', 'block_concept_network'), round($network->stats->min_mastery, 1) . '%'),
        array(get_string('maxmastery', 'block_concept_network'), round($network->stats->max_mastery, 1) . '%')
    );
    echo html_writer::table($table);

    echo html_writer::end_div();
}

// Canvas for network visualization
echo html_writer::tag('div', '', array(
    'id' => 'network-canvas-fullpage',
    'class' => 'concept-network-canvas',
    'style' => 'width: 100%; height: 700px; border: 1px solid #ddd; background: #fafafa;'
));

// Controls
echo html_writer::start_div('concept-network-controls mt-3');

if ($canviewall) {
    // Regenerate button
    $regenerateurl = new moodle_url('/blocks/concept_network/ajax.php', array(
        'action' => 'regenerate_network',
        'courseid' => $courseid,
        'studentid' => $studentid,
        'sesskey' => sesskey()
    ));
    echo html_writer::link($regenerateurl,
        get_string('regenerate', 'block_concept_network'),
        array('class' => 'btn btn-primary', 'id' => 'regenerate-network-btn')
    );

    // Student selector
    if ($canviewall) {
        echo ' ';
        $studenturl = new moodle_url('/blocks/concept_network/view.php', array('courseid' => $courseid));
        echo html_writer::link($studenturl . '&studentid=',
            get_string('selectstudent', 'block_concept_network'),
            array('class' => 'btn btn-secondary')
        );
    }
}

// Back to course button
$courseurl = new moodle_url('/course/view.php', array('id' => $courseid));
echo ' ' . html_writer::link($courseurl,
    get_string('backtocourse', 'core'),
    array('class' => 'btn btn-secondary')
);

echo html_writer::end_div();

// Concept list table
if ($network && !empty($network->nodes)) {
    echo html_writer::tag('h3', get_string('conceptlist', 'block_concept_network'), array('class' => 'mt-4'));

    $table = new html_table();
    $table->attributes['class'] = 'table table-striped generaltable';
    $table->head = array(
        get_string('conceptname', 'block_concept_network'),
        get_string('concepttype', 'block_concept_network'),
        get_string('masterylevel', 'block_concept_network'),
        get_string('attempts', 'block_concept_network'),
        get_string('avgscore', 'block_concept_network')
    );

    foreach ($network->nodes as $node) {
        $masteryclass = '';
        if ($node->mastery_level >= 70) {
            $masteryclass = 'badge badge-success';
        } else if ($node->mastery_level >= 40) {
            $masteryclass = 'badge badge-warning';
        } else {
            $masteryclass = 'badge badge-danger';
        }

        $table->data[] = array(
            $node->name,
            ucfirst($node->type),
            html_writer::tag('span', round($node->mastery_level, 1) . '%', array('class' => $masteryclass)),
            $node->total_attempts,
            round($node->avg_score, 1) . '%'
        );
    }

    echo html_writer::table($table);
}

echo html_writer::end_div();

echo $OUTPUT->footer();
