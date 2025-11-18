<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_smoothsteps_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('smoothstepsname', 'smoothsteps'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Probability distribution type
        $mform->addElement('select', 'distributiontype', get_string('distributiontype', 'smoothsteps'),
            array(
                'both' => get_string('both', 'smoothsteps'),
                'continuous' => get_string('continuous', 'smoothsteps'),
                'discrete' => get_string('discrete', 'smoothsteps')
            )
        );
        $mform->setDefault('distributiontype', 'both');
        $mform->addHelpButton('distributiontype', 'distributiontype', 'smoothsteps');

        // Animation speed
        $mform->addElement('select', 'animationspeed', get_string('animationspeed', 'smoothsteps'),
            array(
                'slow' => get_string('slow', 'smoothsteps'),
                'medium' => get_string('medium', 'smoothsteps'),
                'fast' => get_string('fast', 'smoothsteps')
            )
        );
        $mform->setDefault('animationspeed', 'medium');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }
}
