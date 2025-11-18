<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Activity configuration form
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_minitrial_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are shown.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Activity name
        $mform->addElement('text', 'name', get_string('minitrial:name', 'minitrial'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Description
        $this->standard_intro_elements();

        // Game type selection
        $mform->addElement('header', 'gamesettings', get_string('gametype', 'minitrial'));

        $gametypes = array(
            'dice' => get_string('gametype_dice', 'minitrial'),
            'coin' => get_string('gametype_coin', 'minitrial'),
            'card' => get_string('gametype_card', 'minitrial'),
            'spinner' => get_string('gametype_spinner', 'minitrial')
        );

        $mform->addElement('select', 'game_type', get_string('gametype', 'minitrial'), $gametypes);
        $mform->addHelpButton('game_type', 'gametype', 'minitrial');
        $mform->setDefault('game_type', 'dice');

        // Trials required
        $mform->addElement('text', 'trials_required', get_string('trialsrequired', 'minitrial'));
        $mform->setType('trials_required', PARAM_INT);
        $mform->addHelpButton('trials_required', 'trialsrequired', 'minitrial');
        $mform->setDefault('trials_required', 10);
        $mform->addRule('trials_required', null, 'required', null, 'client');
        $mform->addRule('trials_required', null, 'numeric', null, 'client');

        // Grade settings
        $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }

    /**
     * Validate the form data
     *
     * @param array $data array of form data
     * @param array $files array of uploaded files
     * @return array of errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if (isset($data['trials_required']) && $data['trials_required'] < 1) {
            $errors['trials_required'] = get_string('error_invalidtrial', 'minitrial');
        }

        return $errors;
    }
}
