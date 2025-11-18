<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Settings for local_engagementalert plugin
 *
 * @package    local_engagementalert
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die;

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_engagementalert', get_string('pluginname', 'local_engagementalert'));

    // Add settings page to the admin menu
    $ADMIN->add('localplugins', $settings);

    // Inactivity threshold
    $settings->add(new admin_setting_configtext(
        'local_engagementalert/inactive_threshold',
        get_string('inactive_threshold', 'local_engagementalert'),
        get_string('inactive_threshold_desc', 'local_engagementalert'),
        120,
        PARAM_INT
    ));

    // Unfocus threshold
    $settings->add(new admin_setting_configtext(
        'local_engagementalert/unfocus_threshold',
        get_string('unfocus_threshold', 'local_engagementalert'),
        get_string('unfocus_threshold_desc', 'local_engagementalert'),
        60,
        PARAM_INT
    ));

    // Enable student alerts
    $settings->add(new admin_setting_configcheckbox(
        'local_engagementalert/enable_student_alerts',
        get_string('enable_student_alerts', 'local_engagementalert'),
        get_string('enable_student_alerts_desc', 'local_engagementalert'),
        1
    ));

    // Enable teacher alerts
    $settings->add(new admin_setting_configcheckbox(
        'local_engagementalert/enable_teacher_alerts',
        get_string('enable_teacher_alerts', 'local_engagementalert'),
        get_string('enable_teacher_alerts_desc', 'local_engagementalert'),
        1
    ));

    // Tracking interval
    $settings->add(new admin_setting_configtext(
        'local_engagementalert/tracking_interval',
        get_string('tracking_interval', 'local_engagementalert'),
        get_string('tracking_interval_desc', 'local_engagementalert'),
        30,
        PARAM_INT
    ));

    // Alert cooldown
    $settings->add(new admin_setting_configtext(
        'local_engagementalert/alert_cooldown',
        get_string('alert_cooldown', 'local_engagementalert'),
        get_string('alert_cooldown_desc', 'local_engagementalert'),
        300,
        PARAM_INT
    ));
}
