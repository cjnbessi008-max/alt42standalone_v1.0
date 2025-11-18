<?php
/**
 * The main overlap_field configuration form
 *
 * @package    mod_overlap_field
 * @copyright  2025 KAIST
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_overlap_field_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('overlap_fieldname', 'overlap_field'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields
        $this->standard_intro_elements();

        // Inequalities definition
        $mform->addElement('header', 'inequalitiessection', get_string('inequalities', 'overlap_field'));

        $mform->addElement('textarea', 'inequalities_text', get_string('inequalities', 'overlap_field'),
                'wrap="virtual" rows="10" cols="50"');
        $mform->setType('inequalities_text', PARAM_TEXT);
        $mform->addHelpButton('inequalities_text', 'inequalities', 'overlap_field');
        $mform->addRule('inequalities_text', null, 'required', null, 'client');

        // Visualization configuration (optional)
        $mform->addElement('textarea', 'visualization_config', get_string('visualization_config', 'overlap_field'),
                'wrap="virtual" rows="5" cols="50"');
        $mform->setType('visualization_config', PARAM_TEXT);
        $mform->setAdvanced('visualization_config');

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Prepares the form before data are set
     *
     * @param array $data to be set
     */
    public function data_preprocessing(&$data) {
        // Convert JSON inequalities back to text for editing
        if (isset($data['inequalities'])) {
            $inequalities = json_decode($data['inequalities']);
            if (is_array($inequalities)) {
                $data['inequalities_text'] = implode("\n", $inequalities);
            }
        }
    }
}
