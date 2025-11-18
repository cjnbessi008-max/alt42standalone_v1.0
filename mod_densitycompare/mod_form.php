<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_densitycompare_mod_form extends moodleform_mod {

    public function definition() {
        global $CFG;
        $mform = $this->_form;

        // General section
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Name
        $mform->addElement('text', 'name', get_string('densitycomparename', 'densitycompare'),
                          array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Introduction
        $this->standard_intro_elements();

        // Standard coursemodule elements
        $this->standard_coursemodule_elements();

        // Buttons
        $this->add_action_buttons();
    }
}
