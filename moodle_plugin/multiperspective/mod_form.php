<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The main multiperspective configuration form
 *
 * @package    mod_multiperspective
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_multiperspective_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('multiperspectivename', 'multiperspective'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'multiperspectivename', 'multiperspective');

        // Adding the standard "intro" and "introformat" fields
        $this->standard_intro_elements();

        // Perspective requirements
        $mform->addElement('header', 'perspectivesettings', get_string('perspectives', 'multiperspective'));

        // Minimum perspectives required
        $options = array();
        for ($i = 1; $i <= 10; $i++) {
            $options[$i] = $i;
        }
        $mform->addElement('select', 'min_perspectives', get_string('min_perspectives', 'multiperspective'), $options);
        $mform->setDefault('min_perspectives', 2);
        $mform->addHelpButton('min_perspectives', 'min_perspectives', 'multiperspective');

        // Require all perspectives
        $mform->addElement('advcheckbox', 'require_all_perspectives',
            get_string('require_all_perspectives', 'multiperspective'));
        $mform->setDefault('require_all_perspectives', 0);
        $mform->addHelpButton('require_all_perspectives', 'require_all_perspectives', 'multiperspective');

        // Attempt settings
        $mform->addElement('header', 'attemptsettings', get_string('attempts', 'multiperspective'));

        // Allow retry
        $mform->addElement('advcheckbox', 'allow_retry', get_string('allow_retry', 'multiperspective'));
        $mform->setDefault('allow_retry', 1);
        $mform->addHelpButton('allow_retry', 'allow_retry', 'multiperspective');

        // Maximum attempts
        $attemptoptions = array(
            0 => get_string('unlimited'),
            1 => '1',
            2 => '2',
            3 => '3',
            4 => '4',
            5 => '5',
            10 => '10',
            20 => '20'
        );
        $mform->addElement('select', 'max_attempts', get_string('max_attempts', 'multiperspective'), $attemptoptions);
        $mform->setDefault('max_attempts', 0);
        $mform->addHelpButton('max_attempts', 'max_attempts', 'multiperspective');
        $mform->disabledIf('max_attempts', 'allow_retry');

        // Grade settings
        $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Enforce validation rules
     *
     * @param array $data array of ("fieldname"=>value) of submitted data
     * @param array $files array of uploaded files "element_name"=>tmp_file_path
     * @return array of "element_name"=>"error_description" if there are errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if (!empty($data['require_all_perspectives']) && !empty($data['min_perspectives'])) {
            // If require_all_perspectives is checked, min_perspectives is ignored
            // This is fine, no error needed
        }

        return $errors;
    }
}
