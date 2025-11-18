<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Settings for Anxiety Detection Plugin
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_anxiety', get_string('pluginname', 'local_anxiety'));

    // Heading
    $settings->add(new admin_setting_heading(
        'local_anxiety/settings_heading',
        get_string('settings_heading', 'local_anxiety'),
        ''
    ));

    // Mild threshold
    $settings->add(new admin_setting_configtext(
        'local_anxiety/mild_threshold',
        get_string('mild_threshold', 'local_anxiety'),
        get_string('mild_threshold_desc', 'local_anxiety'),
        30,
        PARAM_FLOAT
    ));

    // Moderate threshold
    $settings->add(new admin_setting_configtext(
        'local_anxiety/moderate_threshold',
        get_string('moderate_threshold', 'local_anxiety'),
        get_string('moderate_threshold_desc', 'local_anxiety'),
        50,
        PARAM_FLOAT
    ));

    // Severe threshold
    $settings->add(new admin_setting_configtext(
        'local_anxiety/severe_threshold',
        get_string('severe_threshold', 'local_anxiety'),
        get_string('severe_threshold_desc', 'local_anxiety'),
        70,
        PARAM_FLOAT
    ));

    // Enable alerts
    $settings->add(new admin_setting_configcheckbox(
        'local_anxiety/enable_alerts',
        get_string('enable_alerts', 'local_anxiety'),
        get_string('enable_alerts_desc', 'local_anxiety'),
        1
    ));

    // Alert frequency
    $settings->add(new admin_setting_configtext(
        'local_anxiety/alert_frequency',
        get_string('alert_frequency', 'local_anxiety'),
        get_string('alert_frequency_desc', 'local_anxiety'),
        300,
        PARAM_INT
    ));

    $ADMIN->add('localplugins', $settings);
}
