<?php
/**
 * Module instance settings form
 *
 * @package    mod_arearecom
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_arearecom_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are shown.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('arearec_name', 'mod_arearecom'), array('size' => '64'));

        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }

        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Activity settings
        $mform->addElement('header', 'areasettings', get_string('settings', 'mod_arearecom'));

        // Difficulty level
        $difficulties = array(
            0 => get_string('all_difficulties', 'mod_arearecom'),
            1 => get_string('difficulty_easy', 'mod_arearecom'),
            2 => get_string('difficulty_medium', 'mod_arearecom'),
            3 => get_string('difficulty_hard', 'mod_arearecom')
        );
        $mform->addElement('select', 'difficulty_level', get_string('difficulty_level', 'mod_arearecom'), $difficulties);
        $mform->setDefault('difficulty_level', 0);
        $mform->addHelpButton('difficulty_level', 'difficulty_level', 'mod_arearecom');

        // Max attempts
        $mform->addElement('text', 'max_attempts', get_string('max_attempts', 'mod_arearecom'));
        $mform->setType('max_attempts', PARAM_INT);
        $mform->setDefault('max_attempts', 5);
        $mform->addHelpButton('max_attempts', 'max_attempts', 'mod_arearecom');

        // Enable hints
        $mform->addElement('advcheckbox', 'enable_hints', get_string('enable_hints', 'mod_arearecom'));
        $mform->setDefault('enable_hints', 1);

        // Enable sound
        $mform->addElement('advcheckbox', 'enable_sound', get_string('enable_sound', 'mod_arearecom'));
        $mform->setDefault('enable_sound', 1);

        // Grade settings
        $mform->addElement('header', 'gradesettings', get_string('grade_settings', 'mod_arearecom'));

        // Grade to pass
        $mform->addElement('text', 'gradepass', get_string('gradepass', 'grades'));
        $mform->setType('gradepass', PARAM_INT);
        $mform->setDefault('gradepass', 70);

        // Add standard grading elements.
        $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }

    /**
     * Enforce validation rules
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['max_attempts'] < 1) {
            $errors['max_attempts'] = get_string('error_max_attempts', 'mod_arearecom');
        }

        if ($data['gradepass'] < 0 || $data['gradepass'] > 100) {
            $errors['gradepass'] = get_string('error_gradepass', 'mod_arearecom');
        }

        return $errors;
    }
}
