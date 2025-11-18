<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Global settings for Student Priority Selection block.
 *
 * @package    block_student_priority
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {

    // Allow changes by default
    $settings->add(new admin_setting_configcheckbox(
        'block_student_priority/allow_change',
        get_string('config_allow_change', 'block_student_priority'),
        get_string('config_allow_change_desc', 'block_student_priority'),
        1
    ));

    // Require reason for selection
    $settings->add(new admin_setting_configcheckbox(
        'block_student_priority/require_reason',
        get_string('config_require_reason', 'block_student_priority'),
        get_string('config_require_reason_desc', 'block_student_priority'),
        0
    ));

    // Show analytics to teachers
    $settings->add(new admin_setting_configcheckbox(
        'block_student_priority/show_analytics',
        get_string('config_show_analytics', 'block_student_priority'),
        get_string('config_show_analytics_desc', 'block_student_priority'),
        1
    ));

    // Default learning steps
    $settings->add(new admin_setting_configtextarea(
        'block_student_priority/default_steps',
        get_string('config_default_steps', 'block_student_priority'),
        get_string('config_default_steps_desc', 'block_student_priority'),
        get_string('default_steps_value', 'block_student_priority'),
        PARAM_TEXT,
        60,
        10
    ));
}
