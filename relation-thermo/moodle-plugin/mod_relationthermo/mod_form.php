<?php
/**
 * Relation Thermo Activity Module - Module Form
 *
 * @package    mod_relationthermo
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_relationthermo_mod_form extends moodleform_mod {

    function definition() {
        global $CFG, $DB;

        $mform = $this->_form;

        // General settings
        $mform->addElement('header', 'general', get_string('general', 'form'));

        $mform->addElement('text', 'name', get_string('name'), array('size' => '64'));
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');

        $this->standard_intro_elements();

        // Relation Thermo specific settings
        $mform->addElement('header', 'relationthermoset', get_string('settings', 'mod_relationthermo'));

        // Number of problems
        $mform->addElement('text', 'problem_count', get_string('problem_count', 'mod_relationthermo'));
        $mform->setType('problem_count', PARAM_INT);
        $mform->setDefault('problem_count', 5);
        $mform->addHelpButton('problem_count', 'problem_count', 'mod_relationthermo');

        // Difficulty level
        $difficulties = array(
            1 => get_string('difficulty_easy', 'mod_relationthermo'),
            2 => get_string('difficulty_medium', 'mod_relationthermo'),
            3 => get_string('difficulty_hard', 'mod_relationthermo'),
        );
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'mod_relationthermo'), $difficulties);
        $mform->setDefault('difficulty', 1);

        // Show confidence meter (thermometer)
        $mform->addElement('advcheckbox', 'show_thermometer',
                          get_string('show_thermometer', 'mod_relationthermo'));
        $mform->setDefault('show_thermometer', 1);

        // Time limit (optional)
        $mform->addElement('duration', 'time_limit', get_string('time_limit', 'mod_relationthermo'),
                          array('optional' => true));

        // Standard coursemodule elements
        $this->standard_coursemodule_elements();

        // Standard buttons
        $this->add_action_buttons();
    }

    function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['problem_count'] < 1 || $data['problem_count'] > 50) {
            $errors['problem_count'] = get_string('error_problem_count_range', 'mod_relationthermo');
        }

        return $errors;
    }
}
