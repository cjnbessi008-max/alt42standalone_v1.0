<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/blocks/concept_network/classes/network_generator.php');

/**
 * Concept Network block
 *
 * Displays student-based concept networks generated from learning activities
 *
 * @package    block_concept_network
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class block_concept_network extends block_base {

    /**
     * Initialize the block
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_concept_network');
    }

    /**
     * Allows the block to be added multiple times to a course
     */
    public function instance_allow_multiple() {
        return false;
    }

    /**
     * Block has configuration
     */
    public function has_config() {
        return true;
    }

    /**
     * Locations where block can be displayed
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'site' => false,
            'mod' => false,
            'my' => true
        );
    }

    /**
     * Generate content for the block
     */
    public function get_content() {
        global $USER, $COURSE, $OUTPUT, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        // Check if user is in a course context
        if ($COURSE->id == SITEID) {
            $this->content->text = get_string('notincourse', 'block_concept_network');
            return $this->content;
        }

        $context = context_course::instance($COURSE->id);

        // Check capabilities
        $canview = has_capability('block/concept_network:view', $context);
        $canviewall = has_capability('block/concept_network:viewall', $context);

        if (!$canview && !$canviewall) {
            return $this->content;
        }

        // Determine which student's network to show
        $studentid = $USER->id;
        if ($canviewall && optional_param('studentid', 0, PARAM_INT)) {
            $studentid = optional_param('studentid', 0, PARAM_INT);
        }

        // Load JavaScript for visualization
        $PAGE->requires->js_call_amd('block_concept_network/network_visualizer', 'init', array(
            'courseid' => $COURSE->id,
            'studentid' => $studentid,
            'blockid' => $this->instance->id
        ));

        // Get network data
        $generator = new \block_concept_network\network_generator($COURSE->id, $studentid);
        $network = $generator->get_or_generate_network();

        // Build block content
        $this->content->text .= html_writer::start_div('concept-network-container', array(
            'id' => 'concept-network-' . $this->instance->id
        ));

        // Summary stats
        if ($network && isset($network->stats)) {
            $this->content->text .= html_writer::start_div('concept-network-stats');
            $this->content->text .= html_writer::tag('p',
                get_string('totalconcepts', 'block_concept_network', $network->stats->total_concepts)
            );
            $this->content->text .= html_writer::tag('p',
                get_string('avgmastery', 'block_concept_network', round($network->stats->avg_mastery, 1))
            );
            $this->content->text .= html_writer::end_div();
        }

        // Network visualization canvas
        $this->content->text .= html_writer::tag('div', '', array(
            'id' => 'network-canvas-' . $this->instance->id,
            'class' => 'concept-network-canvas',
            'style' => 'width: 100%; height: 400px; border: 1px solid #ddd;'
        ));

        $this->content->text .= html_writer::end_div();

        // Footer with view full network link
        $url = new moodle_url('/blocks/concept_network/view.php', array(
            'courseid' => $COURSE->id,
            'studentid' => $studentid
        ));
        $this->content->footer = html_writer::link($url,
            get_string('viewfullnetwork', 'block_concept_network'),
            array('class' => 'btn btn-secondary')
        );

        // Regenerate button for teachers
        if ($canviewall) {
            $regenerateurl = new moodle_url('/blocks/concept_network/ajax.php', array(
                'action' => 'regenerate_network',
                'courseid' => $COURSE->id,
                'studentid' => $studentid,
                'sesskey' => sesskey()
            ));
            $this->content->footer .= ' ' . html_writer::link($regenerateurl,
                get_string('regenerate', 'block_concept_network'),
                array('class' => 'btn btn-primary', 'id' => 'regenerate-network-btn')
            );
        }

        return $this->content;
    }

    /**
     * Serialize and store instance data
     */
    public function instance_config_save($data, $nolongerused = false) {
        $config = clone($data);
        parent::instance_config_save($config, $nolongerused);
    }
}
