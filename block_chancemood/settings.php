<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    // Enable/disable Chance Mood block
    $settings->add(new admin_setting_configcheckbox(
        'block_chancemood/enabled',
        get_string('config_enable', 'block_chancemood'),
        get_string('config_enable', 'block_chancemood'),
        1
    ));

    // Display position
    $positions = array(
        'bottom-right' => 'Bottom Right (Default)',
        'bottom-left' => 'Bottom Left',
        'top-right' => 'Top Right',
        'top-left' => 'Top Left'
    );

    $settings->add(new admin_setting_configselect(
        'block_chancemood/position',
        get_string('config_position', 'block_chancemood'),
        get_string('config_position_desc', 'block_chancemood'),
        'bottom-right',
        $positions
    ));

    // Auto-refresh interval (minutes)
    $settings->add(new admin_setting_configtext(
        'block_chancemood/refresh_interval',
        'Auto-refresh Interval (minutes)',
        'How often to refresh mood data automatically',
        5,
        PARAM_INT
    ));

    // Enable sample data for testing
    $settings->add(new admin_setting_configcheckbox(
        'block_chancemood/use_sample_data',
        'Use Sample Data',
        'Enable sample data for testing when no real problems are found',
        1
    ));
}
