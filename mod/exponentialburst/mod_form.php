<?php
// This file is part of Moodle - http://moodle.org/

/**
 * The main exponentialburst configuration form
 *
 * @package    mod_exponentialburst
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 */
class mod_exponentialburst_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('exponentialburstname', 'exponentialburst'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'exponentialburstname', 'exponentialburst');

        // Adding the standard "intro" and "introformat" fields.
        $this->standard_intro_elements();

        // Adding custom settings.
        $mform->addElement('header', 'exponentialburstfieldset', get_string('pluginname', 'exponentialburst'));

        // Difficulty level
        $options = array();
        for ($i = 1; $i <= 5; $i++) {
            $options[$i] = $i;
        }
        $mform->addElement('select', 'difficulty', get_string('difficulty', 'exponentialburst'), $options);
        $mform->setDefault('difficulty', 1);
        $mform->addHelpButton('difficulty', 'difficulty', 'exponentialburst');

        // Maximum value
        $mform->addElement('text', 'maxvalue', get_string('maxvalue', 'exponentialburst'));
        $mform->setType('maxvalue', PARAM_INT);
        $mform->setDefault('maxvalue', 100);
        $mform->addHelpButton('maxvalue', 'maxvalue', 'exponentialburst');

        // Show graph
        $mform->addElement('advcheckbox', 'showgraph', get_string('showgraph', 'exponentialburst'));
        $mform->setDefault('showgraph', 1);
        $mform->addHelpButton('showgraph', 'showgraph', 'exponentialburst');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }
}
