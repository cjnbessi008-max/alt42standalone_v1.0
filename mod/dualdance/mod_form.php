<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The main dualdance configuration form
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_dualdance_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('dualdancename', 'dualdance'), array('size'=>'64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields
        if ($CFG->branch >= 29) {
            $this->standard_intro_elements();
        } else {
            $this->add_intro_editor();
        }

        // Dual Dance specific settings
        $mform->addElement('header', 'dualdancesettings', get_string('dualdancesettings', 'dualdance'));

        // Difficulty level
        $difficulties = array(
            1 => get_string('difficulty_1', 'dualdance'),
            2 => get_string('difficulty_2', 'dualdance'),
            3 => get_string('difficulty_3', 'dualdance'),
            4 => get_string('difficulty_4', 'dualdance'),
            5 => get_string('difficulty_5', 'dualdance')
        );
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'dualdance'), $difficulties);
        $mform->setDefault('difficulty', 1);
        $mform->addHelpButton('difficulty', 'difficulty', 'dualdance');

        // Exponential base range
        $mform->addElement('text', 'exp_base_min', get_string('exp_base_min', 'dualdance'), array('size'=>'10'));
        $mform->setType('exp_base_min', PARAM_FLOAT);
        $mform->setDefault('exp_base_min', 1.5);
        $mform->addRule('exp_base_min', null, 'required', null, 'client');
        $mform->addRule('exp_base_min', null, 'numeric', null, 'client');

        $mform->addElement('text', 'exp_base_max', get_string('exp_base_max', 'dualdance'), array('size'=>'10'));
        $mform->setType('exp_base_max', PARAM_FLOAT);
        $mform->setDefault('exp_base_max', 3.0);
        $mform->addRule('exp_base_max', null, 'required', null, 'client');
        $mform->addRule('exp_base_max', null, 'numeric', null, 'client');

        // Logarithm base range
        $mform->addElement('text', 'log_base_min', get_string('log_base_min', 'dualdance'), array('size'=>'10'));
        $mform->setType('log_base_min', PARAM_FLOAT);
        $mform->setDefault('log_base_min', 2.0);
        $mform->addRule('log_base_min', null, 'required', null, 'client');
        $mform->addRule('log_base_min', null, 'numeric', null, 'client');

        $mform->addElement('text', 'log_base_max', get_string('log_base_max', 'dualdance'), array('size'=>'10'));
        $mform->setType('log_base_max', PARAM_FLOAT);
        $mform->setDefault('log_base_max', 10.0);
        $mform->addRule('log_base_max', null, 'required', null, 'client');
        $mform->addRule('log_base_max', null, 'numeric', null, 'client');

        // Animation speed
        $speeds = array(
            1 => get_string('speed_very_slow', 'dualdance'),
            2 => get_string('speed_slow', 'dualdance'),
            3 => get_string('speed_normal', 'dualdance'),
            4 => get_string('speed_fast', 'dualdance'),
            5 => get_string('speed_very_fast', 'dualdance')
        );
        $mform->addElement('select', 'animation_speed', get_string('animation_speed', 'dualdance'), $speeds);
        $mform->setDefault('animation_speed', 2);
        $mform->addHelpButton('animation_speed', 'animation_speed', 'dualdance');

        // Add standard grading elements
        $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Add any custom completion rules to the form.
     *
     * @return array Array of string IDs of added items, empty array if none
     */
    public function add_completion_rules() {
        $mform =& $this->_form;

        $mform->addElement('text', 'completionattempts', get_string('completionattempts', 'dualdance'), array('size' => 3));
        $mform->setType('completionattempts', PARAM_INT);
        $mform->setDefault('completionattempts', 5);

        return array('completionattempts');
    }

    /**
     * Determines if completion is enabled for this module.
     *
     * @param array $data
     * @return bool
     */
    public function completion_rule_enabled($data) {
        return (!empty($data['completionattempts']));
    }

    /**
     * Perform minimal validation on the settings form
     * @param array $data
     * @param array $files
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        // Validate exponential base range
        if ($data['exp_base_min'] >= $data['exp_base_max']) {
            $errors['exp_base_max'] = get_string('error_base_range', 'dualdance');
        }

        // Validate logarithm base range
        if ($data['log_base_min'] >= $data['log_base_max']) {
            $errors['log_base_max'] = get_string('error_base_range', 'dualdance');
        }

        // Validate base values > 1
        if ($data['exp_base_min'] <= 1) {
            $errors['exp_base_min'] = get_string('error_base_greater_than_one', 'dualdance');
        }
        if ($data['log_base_min'] <= 1) {
            $errors['log_base_min'] = get_string('error_base_greater_than_one', 'dualdance');
        }

        return $errors;
    }
}
