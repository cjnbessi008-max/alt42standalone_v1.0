<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_samplinggame_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Activity name
        $mform->addElement('text', 'name', get_string('samplinggamename', 'mod_samplinggame'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'samplinggamename', 'mod_samplinggame');

        // Activity description
        $this->standard_intro_elements();

        // Game settings fieldset
        $mform->addElement('header', 'gamesettings', get_string('settings', 'mod_samplinggame'));

        // Population size
        $mform->addElement('text', 'population_size', get_string('populationsize', 'mod_samplinggame'), array('size' => '10'));
        $mform->setType('population_size', PARAM_INT);
        $mform->setDefault('population_size', 100);
        $mform->addRule('population_size', null, 'required', null, 'client');
        $mform->addRule('population_size', null, 'numeric', null, 'client');
        $mform->addHelpButton('population_size', 'populationsize', 'mod_samplinggame');

        // Sample size
        $mform->addElement('text', 'sample_size', get_string('samplesize', 'mod_samplinggame'), array('size' => '10'));
        $mform->setType('sample_size', PARAM_INT);
        $mform->setDefault('sample_size', 10);
        $mform->addRule('sample_size', null, 'required', null, 'client');
        $mform->addRule('sample_size', null, 'numeric', null, 'client');
        $mform->addHelpButton('sample_size', 'samplesize', 'mod_samplinggame');

        // Sampling method
        $methods = array(
            'simple_random' => get_string('simple_random', 'mod_samplinggame'),
            'systematic' => get_string('systematic', 'mod_samplinggame'),
            'stratified' => get_string('stratified', 'mod_samplinggame'),
            'cluster' => get_string('cluster', 'mod_samplinggame')
        );
        $mform->addElement('select', 'sampling_method', get_string('samplingmethod', 'mod_samplinggame'), $methods);
        $mform->setDefault('sampling_method', 'simple_random');
        $mform->addHelpButton('sampling_method', 'samplingmethod', 'mod_samplinggame');

        // Game scenario
        $scenarios = array(
            'students' => get_string('students', 'mod_samplinggame'),
            'balls' => get_string('balls', 'mod_samplinggame'),
            'candies' => get_string('candies', 'mod_samplinggame'),
            'cards' => get_string('cards', 'mod_samplinggame')
        );
        $mform->addElement('select', 'game_scenario', get_string('gamescenario', 'mod_samplinggame'), $scenarios);
        $mform->setDefault('game_scenario', 'students');
        $mform->addHelpButton('game_scenario', 'gamescenario', 'mod_samplinggame');

        // Time limit (optional)
        $mform->addElement('text', 'time_limit', get_string('timelimit', 'mod_samplinggame'), array('size' => '10'));
        $mform->setType('time_limit', PARAM_INT);
        $mform->addHelpButton('time_limit', 'timelimit', 'mod_samplinggame');

        // Grade settings
        $this->standard_grading_coursemodule_elements();

        // Standard coursemodule elements
        $this->standard_coursemodule_elements();

        // Buttons
        $this->add_action_buttons();
    }

    /**
     * Form validation
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Validate that sample size is not greater than population size
        if ($data['sample_size'] > $data['population_size']) {
            $errors['sample_size'] = get_string('error_samplesizetoobig', 'mod_samplinggame');
        }

        // Validate that population size is reasonable
        if ($data['population_size'] < 10) {
            $errors['population_size'] = get_string('error_populationtoosmall', 'mod_samplinggame');
        }

        if ($data['population_size'] > 1000) {
            $errors['population_size'] = get_string('error_populationtoobig', 'mod_samplinggame');
        }

        // Validate time limit
        if (!empty($data['time_limit']) && $data['time_limit'] < 30) {
            $errors['time_limit'] = get_string('error_timelimittoosmall', 'mod_samplinggame');
        }

        return $errors;
    }
}
