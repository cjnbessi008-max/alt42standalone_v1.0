<?php
// This file is part of Moodle - http://moodle.org/
//
// Alt42 Activity Module - Activity creation/editing form

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_alt42_mod_form extends moodleform_mod {

    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // General section
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Activity name
        $mform->addElement('text', 'name', get_string('alt42name', 'alt42'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Introduction
        $this->standard_intro_elements();

        // Alt42 specific settings
        $mform->addElement('header', 'alt42settings', get_string('alt42settings', 'alt42'));

        // Equation to solve
        $mform->addElement('text', 'equation', get_string('equation', 'alt42'), array('size' => '64'));
        $mform->setType('equation', PARAM_TEXT);
        $mform->addHelpButton('equation', 'equation', 'alt42');
        $mform->addRule('equation', null, 'required', null, 'client');

        // Difficulty level
        $difficulties = array(
            'easy' => get_string('difficulty_easy', 'alt42'),
            'medium' => get_string('difficulty_medium', 'alt42'),
            'hard' => get_string('difficulty_hard', 'alt42')
        );
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'alt42'), $difficulties);
        $mform->setDefault('difficulty', 'medium');

        // Expected answer
        $mform->addElement('text', 'answer', get_string('answer', 'alt42'), array('size' => '20'));
        $mform->setType('answer', PARAM_TEXT);
        $mform->addHelpButton('answer', 'answer', 'alt42');

        // Max attempts
        $mform->addElement('text', 'maxattempts', get_string('maxattempts', 'alt42'), array('size' => '6'));
        $mform->setType('maxattempts', PARAM_INT);
        $mform->setDefault('maxattempts', 0);
        $mform->addHelpButton('maxattempts', 'maxattempts', 'alt42');

        // Alt42 server URL
        $mform->addElement('text', 'serverurl', get_string('serverurl', 'alt42'), array('size' => '64'));
        $mform->setType('serverurl', PARAM_URL);
        $mform->setDefault('serverurl', 'http://localhost:3000');
        $mform->addHelpButton('serverurl', 'serverurl', 'alt42');

        // Standard course module elements
        $this->standard_coursemodule_elements();

        // Buttons
        $this->add_action_buttons();
    }

    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Validate equation format (basic check)
        if (empty($data['equation'])) {
            $errors['equation'] = get_string('required');
        }

        return $errors;
    }
}
