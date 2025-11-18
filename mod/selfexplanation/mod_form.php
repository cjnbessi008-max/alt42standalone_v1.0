<?php
/**
 * The main selfexplanation configuration form
 *
 * @package    mod_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_selfexplanation_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('selfexplanationname', 'selfexplanation'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'selfexplanationname', 'selfexplanation');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Prompt settings
        $mform->addElement('header', 'promptsettings', get_string('prompttext', 'selfexplanation'));

        // Prompt type
        $prompttypes = array(
            'why_know' => get_string('prompttype_why_know', 'selfexplanation'),
            'how_know' => get_string('prompttype_how_know', 'selfexplanation'),
            'what_if' => get_string('prompttype_what_if', 'selfexplanation'),
            'explain' => get_string('prompttype_explain', 'selfexplanation'),
            'custom' => get_string('prompttype_custom', 'selfexplanation'),
        );
        $mform->addElement('select', 'prompttype', get_string('prompttype', 'selfexplanation'), $prompttypes);
        $mform->setDefault('prompttype', 'why_know');
        $mform->addHelpButton('prompttype', 'prompttype', 'selfexplanation');

        // Custom prompt text
        $mform->addElement('textarea', 'prompttext', get_string('prompttext', 'selfexplanation'),
            'wrap="virtual" rows="5" cols="50"');
        $mform->setType('prompttext', PARAM_RAW);
        $mform->addHelpButton('prompttext', 'prompttext', 'selfexplanation');
        $mform->disabledIf('prompttext', 'prompttype', 'neq', 'custom');

        // Response settings
        $mform->addElement('header', 'responsesettings', get_string('yourresponse', 'selfexplanation'));

        // Minimum words
        $mform->addElement('text', 'minwords', get_string('minwords', 'selfexplanation'), array('size' => '10'));
        $mform->setType('minwords', PARAM_INT);
        $mform->setDefault('minwords', 20);
        $mform->addHelpButton('minwords', 'minwords', 'selfexplanation');

        // Allow resubmit
        $mform->addElement('selectyesno', 'allowresubmit', get_string('allowresubmit', 'selfexplanation'));
        $mform->setDefault('allowresubmit', 1);
        $mform->addHelpButton('allowresubmit', 'allowresubmit', 'selfexplanation');

        // Display feedback
        $mform->addElement('selectyesno', 'displayfeedback', get_string('displayfeedback', 'selfexplanation'));
        $mform->setDefault('displayfeedback', 1);
        $mform->addHelpButton('displayfeedback', 'displayfeedback', 'selfexplanation');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }

    /**
     * Perform minimal validation on the settings form
     * @param array $data
     * @param array $files
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['prompttype'] == 'custom' && empty($data['prompttext'])) {
            $errors['prompttext'] = get_string('error:invalidresponse', 'selfexplanation');
        }

        if ($data['minwords'] < 0) {
            $errors['minwords'] = get_string('error:invalidresponse', 'selfexplanation');
        }

        return $errors;
    }
}
