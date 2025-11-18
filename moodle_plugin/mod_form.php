<?php
// Module instance settings form

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_dotcollector_mod_form extends moodleform_mod {

    function definition() {
        global $CFG;

        $mform = $this->_form;

        // General section
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Name field
        $mform->addElement('text', 'name', get_string('dotcollectorname', 'dotcollector'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Intro field
        $this->standard_intro_elements();

        // Standard coursemodule elements
        $this->standard_coursemodule_elements();

        // Action buttons
        $this->add_action_buttons();
    }
}
