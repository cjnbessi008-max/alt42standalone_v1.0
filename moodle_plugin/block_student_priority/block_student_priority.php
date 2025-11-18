<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Main block class for Student Priority Selection.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Student Priority Selection block class
 */
class block_student_priority extends block_base {

    /**
     * Initialize the block
     */
    public function init() {
        $this->title = get_string('pluginname', 'block_student_priority');
    }

    /**
     * Allow the block to have a configuration page
     */
    public function has_config() {
        return true;
    }

    /**
     * Controls whether the block is configurable
     */
    public function instance_allow_config() {
        return true;
    }

    /**
     * Locations where block can be displayed
     */
    public function applicable_formats() {
        return array(
            'course-view' => true,
            'my' => true,
            'site' => true
        );
    }

    /**
     * Generate the block content
     */
    public function get_content() {
        global $DB, $USER, $OUTPUT, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->text = '';
        $this->content->footer = '';

        // Check if user is logged in
        if (!isloggedin() || isguestuser()) {
            $this->content->text = get_string('pleaselogin', 'block_student_priority');
            return $this->content;
        }

        // Get available learning steps
        $steps = $this->get_learning_steps();

        // Get student's current priority selection
        $current_priority = $DB->get_record('block_student_priority', array(
            'userid' => $USER->id,
            'courseid' => $PAGE->course->id
        ));

        // Include required CSS
        $PAGE->requires->css('/blocks/student_priority/styles.css');

        // Include required JavaScript
        $PAGE->requires->js('/blocks/student_priority/module.js');
        $PAGE->requires->js_init_call('init_student_priority', array(
            $USER->id,
            $PAGE->course->id,
            sesskey()
        ));

        // Build the content
        $this->content->text = $this->render_priority_selector($steps, $current_priority);

        return $this->content;
    }

    /**
     * Get available learning steps from course or configuration
     *
     * @return array Array of learning steps
     */
    private function get_learning_steps() {
        global $DB, $PAGE;

        // Check for custom steps in block configuration
        if (isset($this->config->custom_steps) && !empty($this->config->custom_steps)) {
            $steps_text = $this->config->custom_steps;
            $steps_array = explode("\n", $steps_text);
            $steps = array();
            foreach ($steps_array as $index => $step) {
                $step = trim($step);
                if (!empty($step)) {
                    $steps[] = array(
                        'id' => $index + 1,
                        'name' => $step,
                        'description' => ''
                    );
                }
            }
            return $steps;
        }

        // Default learning steps for Touch Math Academy
        return array(
            array(
                'id' => 1,
                'name' => get_string('step1_name', 'block_student_priority'),
                'description' => get_string('step1_desc', 'block_student_priority')
            ),
            array(
                'id' => 2,
                'name' => get_string('step2_name', 'block_student_priority'),
                'description' => get_string('step2_desc', 'block_student_priority')
            ),
            array(
                'id' => 3,
                'name' => get_string('step3_name', 'block_student_priority'),
                'description' => get_string('step3_desc', 'block_student_priority')
            ),
            array(
                'id' => 4,
                'name' => get_string('step4_name', 'block_student_priority'),
                'description' => get_string('step4_desc', 'block_student_priority')
            ),
            array(
                'id' => 5,
                'name' => get_string('step5_name', 'block_student_priority'),
                'description' => get_string('step5_desc', 'block_student_priority')
            )
        );
    }

    /**
     * Render the priority selector HTML
     *
     * @param array $steps Available learning steps
     * @param object|bool $current_priority Current priority selection
     * @return string HTML content
     */
    private function render_priority_selector($steps, $current_priority) {
        $html = '';

        $html .= html_writer::start_div('student-priority-container');

        // Header
        $html .= html_writer::tag('h3', get_string('select_priority_header', 'block_student_priority'));
        $html .= html_writer::tag('p', get_string('select_priority_instruction', 'block_student_priority'),
                                  array('class' => 'instruction-text'));

        // Current selection display
        if ($current_priority && isset($current_priority->priority_step)) {
            $html .= html_writer::start_div('current-selection alert alert-info');
            $html .= html_writer::tag('strong', get_string('current_priority', 'block_student_priority') . ': ');
            $html .= $this->get_step_name_by_id($steps, $current_priority->priority_step);
            $html .= html_writer::end_div();
        }

        // Priority selection cards
        $html .= html_writer::start_div('priority-steps-grid');

        foreach ($steps as $step) {
            $is_selected = $current_priority &&
                          isset($current_priority->priority_step) &&
                          $current_priority->priority_step == $step['id'];

            $card_classes = 'priority-card';
            if ($is_selected) {
                $card_classes .= ' selected';
            }

            $html .= html_writer::start_div($card_classes, array(
                'data-step-id' => $step['id'],
                'onclick' => 'selectPriorityStep(' . $step['id'] . ')'
            ));

            $html .= html_writer::tag('h4', $step['name'], array('class' => 'step-name'));

            if (!empty($step['description'])) {
                $html .= html_writer::tag('p', $step['description'], array('class' => 'step-description'));
            }

            if ($is_selected) {
                $html .= html_writer::tag('span', '✓ ' . get_string('selected', 'block_student_priority'),
                                         array('class' => 'selected-badge'));
            }

            $html .= html_writer::end_div();
        }

        $html .= html_writer::end_div(); // priority-steps-grid

        // Status message area
        $html .= html_writer::div('', 'priority-status-message', array('id' => 'priority-status'));

        $html .= html_writer::end_div(); // student-priority-container

        return $html;
    }

    /**
     * Get step name by ID
     *
     * @param array $steps Array of steps
     * @param int $step_id Step ID
     * @return string Step name
     */
    private function get_step_name_by_id($steps, $step_id) {
        foreach ($steps as $step) {
            if ($step['id'] == $step_id) {
                return $step['name'];
            }
        }
        return get_string('unknown_step', 'block_student_priority');
    }
}
