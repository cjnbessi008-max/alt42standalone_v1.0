<?php
// This file is part of Moodle - http://moodle.org/
//
// Activity settings form for Sequence Pearls

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_sequencepearls_mod_form extends moodleform_mod {

    function definition() {
        global $CFG;

        $mform = $this->_form;

        // General section
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Activity name
        $mform->addElement('text', 'name', get_string('sequencepearls_name', 'sequencepearls'),
            array('size' => '64'));
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Introduction
        $this->standard_intro_elements();

        // Sequence type
        $sequenceTypes = array(
            'arithmetic' => get_string('arithmetic', 'sequencepearls'),
            'geometric' => get_string('geometric', 'sequencepearls'),
            'fibonacci' => get_string('fibonacci', 'sequencepearls'),
        );
        $mform->addElement('select', 'sequence_type', get_string('sequence_type', 'sequencepearls'),
            $sequenceTypes);
        $mform->addHelpButton('sequence_type', 'sequence_type', 'sequencepearls');
        $mform->setDefault('sequence_type', 'arithmetic');

        // Difficulty level
        $difficulties = array(
            1 => '1 - ' . get_string('easy', 'core'),
            2 => '2',
            3 => '3 - ' . get_string('medium', 'core'),
            4 => '4',
            5 => '5 - ' . get_string('hard', 'core')
        );
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'sequencepearls'),
            $difficulties);
        $mform->addHelpButton('difficulty', 'difficulty', 'sequencepearls');
        $mform->setDefault('difficulty', 3);

        // Number of problems
        $mform->addElement('text', 'num_problems', get_string('num_problems', 'sequencepearls'),
            array('size' => '10'));
        $mform->setType('num_problems', PARAM_INT);
        $mform->addHelpButton('num_problems', 'num_problems', 'sequencepearls');
        $mform->setDefault('num_problems', 10);
        $mform->addRule('num_problems', null, 'required', null, 'client');
        $mform->addRule('num_problems', null, 'numeric', null, 'client');

        // Standard elements
        $this->standard_coursemodule_elements();

        // Buttons
        $this->add_action_buttons();
    }

    function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['num_problems'] < 1 || $data['num_problems'] > 100) {
            $errors['num_problems'] = get_string('error', 'core') . ': Must be between 1 and 100';
        }

        return $errors;
    }
}
