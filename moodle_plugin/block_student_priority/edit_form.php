<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Block configuration form for Student Priority Selection block.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Configuration form for Student Priority Selection block
 */
class block_student_priority_edit_form extends block_edit_form {

    /**
     * Extend the block configuration form
     *
     * @param MoodleQuickForm $mform Form instance
     */
    protected function specific_definition($mform) {

        // Section header
        $mform->addElement('header', 'config_header',
                          get_string('blocksettings', 'block'));

        // Custom learning steps
        $mform->addElement('textarea', 'config_custom_steps',
                          get_string('config_custom_steps', 'block_student_priority'),
                          array('rows' => 10, 'cols' => 50));
        $mform->setType('config_custom_steps', PARAM_TEXT);
        $mform->addHelpButton('config_custom_steps', 'config_custom_steps', 'block_student_priority');
        $mform->addElement('static', 'custom_steps_help', '',
                          get_string('config_custom_steps_desc', 'block_student_priority'));

        // Allow changes
        $mform->addElement('advcheckbox', 'config_allow_change',
                          get_string('config_allow_change', 'block_student_priority'));
        $mform->setType('config_allow_change', PARAM_BOOL);
        $mform->setDefault('config_allow_change', 1);
        $mform->addHelpButton('config_allow_change', 'config_allow_change', 'block_student_priority');

        // Require reason
        $mform->addElement('advcheckbox', 'config_require_reason',
                          get_string('config_require_reason', 'block_student_priority'));
        $mform->setType('config_require_reason', PARAM_BOOL);
        $mform->setDefault('config_require_reason', 0);
        $mform->addHelpButton('config_require_reason', 'config_require_reason', 'block_student_priority');

        // Show analytics
        $mform->addElement('advcheckbox', 'config_show_analytics',
                          get_string('config_show_analytics', 'block_student_priority'));
        $mform->setType('config_show_analytics', PARAM_BOOL);
        $mform->setDefault('config_show_analytics', 1);
        $mform->addHelpButton('config_show_analytics', 'config_show_analytics', 'block_student_priority');
    }
}
