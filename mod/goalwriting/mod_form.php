<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The main goalwriting configuration form
 *
 * @package    mod_goalwriting
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_goalwriting_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are shown
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('goalwritingname', 'goalwriting'),
            array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'goalwritingname', 'goalwriting');

        // Adding the standard "intro" and "introformat" fields
        $this->standard_intro_elements();

        // Problem text
        $mform->addElement('editor', 'problemtext_editor', get_string('problemtext', 'goalwriting'),
            array('rows' => 10), array('maxfiles' => 0));
        $mform->setType('problemtext_editor', PARAM_RAW);
        $mform->addHelpButton('problemtext_editor', 'problemtext', 'goalwriting');

        // Word count settings
        $mform->addElement('text', 'minwords', get_string('minwords', 'goalwriting'),
            array('size' => '10'));
        $mform->setType('minwords', PARAM_INT);
        $mform->setDefault('minwords', 10);
        $mform->addHelpButton('minwords', 'minwords', 'goalwriting');

        $mform->addElement('text', 'maxwords', get_string('maxwords', 'goalwriting'),
            array('size' => '10'));
        $mform->setType('maxwords', PARAM_INT);
        $mform->setDefault('maxwords', 500);
        $mform->addHelpButton('maxwords', 'maxwords', 'goalwriting');

        // Resubmission
        $mform->addElement('advcheckbox', 'allowresubmit', get_string('allowresubmit', 'goalwriting'));
        $mform->setDefault('allowresubmit', 1);
        $mform->addHelpButton('allowresubmit', 'allowresubmit', 'goalwriting');

        // Add standard grading elements
        $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }

    /**
     * Prepares the form before data are set
     *
     * @param array $defaultvalues
     */
    public function data_preprocessing(&$defaultvalues) {
        if ($this->current->instance) {
            // Editing existing instance
            $draftitemid = file_get_submitted_draft_itemid('problemtext');
            $defaultvalues['problemtext_editor']['text'] =
                file_prepare_draft_area($draftitemid, $this->context->id,
                    'mod_goalwriting', 'problemtext', 0,
                    array('subdirs' => false),
                    isset($defaultvalues['problemtext']) ? $defaultvalues['problemtext'] : '');
            $defaultvalues['problemtext_editor']['format'] =
                isset($defaultvalues['problemformat']) ? $defaultvalues['problemformat'] : FORMAT_HTML;
            $defaultvalues['problemtext_editor']['itemid'] = $draftitemid;
        }
    }

    /**
     * Validates the form data
     *
     * @param array $data
     * @param array $files
     * @return array errors
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['minwords'] < 0) {
            $errors['minwords'] = get_string('errorminwords', 'goalwriting', 0);
        }

        if ($data['maxwords'] < $data['minwords']) {
            $errors['maxwords'] = get_string('errormaxwords', 'goalwriting', $data['minwords']);
        }

        return $errors;
    }
}
