<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The main altsolutions configuration form
 *
 * @package    mod_altsolutions
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_altsolutions_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('altsolutionsname', 'altsolutions'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'altsolutionsname', 'altsolutions');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Problem text.
        $mform->addElement('editor', 'problemtext_editor', get_string('problemtext', 'altsolutions'),
            array('rows' => 10), array('maxfiles' => EDITOR_UNLIMITED_FILES, 'noclean' => true,
            'context' => $this->context, 'subdirs' => true));
        $mform->setType('problemtext_editor', PARAM_RAW);
        $mform->addRule('problemtext_editor', null, 'required', null, 'client');
        $mform->addHelpButton('problemtext_editor', 'problemtext', 'altsolutions');

        // Settings.
        $mform->addElement('header', 'settingshdr', get_string('settings'));

        $mform->addElement('text', 'minsteps', get_string('minsteps', 'altsolutions'), array('size' => '6'));
        $mform->setType('minsteps', PARAM_INT);
        $mform->setDefault('minsteps', 3);
        $mform->addHelpButton('minsteps', 'minsteps', 'altsolutions');

        $mform->addElement('text', 'minalternatives', get_string('minalternatives', 'altsolutions'), array('size' => '6'));
        $mform->setType('minalternatives', PARAM_INT);
        $mform->setDefault('minalternatives', 2);
        $mform->addHelpButton('minalternatives', 'minalternatives', 'altsolutions');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }

    /**
     * Enforce validation rules here
     *
     * @param array $data array of ("fieldname"=>value) of submitted data
     * @param array $files array of uploaded files "element_name"=>tmp_file_path
     * @return array of "element_name"=>"error_description" if there are errors,
     *         or an empty array if everything is OK.
     */
    public function validation($data, $files) {
        $errors = parent::validation($data, $files);

        if ($data['minsteps'] < 1) {
            $errors['minsteps'] = get_string('error', 'altsolutions');
        }

        if ($data['minalternatives'] < 1) {
            $errors['minalternatives'] = get_string('error', 'altsolutions');
        }

        return $errors;
    }

    /**
     * Allows module to modify the data returned by get_moduleinfo_data or prepare_new_moduleinfo_data before calling set_data()
     * This method is also called in the bulk activity completion form.
     *
     * @param array $defaultvalues passed by reference
     */
    public function data_preprocessing(&$defaultvalues) {
        if ($this->current->instance) {
            $draftitemid = file_get_submitted_draft_itemid('problemtext');
            $defaultvalues['problemtext_editor']['text'] = file_prepare_draft_area(
                $draftitemid,
                $this->context->id,
                'mod_altsolutions',
                'problemtext',
                0,
                array('subdirs' => true),
                $defaultvalues['problemtext']
            );
            $defaultvalues['problemtext_editor']['format'] = $defaultvalues['problemformat'];
            $defaultvalues['problemtext_editor']['itemid'] = $draftitemid;
        }
    }
}
