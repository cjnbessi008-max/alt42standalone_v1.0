<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * The main invariantfinder configuration form
 *
 * @package    mod_invariantfinder
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_invariantfinder_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('invariantfindername', 'invariantfinder'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields
        $this->standard_intro_elements();

        // Shape type selection
        $mform->addElement('header', 'shapesettings', get_string('shapesettings', 'invariantfinder'));

        $shapetypes = array(
            'triangle' => get_string('triangle', 'invariantfinder'),
            'rectangle' => get_string('rectangle', 'invariantfinder'),
            'circle' => get_string('circle', 'invariantfinder'),
            'parallelogram' => get_string('parallelogram', 'invariantfinder'),
        );
        $mform->addElement('select', 'shape_type', get_string('shapetype', 'invariantfinder'), $shapetypes);
        $mform->addHelpButton('shape_type', 'shapetype', 'invariantfinder');
        $mform->setDefault('shape_type', 'triangle');

        // Difficulty level
        $difficulties = array(
            1 => get_string('difficulty1', 'invariantfinder'),
            2 => get_string('difficulty2', 'invariantfinder'),
            3 => get_string('difficulty3', 'invariantfinder'),
            4 => get_string('difficulty4', 'invariantfinder'),
            5 => get_string('difficulty5', 'invariantfinder'),
        );
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'invariantfinder'), $difficulties);
        $mform->addHelpButton('difficulty', 'difficulty', 'invariantfinder');
        $mform->setDefault('difficulty', 1);

        // Show hints
        $mform->addElement('advcheckbox', 'show_hints', get_string('showhints', 'invariantfinder'));
        $mform->addHelpButton('show_hints', 'showhints', 'invariantfinder');
        $mform->setDefault('show_hints', 1);

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }
}
