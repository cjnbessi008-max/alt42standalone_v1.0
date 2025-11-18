<?php
/**
 * Module instance settings form for Shape Guide Lines Generator
 * Moodle 3.7 compatible
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_shapeguide_mod_form extends moodleform_mod {

    /**
     * Define the form
     */
    function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are shown
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field
        $mform->addElement('text', 'name', get_string('shapeguidename', 'shapeguide'), array('size'=>'64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" field
        $this->standard_intro_elements();

        // Shape Guide Settings
        $mform->addElement('header', 'shapeguidesettings', get_string('shapeguidesettings', 'shapeguide'));

        // Auto-generate parallel lines
        $mform->addElement('advcheckbox', 'autoparallel', get_string('autoparallel', 'shapeguide'));
        $mform->setDefault('autoparallel', 1);
        $mform->addHelpButton('autoparallel', 'autoparallel', 'shapeguide');

        // Auto-generate perpendicular lines
        $mform->addElement('advcheckbox', 'autoperpendicular', get_string('autoperpendicular', 'shapeguide'));
        $mform->setDefault('autoperpendicular', 1);
        $mform->addHelpButton('autoperpendicular', 'autoperpendicular', 'shapeguide');

        // Show labels
        $mform->addElement('advcheckbox', 'showlabels', get_string('showlabels', 'shapeguide'));
        $mform->setDefault('showlabels', 1);

        // Allow students to create shapes
        $mform->addElement('advcheckbox', 'allowstudentcreate', get_string('allowstudentcreate', 'shapeguide'));
        $mform->setDefault('allowstudentcreate', 1);

        // Parallel line color
        $mform->addElement('text', 'parallelcolor', get_string('parallelcolor', 'shapeguide'));
        $mform->setType('parallelcolor', PARAM_TEXT);
        $mform->setDefault('parallelcolor', '#4ECDC4');

        // Perpendicular line color
        $mform->addElement('text', 'perpendicularcolor', get_string('perpendicularcolor', 'shapeguide'));
        $mform->setType('perpendicularcolor', PARAM_TEXT);
        $mform->setDefault('perpendicularcolor', '#FF6B6B');

        // Add standard elements, common to all modules
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules
        $this->add_action_buttons();
    }
}
